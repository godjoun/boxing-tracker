import { useState } from "react";
import { TrainingProvider } from "./store/TrainingContext";
import LogPage from "./pages/LogPage";
import TimerPage from "./pages/TimerPage";

export default function App() {
  const [currentPage, setCurrentPage] = useState("log");

  return (
    <TrainingProvider>
      <div style={styles.app}>
        <main style={styles.main}>
          {currentPage === "log" && <LogPage />}
          {currentPage === "timer" && (
            <TimerPage onGoLog={() => setCurrentPage("log")} />
          )}
        </main>

        <nav style={styles.nav}>
          <button
            style={{
              ...styles.navButton,
              ...(currentPage === "log" ? styles.activeButton : {}),
            }}
            onClick={() => setCurrentPage("log")}
          >
            기록
          </button>

          <button
            style={{
              ...styles.navButton,
              ...(currentPage === "timer" ? styles.activeButton : {}),
            }}
            onClick={() => setCurrentPage("timer")}
          >
            타이머
          </button>
        </nav>
      </div>
    </TrainingProvider>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    backgroundColor: "#111111",
    color: "white",
    paddingBottom: "72px",
  },
  main: {
    minHeight: "100vh",
  },
  nav: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    height: "72px",
    backgroundColor: "#000000",
    borderTop: "1px solid #333333",
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    padding: "12px",
    boxSizing: "border-box",
  },
  navButton: {
    flex: 1,
    maxWidth: "180px",
    backgroundColor: "#1c1c1c",
    color: "#aaaaaa",
    border: "1px solid #333333",
    borderRadius: "14px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  activeButton: {
    backgroundColor: "#ff3333",
    color: "white",
    border: "1px solid #ff3333",
  },
};