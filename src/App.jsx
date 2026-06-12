import { useState } from "react";
import LogPage from "./pages/LogPage.jsx";
import StatsPage from "./pages/StatsPage.jsx";
import FeedPage from "./pages/FeedPage.jsx";

function App() {
  const [page, setPage] = useState("log");

  const navButtonStyle = (targetPage) => ({
    flex: 1,
    padding: "12px 10px",
    borderRadius: "999px",
    border: page === targetPage ? "1px solid #ff3b3b" : "1px solid #333",
    backgroundColor: page === targetPage ? "#ff3b3b" : "#1c1c1c",
    color: "white",
    fontWeight: "700",
    cursor: "pointer",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #0b0b0b 0%, #141414 45%, #0b0b0b 100%)",
        color: "white",
        fontFamily: "Arial, sans-serif",
        padding: "20px",
      }}
    >
      <div
        style={{
          maxWidth: "520px",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            padding: "26px 0 20px",
          }}
        >
          <p
            style={{
              color: "#ff3b3b",
              fontWeight: "700",
              marginBottom: "8px",
            }}
          >
            TRAIN · RECORD · GROW
          </p>

          <h1
            style={{
              fontSize: "34px",
              margin: "0",
              letterSpacing: "-1px",
            }}
          >
            🥊 Boxing Tracker
          </h1>

          <p
            style={{
              color: "#aaa",
              marginTop: "10px",
              lineHeight: "1.5",
            }}
          >
            오늘의 복싱 훈련을 기록하고, 성장 과정을 확인해보자.
          </p>
        </header>

        <nav
          style={{
            display: "flex",
            gap: "8px",
            backgroundColor: "#111",
            border: "1px solid #252525",
            borderRadius: "999px",
            padding: "6px",
            position: "sticky",
            top: "12px",
            zIndex: 10,
            marginBottom: "24px",
          }}
        >
          <button style={navButtonStyle("log")} onClick={() => setPage("log")}>
            기록
          </button>
          <button
            style={navButtonStyle("stats")}
            onClick={() => setPage("stats")}
          >
            통계
          </button>
          <button
            style={navButtonStyle("feed")}
            onClick={() => setPage("feed")}
          >
            피드
          </button>
        </nav>

        <main
          style={{
            backgroundColor: "rgba(20, 20, 20, 0.95)",
            border: "1px solid #292929",
            borderRadius: "22px",
            padding: "20px",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.35)",
          }}
        >
          {page === "log" && <LogPage />}
          {page === "stats" && <StatsPage />}
          {page === "feed" && <FeedPage />}
        </main>

        <footer
          style={{
            textAlign: "center",
            color: "#666",
            fontSize: "13px",
            padding: "24px 0",
          }}
        >
          Boxing Tracker MVP · 첫 번째 버전
        </footer>
      </div>
    </div>
  );
}

export default App;