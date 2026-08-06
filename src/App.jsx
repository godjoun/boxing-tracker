import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
import "./reference-layout.css";

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

  // 앱 셸(온보딩/홈)이 준비되면 즉시 스플래시 → 앱 한 번만 전환.
  // 인위적 최소 표시 시간·페이드 겹침 없음. #root는 .app-ready 전까지 숨김.
  useLayoutEffect(() => {
    dismissBootSplash();
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
  const appMainRef = useRef(null);
  const [currentPage, setCurrentPage] = useState("home");
  const [showTutorial, setShowTutorial] = useState(() => !isTutorialComplete());
  const [tutorialSession, setTutorialSession] = useState(0);
  const [gymView, setGymView] = useState("feed");
  const [profileScrollTarget, setProfileScrollTarget] = useState(null);
  const [cardMakerLogId, setCardMakerLogId] = useState(null);
  const [timerLaunch, setTimerLaunch] = useState(null);
  const [timerReturnPage, setTimerReturnPage] = useState(readTimerReturnPage);
  const [curriculumReturnStyle, setCurriculumReturnStyle] = useState(
    readCurriculumReturnStyle
  );
  const [profileStudioOpen, setProfileStudioOpen] = useState(false);
  /** 전체 메뉴·훈련 등에서 연 부가 화면의 복귀 목적지 */
  const [toolReturnPage, setToolReturnPage] = useState("train");
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
    if (appMainRef.current) {
      appMainRef.current.scrollTop = 0;
    }
  }, [currentPage]);

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

  const goRivalProfile = () => {
    setProfileScrollTarget("rivalCard");
    setCardMakerLogId(null);
    setProfileStudioOpen(false);
    setCurrentPage("profile");
  };

  const goGym = (view = "feed") => {
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
    setToolReturnPage("home");
    rememberCurriculumReturnStyle(null);
    setCurriculumFocus({ sessionId: session.id, openDrills: true });
    setCurrentPage("curriculum");
  };

  const clearCurriculumFocus = () => {
    setCurriculumFocus(null);
  };

  const goCurriculum = (returnPage = "train") => {
    setToolReturnPage(returnPage);
    rememberCurriculumReturnStyle(null);
    setCurriculumFocus(null);
    setCurrentPage("curriculum");
  };

  const goFromCategory = (page) => {
    setToolReturnPage("category");
    goPage(page);
  };

  const goGymFromCategory = (view = "feed") => {
    setToolReturnPage("category");
    goGym(view);
  };

  const goCardMakerFromCategory = () => {
    setToolReturnPage("category");
    goProfileCardMaker();
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
      <main className="app-main" ref={appMainRef}>
        {currentPage === "home" && (
          <HomePage
            timerSummary={timerSummary}
            onOpenTimer={() => goDefaultTimer("home")}
            onNavigate={goPage}
            onOpenCardMaker={goProfileCardMaker}
            onOpenCurriculum={() => goCurriculum("home")}
            onOpenGrowth={() => goPage("growth")}
            onReadLesson={goReadLesson}
          />
        )}

        {currentPage === "category" && (
          <CategoryPage
            onGoHome={() => goPage("home")}
            onNavigate={goFromCategory}
            onNavigateGym={goGymFromCategory}
            onOpenCardMaker={goCardMakerFromCategory}
            onReplayTutorial={openTutorial}
            theme={theme}
            onToggleTheme={onToggleTheme}
          />
        )}

        {currentPage === "gym" && (
          <GymFinderPage
            initialView={gymView}
            fighterLevel={fighterLevel}
            onGoRivalProfile={goRivalProfile}
            onStartTraining={() => openTimerFrom("gym")}
          />
        )}

        {currentPage === "train" && (
          <TrainingHubPage
            fighterLevel={fighterLevel}
            onStartPreset={(preset) =>
              goTimerWithLaunch(
                buildPresetTimerLaunch(preset, { autoStart: true }),
                "train"
              )
            }
            onOpenTimer={(preset) => {
              if (preset) {
                goTimerWithLaunch(
                  buildPresetTimerLaunch(preset, { autoStart: false }),
                  "train"
                );
                return;
              }
              openTimerFrom("train");
            }}
            onOpenCurriculum={() => goCurriculum("train")}
            onOpenComboCreator={() => {
              setToolReturnPage("curriculum");
              goPage("combo-creator");
            }}
            onOpenStrength={() => {
              setToolReturnPage("train");
              goPage("strength");
            }}
            onOpenLog={() => goPage("log")}
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
              gym: "체육관",
              profile: "명패",
              growth: "성장",
            }[timerReturnPage] || "훈련"}
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
            onOpenCurriculum={() => goCurriculum("growth")}
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
            onStartTraining={() => openTimerFrom("profile")}
            onStudioModeChange={setProfileStudioOpen}
            onStudioBack={
              toolReturnPage === "category" &&
              profileScrollTarget === "cardMaker"
                ? () => goPage("category")
                : undefined
            }
            onOpenGrowth={() => goPage("growth")}
            onGoLog={() => goPage("log")}
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
            onGoBack={() => goPage(toolReturnPage)}
            onStartSession={goTimerWithSession}
            onOpenComboCreator={() => {
              setToolReturnPage(
                toolReturnPage === "category" ? "category" : "curriculum"
              );
              goPage("combo-creator");
            }}
            onStartTraining={() => openTimerFrom("curriculum")}
          />
        )}

        {currentPage === "strength" && (
          <StrengthProgramPage
            onGoBack={() => goPage(toolReturnPage)}
            onStartDay={(launch) => goTimerWithLaunch(launch, "strength")}
          />
        )}

        {currentPage === "combo-creator" &&
          (isComboCreatorUnlocked(fighterLevel) ? (
            <ComboCreatorPage
              onGoBack={() => goPage(toolReturnPage)}
              onStartSession={goTimerWithSession}
            />
          ) : (
            <FeatureLockScreen
              featureId="combo-creator"
              currentLevel={fighterLevel}
              onBack={() => goPage(toolReturnPage)}
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
            <span className="app-nav-label">훈련</span>
          </button>

          <button
            type="button"
            data-tutorial-target="nav-log"
            className={getNavClass(currentPage === "log")}
            onClick={() => goPage("log")}
          >
            <span className="app-nav-icon" aria-hidden="true">
              <MenuIcon name="log" size={20} />
            </span>
            <span className="app-nav-label">기록</span>
          </button>

          <button
            type="button"
            className={getNavClass(currentPage === "home")}
            onClick={() => goPage("home")}
          >
            <span className="app-nav-icon" aria-hidden="true">
              <MenuIcon name="home" size={20} />
            </span>
            <span className="app-nav-label">홈</span>
          </button>

          <button
            type="button"
            data-tutorial-target="nav-dojo"
            className={getNavClass(currentPage === "profile")}
            onClick={() => goProfile()}
          >
            <span className="app-nav-icon" aria-hidden="true">
              <MenuIcon name="nameplate" size={20} />
            </span>
            <span className="app-nav-label">프로필</span>
          </button>

          <button
            type="button"
            data-tutorial-target="nav-category"
            className={getNavClass(
              currentPage === "category" ||
                currentPage === "growth" ||
                currentPage === "gym" ||
                currentPage === "backup"
            )}
            onClick={() => goPage("category")}
          >
            <span className="app-nav-icon" aria-hidden="true">
              <MenuIcon name="more" size={20} />
            </span>
            <span className="app-nav-label">전체</span>
          </button>
        </nav>
      ) : null}

      <Analytics />
    </div>
  );
}
