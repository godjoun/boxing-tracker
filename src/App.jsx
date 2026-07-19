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
import "./App.css";

/** 하단 탭을 숨기고 풀스크린으로 쓰는 부가 화면 (안 B 하이브리드) */
const FULLSCREEN_PAGES = new Set([
  "curriculum",
  "strength",
  "combo-creator",
  "gym",
  "backup",
  "timer",
  "growth",
]);

export default function App() {
  return (
    <TrainingProvider>
      <AppFlow />
    </TrainingProvider>
  );
}

function useAppTheme() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("fitness-league-theme") || "dark";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === "light" ? "dark" : "light";
      localStorage.setItem("fitness-league-theme", nextTheme);
      return nextTheme;
    });
  };

  return { theme, toggleTheme };
}

function AppFlow() {
  const { profile } = useTraining();
  const { theme, toggleTheme } = useAppTheme();

  if (needsOnboarding(profile)) {
    return (
      <div className={`app-shell theme-${theme}`}>
        <OnboardingSetupPage />
      </div>
    );
  }

  return <MainAppShell theme={theme} toggleTheme={toggleTheme} />;
}

function MainAppShell({ theme, toggleTheme }) {
  const { logs, profile, grantFighterLevel } = useTraining();
  const [currentPage, setCurrentPage] = useState("home");
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialSession, setTutorialSession] = useState(0);
  const [gymView, setGymView] = useState("hub");
  const [profileScrollTarget, setProfileScrollTarget] = useState(null);
  const [cardMakerLogId, setCardMakerLogId] = useState(null);
  const [timerLaunch, setTimerLaunch] = useState(null);
  const [profileStudioOpen, setProfileStudioOpen] = useState(false);
  const isDark = theme === "dark";
  const fighterLevel = useMemo(
    () => getFighterProgress(logs).level,
    [logs]
  );
  const timerSummary = useBackgroundTimerSession(currentPage);
  const isFullscreenPage =
    FULLSCREEN_PAGES.has(currentPage) ||
    (currentPage === "profile" && profileStudioOpen);

  useEffect(() => {
    if (!isTutorialComplete()) {
      setShowTutorial(true);
    }
  }, []);

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

  const goGym = (view = "hub") => {
    setGymView(view);
    setCurrentPage("gym");
  };

  const goTimerWithSession = (session) => {
    track("curriculum_session_start", {
      sessionId: session?.id || "unknown",
    });
    setTimerLaunch(buildCurriculumTimerLaunch(session));
    setCurrentPage("timer");
  };

  const goTimerWithLaunch = (launch) => {
    setTimerLaunch(launch);
    setCurrentPage("timer");
  };

  const goDefaultTimer = () => {
    goTimerWithLaunch(buildPresetTimerLaunch(getTimerPresetById("match3")));
  };

  const [curriculumFocus, setCurriculumFocus] = useState(null);

  const goReadLesson = (session) => {
    if (!session?.id) return;

    track("lesson_read_start", {
      sessionId: session.id,
    });
    setCurriculumFocus({ sessionId: session.id, openDrills: true });
    setCurrentPage("curriculum");
  };

  const clearCurriculumFocus = () => {
    setCurriculumFocus(null);
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
      }`}
    >
      <main className="app-main">
        {currentPage === "home" && (
          <HomePage
            fighterLevel={fighterLevel}
            timerSummary={timerSummary}
            onStartTraining={() => goPage("train")}
            onOpenTimer={goDefaultTimer}
            onGoProfile={goProfile}
            onNavigate={goPage}
            onNavigateGym={goGym}
            onOpenCardMaker={goProfileCardMaker}
            onOpenCurriculum={() => goPage("curriculum")}
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
          />
        )}

        {currentPage === "gym" && (
          <GymFinderPage
            initialView={gymView}
            fighterLevel={fighterLevel}
            onGoBack={() => {
              setGymView("hub");
              goPage("category");
            }}
            onStartTraining={() => goPage("timer")}
          />
        )}

        {currentPage === "train" && (
          <TrainingHubPage
            fighterLevel={fighterLevel}
            onStartSession={goTimerWithSession}
            onStartPreset={(preset) => goTimerWithLaunch(buildPresetTimerLaunch(preset))}
            onOpenTimer={() => goPage("timer")}
            onOpenCurriculum={() => goPage("curriculum")}
            onOpenComboCreator={() => goPage("combo-creator")}
            onOpenStrength={() => goPage("strength")}
          />
        )}

        {currentPage === "timer" && (
          <TimerPage
            launchConfig={timerLaunch}
            onLaunchConsumed={clearTimerLaunch}
            onGoLog={() => goPage("log")}
            onGoHome={() => goPage("home")}
            onGoBack={() => goPage("train")}
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
            onOpenCurriculum={() => goPage("curriculum")}
            onStartTraining={() => goPage("timer")}
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
            onStartTraining={() => goPage("timer")}
            onStudioModeChange={setProfileStudioOpen}
          />
        )}

        {currentPage === "curriculum" && (
          <CurriculumPage
            fighterLevel={fighterLevel}
            focusSessionId={curriculumFocus?.sessionId || null}
            focusOpenDrills={Boolean(curriculumFocus?.openDrills)}
            focusOpenVideo={Boolean(curriculumFocus?.openVideo)}
            onFocusConsumed={clearCurriculumFocus}
            onGoBack={() => goPage("train")}
            onStartSession={goTimerWithSession}
            onOpenComboCreator={() => goPage("combo-creator")}
            onStartTraining={() => goPage("timer")}
          />
        )}

        {currentPage === "strength" && (
          <StrengthProgramPage
            onGoBack={() => goPage("train")}
            onStartWarmup={goTimerWithLaunch}
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
              onStartTraining={() => goPage("timer")}
            />
          ))}
      </main>

      <button
        type="button"
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={isDark ? "밝은 화면으로 변경" : "다크 화면으로 변경"}
      >
        <span aria-hidden="true">{isDark ? "L" : "D"}</span>
      </button>

      {showTutorial ? (
        <FirstVisitTutorial
          key={tutorialSession}
          nickname={profile?.nickname}
          onClose={closeTutorial}
          onEnsurePage={goPage}
          onStartTimer={() => goPage("timer")}
          onOpenCurriculum={() => goPage("curriculum")}
        />
      ) : null}

      {!isFullscreenPage ? (
        <nav className="app-bottom-nav" aria-label="메인 메뉴">
          <button
            type="button"
            className={getNavClass(currentPage === "home")}
            onClick={() => goPage("home")}
          >
            <span className="app-nav-icon" aria-hidden="true">
              ⌂
            </span>
            <span className="app-nav-label">홈</span>
          </button>

          <button
            type="button"
            data-tutorial-target="nav-timer"
            className={getNavClass(
              currentPage === "train" || currentPage === "timer"
            )}
            onClick={() => goPage("train")}
          >
            <span className="app-nav-icon" aria-hidden="true">
              ↑
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
              ☰
            </span>
            <span className="app-nav-label">기록</span>
          </button>

          <button
            type="button"
            className={getNavClass(currentPage === "profile")}
            onClick={goProfile}
          >
            <span className="app-nav-icon" aria-hidden="true">
              ▣
            </span>
            <span className="app-nav-label">명패</span>
          </button>

          <button
            type="button"
            data-tutorial-target="nav-category"
            className={getNavClass(
              currentPage === "category" || currentPage === "growth"
            )}
            onClick={() => goPage("category")}
          >
            <span className="app-nav-icon nav-category-icon" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
            <span className="app-nav-label">더보기</span>
          </button>
        </nav>
      ) : null}

      <Analytics />
    </div>
  );
}
