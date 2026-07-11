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
import { buildPresetTimerLaunch } from "./utils/timerPresets";
import { isComboCreatorUnlocked } from "./utils/featureUnlocks";
import "./App.css";

export default function App() {
  return (
    <TrainingProvider>
      <AppFlow />
    </TrainingProvider>
  );
}

function AppFlow() {
  const { profile } = useTraining();

  if (needsOnboarding(profile)) {
    return <OnboardingSetupPage />;
  }

  return <MainAppShell />;
}

function MainAppShell() {
  const { logs, profile } = useTraining();
  const [currentPage, setCurrentPage] = useState("home");
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialSession, setTutorialSession] = useState(0);
  const [gymView, setGymView] = useState("hub");
  const [profileScrollTarget, setProfileScrollTarget] = useState(null);
  const [cardMakerLogId, setCardMakerLogId] = useState(null);
  const [timerLaunch, setTimerLaunch] = useState(null);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("fitness-league-theme") || "dark";
  });
  const isDark = theme === "dark";
  const fighterLevel = useMemo(
    () => getFighterProgress(logs).level,
    [logs]
  );
  const timerSummary = useBackgroundTimerSession(currentPage);

  useEffect(() => {
    if (!isTutorialComplete()) {
      setShowTutorial(true);
    }
  }, []);

  const toggleTheme = () => {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === "light" ? "dark" : "light";
      localStorage.setItem("fitness-league-theme", nextTheme);
      return nextTheme;
    });
  };

  const goPage = (page) => {
    if (page !== "profile") {
      setProfileScrollTarget(null);
      setCardMakerLogId(null);
    }

    setCurrentPage(page);
  };

  const goProfile = () => {
    setProfileScrollTarget(null);
    setCardMakerLogId(null);
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
    <div className={`app-shell theme-${theme}`}>
      <main className="app-main">
        {currentPage === "home" && (
          <HomePage
            fighterLevel={fighterLevel}
            timerSummary={timerSummary}
            onStartTraining={() => goPage("train")}
            onOpenTimer={() => goPage("timer")}
            onNavigate={goPage}
            onNavigateGym={goGym}
            onOpenCardMaker={goProfileCardMaker}
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
          />
        )}

        {currentPage === "curriculum" && (
          <CurriculumPage
            fighterLevel={fighterLevel}
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

      <nav className="app-bottom-nav">
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
          <span className="app-nav-label">레벨업</span>
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
          data-tutorial-target="nav-growth"
          className={getNavClass(currentPage === "growth")}
          onClick={() => goPage("growth")}
        >
          <span className="app-nav-icon" aria-hidden="true">
            ↗
          </span>
          <span className="app-nav-label">성장</span>
        </button>

        <button
          type="button"
          data-tutorial-target="nav-category"
          className={getNavClass(currentPage === "category")}
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

      <Analytics />
    </div>
  );
}
