import { useState } from "react";
import { TrainingProvider } from "./store/TrainingContext";
import HomePage from "./pages/HomePage";
import LogPage from "./pages/LogPage";
import TimerPage from "./pages/TimerPage";
import StatsPage from "./pages/StatsPage";
import ProfilePage from "./pages/ProfilePage";
import "./App.css";

export default function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [profileScrollTarget, setProfileScrollTarget] = useState(null);

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

  return (
    <TrainingProvider>
      <div style={styles.app}>
        <main style={styles.main}>
          {currentPage === "home" && (
            <HomePage onStartTraining={() => goPage("timer")} />
          )}

          {currentPage === "timer" && (
            <TimerPage
              onGoLog={() => goPage("log")}
              onGoHome={() => goPage("home")}
              onGoProfile={goProfileCardMaker}
            />
          )}

          {currentPage === "log" && <LogPage />}

          {currentPage === "stats" && <StatsPage />}

          {currentPage === "profile" && (
            <ProfilePage scrollTarget={profileScrollTarget} />
          )}
        </main>

        <nav style={styles.nav}>
          <button
            style={{
              ...styles.navButton,
              ...(currentPage === "home" ? styles.activeButton : {}),
            }}
            onClick={() => goPage("home")}
          >
            홈
          </button>

          <button
            style={{
              ...styles.navButton,
              ...(currentPage === "timer" ? styles.activeButton : {}),
            }}
            onClick={() => goPage("timer")}
          >
            타이머
          </button>

          <button
            style={{
              ...styles.navButton,
              ...(currentPage === "log" ? styles.activeButton : {}),
            }}
            onClick={() => goPage("log")}
          >
            기록
          </button>

          <button
            style={{
              ...styles.navButton,
              ...(currentPage === "stats" ? styles.activeButton : {}),
            }}
            onClick={() => goPage("stats")}
          >
            성장
          </button>

          <button
            style={{
              ...styles.navButton,
              ...(currentPage === "profile" ? styles.activeButton : {}),
            }}
            onClick={goProfile}
          >
            프로필
          </button>
        </nav>
      </div>
    </TrainingProvider>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    background: "#050505",
    color: "#ffffff",
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
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: "8px",
    padding: "10px",
    borderRadius: "24px",
    background: "rgba(20, 20, 20, 0.92)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(14px)",
    zIndex: 100,
  },

  navButton: {
    border: "none",
    borderRadius: "16px",
    padding: "12px 8px",
    background: "transparent",
    color: "rgba(255, 255, 255, 0.55)",
    fontSize: "13px",
    fontWeight: 800,
    cursor: "pointer",
  },

  activeButton: {
    background: "#ff3b3b",
    color: "#ffffff",
  },
};