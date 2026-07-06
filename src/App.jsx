import { useEffect, useMemo, useState } from "react";
import { TrainingProvider, useTraining } from "./store/TrainingContext";
import HomePage from "./pages/HomePage";
import LogPage from "./pages/LogPage";
import TimerPage from "./pages/TimerPage";
import StatsPage from "./pages/StatsPage";
import ProfilePage from "./pages/ProfilePage";
import CategoryPage from "./pages/CategoryPage";
import GymFinderPage from "./pages/GymFinderPage";
import WeeklyReportPage from "./pages/WeeklyReportPage";
import DataBackupPage from "./pages/DataBackupPage";
import JourneyPage from "./pages/JourneyPage";
import CurriculumPage from "./pages/CurriculumPage";
import ComboCreatorPage from "./pages/ComboCreatorPage";
import StrengthProgramPage from "./pages/StrengthProgramPage";
import FeatureLockScreen from "./components/FeatureLockScreen";
import OnboardingSetupPage from "./pages/OnboardingSetupPage";
import FirstVisitTutorial from "./components/FirstVisitTutorial";
import { useBackgroundTimerSession } from "./hooks/useBackgroundTimerSession";
import { needsOnboarding } from "./utils/bodySpecs";
import { isTutorialComplete } from "./utils/tutorial";
import { getFighterProgress } from "./utils/fighterProgress";
import { buildCurriculumTimerLaunch } from "./utils/homeCurriculum";
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
    }

    setCurrentPage(page);
  };

  const goProfile = () => {
    setProfileScrollTarget(null);
    setCurrentPage("profile");
  };

  const goProfileCardMaker = () => {
    setProfileScrollTarget("cardMaker");
    setCurrentPage("profile");
  };

  const goGym = (view = "hub") => {
    setGymView(view);
    setCurrentPage("gym");
  };

  const goTimerWithSession = (session) => {
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

  const navActiveStyle = isDark ? styles.activeButton : styles.activeButtonLight;

  return (
    <div
      className={`app-shell theme-${theme}`}
      style={{
        ...styles.app,
        background: isDark ? "#0d0d0e" : "#faf8f4",
        color: isDark ? "#ffffff" : "#171717",
      }}
    >
      <main style={styles.main}>
        {currentPage === "home" && (
          <HomePage
            fighterLevel={fighterLevel}
            timerSummary={timerSummary}
            onStartTraining={() => goPage("timer")}
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

        {currentPage === "stats" && (
          <StatsPage onGoWeekly={() => goPage("weekly")} />
        )}

        {currentPage === "weekly" && (
          <WeeklyReportPage onGoBack={() => goPage("category")} />
        )}

        {currentPage === "backup" && (
          <DataBackupPage onGoBack={() => goPage("category")} />
        )}

        {currentPage === "profile" && (
          <ProfilePage
            scrollTarget={profileScrollTarget}
            fighterLevel={fighterLevel}
            onStartTraining={() => goPage("timer")}
          />
        )}

        {currentPage === "journey" && (
          <JourneyPage onStartTraining={() => goPage("timer")} />
        )}

        {currentPage === "curriculum" && (
          <CurriculumPage
            fighterLevel={fighterLevel}
            onGoBack={() => goPage("category")}
            onStartSession={goTimerWithSession}
            onOpenComboCreator={() => goPage("combo-creator")}
            onStartTraining={() => goPage("timer")}
          />
        )}

        {currentPage === "strength" && (
          <StrengthProgramPage
            onGoBack={() => goPage("category")}
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

      <nav
        className="app-bottom-nav"
        style={{
          ...styles.nav,
          background: isDark
            ? "rgba(25, 25, 27, 0.94)"
            : "rgba(255, 255, 255, 0.94)",
          borderColor: isDark
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(22, 22, 22, 0.08)",
          boxShadow: isDark
            ? "0 12px 34px rgba(0, 0, 0, 0.35)"
            : "0 12px 34px rgba(25, 20, 16, 0.12)",
        }}
      >
        <button
          style={{
            ...styles.navButton,
            color: isDark ? "rgba(255,255,255,.58)" : "#74706b",
            ...(currentPage === "home" ? navActiveStyle : {}),
          }}
          onClick={() => goPage("home")}
        >
          홈
        </button>

        <button
          data-tutorial-target="nav-timer"
          style={{
            ...styles.navButton,
            color: isDark ? "rgba(255,255,255,.58)" : "#74706b",
            ...(currentPage === "timer" ? navActiveStyle : {}),
          }}
          onClick={() => goPage("timer")}
        >
          훈련
        </button>

        <button
          data-tutorial-target="nav-log"
          style={{
            ...styles.navButton,
            color: isDark ? "rgba(255,255,255,.58)" : "#74706b",
            ...(currentPage === "log" ? navActiveStyle : {}),
          }}
          onClick={() => goPage("log")}
        >
          기록
        </button>

        <button
          style={{
            ...styles.navButton,
            color: isDark ? "rgba(255,255,255,.58)" : "#74706b",
            ...(currentPage === "profile" ? navActiveStyle : {}),
          }}
          onClick={goProfile}
        >
          명패
        </button>

        <button
          data-tutorial-target="nav-journey"
          style={{
            ...styles.navButton,
            color: isDark ? "rgba(255,255,255,.58)" : "#74706b",
            ...(currentPage === "journey" ? navActiveStyle : {}),
          }}
          onClick={() => goPage("journey")}
        >
          여정
        </button>

        <button
          data-tutorial-target="nav-category"
          style={{
            ...styles.navButton,
            color: isDark ? "rgba(255,255,255,.58)" : "#74706b",
            ...(currentPage === "category" ? navActiveStyle : {}),
          }}
          onClick={() => goPage("category")}
        >
          <span className="nav-category-icon" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span>더보기</span>
        </button>
      </nav>
    </div>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    background: "#f6f5f2",
    color: "#171717",
    paddingBottom: "86px",
  },

  main: {
    width: "100%",
    minHeight: "100vh",
  },

  nav: {
    position: "fixed",
    left: "50%",
    bottom: "16px",
    transform: "translateX(-50%)",
    width: "calc(100% - 28px)",
    maxWidth: "720px",
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)",
    gap: "8px",
    padding: "10px",
    borderRadius: "24px",
    background: "rgba(255, 255, 255, 0.94)",
    border: "1px solid rgba(22, 22, 22, 0.08)",
    boxShadow: "0 12px 34px rgba(25, 20, 16, 0.12)",
    backdropFilter: "blur(14px)",
    zIndex: 100,
  },

  navButton: {
    position: "relative",
    border: "none",
    borderRadius: "16px",
    minHeight: "48px",
    padding: "8px 6px",
    background: "transparent",
    color: "#74706b",
    fontSize: "12px",
    fontWeight: 800,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "3px",
  },

  activeButton: {
    background: "#ef3f36",
    color: "#ffffff",
    boxShadow: "0 7px 16px rgba(239, 63, 54, 0.2)",
  },

  activeButtonLight: {
    background: "linear-gradient(135deg, #e8c66a, #c49a2e)",
    color: "#1f1a12",
    boxShadow: "0 7px 16px rgba(196, 154, 46, 0.28)",
  },

};
