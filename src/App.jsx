import { useEffect, useMemo, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { track } from "@vercel/analytics";
import { TrainingProvider, useTraining } from "./store/TrainingContext";
import HomePage from "./pages/HomePage";
import LogPage from "./pages/LogPage";
import TimerPage from "./pages/TimerPage";
import ProfilePage from "./pages/ProfilePage";
import CategoryPage from "./pages/CategoryPage";
import GymFinderPage from "./pages/GymFinderPage";
import DataBackupPage from "./pages/DataBackupPage";
import CurriculumPage from "./pages/CurriculumPage";
import ComboCreatorPage from "./pages/ComboCreatorPage";
import StrengthProgramPage from "./pages/StrengthProgramPage";
import TrainingHubPage from "./pages/TrainingHubPage";
import GrowthHubPage from "./pages/GrowthHubPage";
import FeatureLockScreen from "./components/FeatureLockScreen";
import OnboardingSetupPage from "./pages/OnboardingSetupPage";
import FirstVisitTutorial from "./components/FirstVisitTutorial";
import MenuIcon from "./components/MenuIcon";
import AppErrorBoundary from "./components/AppErrorBoundary";
import { useBackgroundTimerSession } from "./hooks/useBackgroundTimerSession";
import { needsOnboarding } from "./utils/bodySpecs";
import { isTutorialComplete } from "./utils/tutorial";
import { getFighterProgress } from "./utils/fighterProgress";
import { buildCurriculumTimerLaunch } from "./utils/homeCurriculum";
import {
  buildPresetTimerLaunch,
  getTimerPresetById,
} from "./utils/timerPresets";
import { isComboCreatorUnlocked } from "./utils/featureUnlocks";
import { recordAppOpen } from "./utils/retentionMetrics";
import { isDevMode } from "./utils/devMode";
import {
  applyDocumentTheme,
  getStoredTheme,
  setStoredTheme,
} from "./utils/theme";
import { dismissBootSplash } from "./utils/bootSplash";
import "./App.css";

const TIMER_RETURN_PAGE_KEY = "mantle-timer-return-page";
const LEGACY_TIMER_RETURN_PAGE_KEY = "anima-timer-return-page";
const CURRICULUM_RETURN_STYLE_KEY = "mantle-curriculum-return-style";
const LEGACY_CURRICULUM_RETURN_STYLE_KEY = "anima-curriculum-return-style";

function readTimerReturnPage() {
  if (typeof sessionStorage === "undefined") return "train";
  return (
    sessionStorage.getItem(TIMER_RETURN_PAGE_KEY) ||
    sessionStorage.getItem(LEGACY_TIMER_RETURN_PAGE_KEY) ||
    "train"
  );
}

function readCurriculumReturnStyle() {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw =
      sessionStorage.getItem(CURRICULUM_RETURN_STYLE_KEY) ||
      sessionStorage.getItem(LEGACY_CURRICULUM_RETURN_STYLE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** 하단 탭을 숨기고 풀스크린으로 쓰는 부가 화면 (안 B 하이브리드) */
const FULLSCREEN_PAGES = new Set([
  "curriculum",
  "strength",
  "combo-creator",
  "backup",
  "timer",
  "growth",
]);

/** 하단 탭은 유지하되 본문을 끝까지 채우는 지도형 화면 */
const EDGE_TO_NAV_PAGES = new Set(["gym"]);

export default function App() {
  return (
    <AppErrorBoundary>
      <TrainingProvider>
        <AppFlow />
      </TrainingProvider>
    </AppErrorBoundary>
  );
}

function AppFlow() {
  const { profile } = useTraining();
  const [theme, setTheme] = useState(getStoredTheme);
  const onboarding = needsOnboarding(profile);

  useEffect(() => {
    applyDocumentTheme(theme);
  }, [theme]);

  // HTML 부트 스플래시 → React 첫 화면이 덮은 뒤 제거 (앱이 먼저 비치지 않게)
  useEffect(() => {
    let timeoutId;
    const frame = window.requestAnimationFrame(() => {
      if (onboarding) {
        dismissBootSplash({ fade: false });
        return;
      }
      timeoutId = window.setTimeout(() => dismissBootSplash({ fade: true }), 420);
    });
    return () => {
      window.cancelAnimationFrame(frame);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
    // Cold-boot handoff only — initial cover state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleTheme() {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      setStoredTheme(next);
      return next;
    });
  }

  if (onboarding) {
    return (
      <div className={`app-shell theme-${theme}`}>
        <OnboardingSetupPage />
      </div>
    );
  }

  return <MainAppShell theme={theme} onToggleTheme={toggleTheme} />;
}

function MainAppShell({ theme, onToggleTheme }) {
  const { logs, profile, grantFighterLevel } = useTraining();
  const [currentPage, setCurrentPage] = useState("home");
  const [showTutorial, setShowTutorial] = useState(() => !isTutorialComplete());
  const [tutorialSession, setTutorialSession] = useState(0);
  const [gymView, setGymView] = useState("gyms");
  const [profileScrollTarget, setProfileScrollTarget] = useState(null);
  const [cardMakerLogId, setCardMakerLogId] = useState(null);
  const [timerLaunch, setTimerLaunch] = useState(null);
  const [timerReturnPage, setTimerReturnPage] = useState(readTimerReturnPage);
  const [curriculumReturnStyle, setCurriculumReturnStyle] = useState(
    readCurriculumReturnStyle
  );
  const [profileStudioOpen, setProfileStudioOpen] = useState(false);
  const fighterLevel = useMemo(
    () => getFighterProgress(logs).level,
    [logs]
  );
  const timerSummary = useBackgroundTimerSession(currentPage);
  const isFullscreenPage =
    FULLSCREEN_PAGES.has(currentPage) ||
    (currentPage === "profile" && profileStudioOpen);
  const isEdgeToNavPage = EDGE_TO_NAV_PAGES.has(currentPage);

  useEffect(() => {
    recordAppOpen();
  }, []);

  useEffect(() => {
    if (!isDevMode() || !grantFighterLevel) return;

    if (getFighterProgress(logs).level < 10) {
      grantFighterLevel(10);
    }
  }, [grantFighterLevel, logs]);

  const goPage = (page) => {
    if (page !== "profile") {
      setProfileScrollTarget(null);
      setCardMakerLogId(null);
      setProfileStudioOpen(false);
    }

    setCurrentPage(page);
  };

  const goProfile = () => {
    setProfileScrollTarget(null);
    setCardMakerLogId(null);
    setProfileStudioOpen(false);
    setCurrentPage("profile");
  };

  const goProfileCardMaker = (logId = null) => {
    setCardMakerLogId(logId || null);
    setProfileScrollTarget("cardMaker");
    setCurrentPage("profile");
  };

  const goGym = (view = "gyms") => {
    setGymView(view);
    setCurrentPage("gym");
  };

  const rememberTimerReturnPage = (page) => {
    setTimerReturnPage(page);
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(TIMER_RETURN_PAGE_KEY, page);
    }
  };

  const rememberCurriculumReturnStyle = (style) => {
    setCurriculumReturnStyle(style);
    if (typeof sessionStorage === "undefined") return;
    if (style) {
      sessionStorage.setItem(
        CURRICULUM_RETURN_STYLE_KEY,
        JSON.stringify(style)
      );
    } else {
      sessionStorage.removeItem(CURRICULUM_RETURN_STYLE_KEY);
    }
  };

  const goTimerWithSession = (session) => {
    track("curriculum_session_start", {
      sessionId: session?.id || "unknown",
    });
    rememberTimerReturnPage("curriculum");
    if (session?.styleId) {
      rememberCurriculumReturnStyle({
        styleId: session.styleId,
        categoryId: session.styleCategoryId || null,
      });
    } else {
      rememberCurriculumReturnStyle(null);
    }
    if (session?.id && !session?.isCustom) {
      setCurriculumFocus({ sessionId: session.id });
    }
    setTimerLaunch(buildCurriculumTimerLaunch(session));
    setCurrentPage("timer");
  };

  const goTimerWithLaunch = (launch, returnPage = "train") => {
    rememberTimerReturnPage(returnPage);
    setTimerLaunch(launch);
    setCurrentPage("timer");
  };

  const openTimerFrom = (returnPage = "train") => {
    rememberTimerReturnPage(returnPage);
    setTimerLaunch(null);
    setCurrentPage("timer");
  };

  const goDefaultTimer = (returnPage = "home") => {
    goTimerWithLaunch(
      buildPresetTimerLaunch(getTimerPresetById("match3")),
      returnPage
    );
  };

  const [curriculumFocus, setCurriculumFocus] = useState(null);

  const goReadLesson = (session) => {
    if (!session?.id) return;

    track("lesson_read_start", {
      sessionId: session.id,
    });
    rememberCurriculumReturnStyle(null);
    setCurriculumFocus({ sessionId: session.id, openDrills: true });
    setCurrentPage("curriculum");
  };

  const clearCurriculumFocus = () => {
    setCurriculumFocus(null);
  };

  const goCurriculum = () => {
    rememberCurriculumReturnStyle(null);
    setCurriculumFocus(null);
    setCurrentPage("curriculum");
  };

  const clearTimerLaunch = () => {
    setTimerLaunch(null);
  };

  const openTutorial = () => {
    goPage("home");
    setTutorialSession((current) => current + 1);
    setShowTutorial(true);
  };

  const closeTutorial = () => {
    setShowTutorial(false);
  };

  function getNavClass(isActive) {
    return `app-nav-button${isActive ? " is-active" : ""}`;
  }

  return (
    <div
      className={`app-shell theme-${theme}${
        isFullscreenPage ? " is-fullscreen" : ""
      }${isEdgeToNavPage ? " is-edge-to-nav" : ""}`}
    >
      <main className="app-main">
        {currentPage === "home" && (
          <HomePage
            fighterLevel={fighterLevel}
            timerSummary={timerSummary}
            onStartTraining={() => goPage("train")}
            onOpenTimer={() => goDefaultTimer("home")}
            onGoProfile={goProfile}
            onNavigate={goPage}
            onNavigateGym={goGym}
            onOpenCardMaker={goProfileCardMaker}
            onOpenCurriculum={goCurriculum}
            onReadLesson={goReadLesson}
          />
        )}

        {currentPage === "category" && (
          <CategoryPage
            fighterLevel={fighterLevel}
            onGoHome={() => goPage("home")}
            onNavigate={goPage}
            onNavigateGym={goGym}
            onOpenCardMaker={goProfileCardMaker}
            onReplayTutorial={openTutorial}
            theme={theme}
            onToggleTheme={onToggleTheme}
          />
        )}

        {currentPage === "gym" && (
          <GymFinderPage
            initialView={gymView}
            fighterLevel={fighterLevel}
            onStartTraining={() => openTimerFrom("gym")}
          />
        )}

        {currentPage === "train" && (
          <TrainingHubPage
            fighterLevel={fighterLevel}
            onStartPreset={(preset) =>
              goTimerWithLaunch(buildPresetTimerLaunch(preset), "train")
            }
            onOpenTimer={() => openTimerFrom("train")}
            onOpenCurriculum={goCurriculum}
            onOpenComboCreator={() => goPage("combo-creator")}
            onOpenStrength={() => goPage("strength")}
          />
        )}

        {currentPage === "timer" && (
          <TimerPage
            launchConfig={timerLaunch}
            onLaunchConsumed={clearTimerLaunch}
            onRelaunch={(launch) =>
              goTimerWithLaunch(launch, timerReturnPage)
            }
            onGoLog={() => goPage("log")}
            onGoHome={() => goPage("home")}
            onGoBack={() => goPage(timerReturnPage)}
            backLabel={{
              home: "홈",
              curriculum: "기술",
              strength: "신체",
              gym: "짐",
              profile: "명패",
              growth: "성장",
            }[timerReturnPage] || "링"}
            onGoProfile={goProfileCardMaker}
          />
        )}

        {currentPage === "log" && (
          <LogPage
            fighterLevel={fighterLevel}
            onGoProfile={goProfile}
            onGoProfileCardMaker={goProfileCardMaker}
          />
        )}

        {currentPage === "growth" && (
          <GrowthHubPage
            onOpenCurriculum={goCurriculum}
            onStartTraining={() => openTimerFrom("growth")}
            onGoBack={() => goPage("category")}
          />
        )}

        {currentPage === "backup" && (
          <DataBackupPage onGoBack={() => goPage("category")} />
        )}

        {currentPage === "profile" && (
          <ProfilePage
            scrollTarget={profileScrollTarget}
            cardMakerFocusLogId={cardMakerLogId}
            fighterLevel={fighterLevel}
            onStartTraining={() => openTimerFrom("profile")}
            onStudioModeChange={setProfileStudioOpen}
          />
        )}

        {currentPage === "curriculum" && (
          <CurriculumPage
            fighterLevel={fighterLevel}
            initialStyleId={curriculumReturnStyle?.styleId || null}
            initialCategoryId={curriculumReturnStyle?.categoryId || null}
            focusSessionId={curriculumFocus?.sessionId || null}
            focusOpenDrills={Boolean(curriculumFocus?.openDrills)}
            focusOpenVideo={Boolean(curriculumFocus?.openVideo)}
            onFocusConsumed={clearCurriculumFocus}
            onGoBack={() => goPage("train")}
            onStartSession={goTimerWithSession}
            onOpenComboCreator={() => goPage("combo-creator")}
            onStartTraining={() => openTimerFrom("curriculum")}
          />
        )}

        {currentPage === "strength" && (
          <StrengthProgramPage
            onGoBack={() => goPage("train")}
            onStartDay={(launch) => goTimerWithLaunch(launch, "strength")}
          />
        )}

        {currentPage === "combo-creator" &&
          (isComboCreatorUnlocked(fighterLevel) ? (
            <ComboCreatorPage
              onGoBack={() => goPage("curriculum")}
              onStartSession={goTimerWithSession}
            />
          ) : (
            <FeatureLockScreen
              featureId="combo-creator"
              currentLevel={fighterLevel}
              onBack={() => goPage("curriculum")}
              onStartTraining={() => openTimerFrom("curriculum")}
            />
          ))}
      </main>

      {showTutorial ? (
        <FirstVisitTutorial
          key={tutorialSession}
          nickname={profile?.nickname}
          onClose={closeTutorial}
          onEnsurePage={goPage}
          onStartTimer={() => goDefaultTimer("home")}
          onOpenCurriculum={goCurriculum}
        />
      ) : null}

      {!isFullscreenPage ? (
        <nav className="app-bottom-nav" aria-label="메인 메뉴">
          <button
            type="button"
            data-tutorial-target="nav-timer"
            className={getNavClass(
              currentPage === "train" || currentPage === "timer"
            )}
            onClick={() => goPage("train")}
          >
            <span className="app-nav-icon" aria-hidden="true">
              <MenuIcon name="ring" size={20} />
            </span>
            <span className="app-nav-label">링</span>
          </button>

          <button
            type="button"
            data-tutorial-target="nav-dojo"
            className={getNavClass(currentPage === "gym")}
            onClick={() => goGym("gyms")}
          >
            <span className="app-nav-icon" aria-hidden="true">
              <MenuIcon name="dojo" size={20} />
            </span>
            <span className="app-nav-label">짐</span>
          </button>

          <button
            type="button"
            className={`${getNavClass(currentPage === "home")} is-nav-home`}
            onClick={() => goPage("home")}
          >
            <span className="app-nav-icon" aria-hidden="true">
              <MenuIcon name="home" size={22} />
            </span>
            <span className="app-nav-label">홈</span>
          </button>

          <button
            type="button"
            data-tutorial-target="nav-profile"
            className={getNavClass(currentPage === "profile")}
            onClick={goProfile}
          >
            <span className="app-nav-icon" aria-hidden="true">
              <MenuIcon name="nameplate" size={20} />
            </span>
            <span className="app-nav-label">명패</span>
          </button>

          <button
            type="button"
            data-tutorial-target="nav-category"
            className={getNavClass(
              currentPage === "category" ||
                currentPage === "growth" ||
                currentPage === "log"
            )}
            onClick={() => goPage("category")}
          >
            <span className="app-nav-icon" aria-hidden="true">
              <MenuIcon name="more" size={20} />
            </span>
            <span className="app-nav-label">더보기</span>
          </button>
        </nav>
      ) : null}

      <Analytics />
    </div>
  );
}
