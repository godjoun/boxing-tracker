import { useState } from "react";
import { useTraining } from "../store/TrainingContext";

const EXERCISE_OPTIONS = [
  "헬스",
  "러닝",
  "복싱",
  "줄넘기",
  "홈트",
  "축구",
  "수영",
  "기타",
];

const DIFFICULTY_OPTIONS = [
  { id: "easy", label: "가볍게", description: "가볍게 움직인 날" },
  { id: "normal", label: "보통", description: "평소처럼 운동한 날" },
  { id: "hard", label: "빡셈", description: "확실히 힘들었던 날" },
  { id: "crazy", label: "죽음", description: "오늘 좀 미쳤던 날" },
];

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#050505",
    color: "#ffffff",
    padding: "24px 16px",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  container: {
    maxWidth: "560px",
    margin: "0 auto",
  },
  headerSmall: {
    color: "#f87171",
    fontSize: "13px",
    fontWeight: 900,
    letterSpacing: "0.08em",
    marginBottom: "8px",
  },
  title: {
    fontSize: "30px",
    lineHeight: 1.25,
    fontWeight: 900,
    margin: 0,
    color: "#ffffff",
  },
  subtitle: {
    marginTop: "12px",
    color: "#d4d4d8",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  card: {
    backgroundColor: "#18181b",
    border: "1px solid #3f3f46",
    borderRadius: "24px",
    padding: "20px",
    marginBottom: "20px",
  },
  cardTitle: {
    fontSize: "14px",
    color: "#e4e4e7",
    fontWeight: 800,
    marginBottom: "12px",
  },
  blackBox: {
    backgroundColor: "#050505",
    border: "1px solid #27272a",
    borderRadius: "18px",
    padding: "14px",
    color: "#ffffff",
  },
  rowBetween: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  bigScore: {
    fontSize: "38px",
    fontWeight: 900,
    margin: 0,
    color: "#ffffff",
  },
  muted: {
    color: "#d4d4d8",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  smallMuted: {
    color: "#a1a1aa",
    fontSize: "12px",
    fontWeight: 700,
  },
  redBadge: {
    display: "inline-block",
    backgroundColor: "#ef4444",
    color: "#ffffff",
    borderRadius: "999px",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: 900,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    backgroundColor: "#050505",
    color: "#ffffff",
    border: "1px solid #52525b",
    borderRadius: "16px",
    padding: "14px",
    fontSize: "15px",
    outline: "none",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 900,
  },
  formGroup: {
    marginBottom: "16px",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },
  grid3: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "10px",
  },
  submitButton: {
    width: "100%",
    backgroundColor: "#ef4444",
    color: "#ffffff",
    border: "none",
    borderRadius: "16px",
    padding: "16px",
    fontSize: "16px",
    fontWeight: 900,
    cursor: "pointer",
  },
  deleteButton: {
    backgroundColor: "#27272a",
    color: "#ffffff",
    border: "1px solid #52525b",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: 800,
    cursor: "pointer",
  },
};

function calculatePreviewScore(minutes, difficulty) {
  const multipliers = {
    easy: 0.8,
    normal: 1,
    hard: 1.2,
    crazy: 1.5,
  };

  const multiplier = multipliers[difficulty] || 1;
  return Math.round(Number(minutes || 0) * multiplier);
}

function getStatusColor(type) {
  if (type === "promote") return "#86efac";
  if (type === "safe") return "#7dd3fc";
  return "#fca5a5";
}

function getProgressPercent(weeklyScore, currentTier) {
  if (!currentTier?.promoteScore) return 100;
  const percent = (weeklyScore / currentTier.promoteScore) * 100;
  return Math.min(Math.round(percent), 100);
}

function getProgressText({ weeklyScore, currentTier, nextTier }) {
  if (!nextTier) return "현재 최고 티어입니다.";

  if (weeklyScore >= currentTier.promoteScore) {
    return `${nextTier.name} 승급 조건 달성!`;
  }

  if (weeklyScore < currentTier.keepScore) {
    return `티어 유지까지 ${currentTier.keepScore - weeklyScore}점 남음`;
  }

  return `${nextTier.name} 승급까지 ${currentTier.promoteScore - weeklyScore}점 남음`;
}

function getRewardMessage({
  addedScore,
  weeklyScoreAfter,
  currentTier,
  nextTier,
  isLeagueMode,
  rankAfter,
}) {
  if (isLeagueMode) {
    return {
      title: `+${addedScore}점 획득!`,
      message: `현재 리그 ${rankAfter}위입니다. 오늘도 순위 싸움에 들어왔어요.`,
    };
  }

  if (!nextTier) {
    return {
      title: `+${addedScore}점 획득!`,
      message: "현재 최고 티어입니다. 이제는 꾸준함이 기록이 됩니다.",
    };
  }

  if (weeklyScoreAfter >= currentTier.promoteScore) {
    return {
      title: `+${addedScore}점 획득!`,
      message: `${nextTier.name} 승급 조건을 달성했어요. 이번 주 아주 좋습니다.`,
    };
  }

  if (weeklyScoreAfter < currentTier.keepScore) {
    return {
      title: `+${addedScore}점 획득!`,
      message: `티어 유지까지 ${currentTier.keepScore - weeklyScoreAfter}점 남았어요.`,
    };
  }

  return {
    title: `+${addedScore}점 획득!`,
    message: `${nextTier.name} 승급까지 ${currentTier.promoteScore - weeklyScoreAfter}점 남았어요.`,
  };
}

function OptionButton({ isActive, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        backgroundColor: isActive ? "#ef4444" : "#050505",
        color: isActive ? "#111111" : "#ffffff",
        border: isActive ? "2px solid #fca5a5" : "1px solid #52525b",
        borderRadius: "16px",
        padding: "14px",
        textAlign: "left",
        cursor: "pointer",
        minHeight: "86px",
      }}
    >
      <div style={styles.rowBetween}>
        <p style={{ margin: 0, fontSize: "15px", fontWeight: 900 }}>
          {title}
        </p>

        {isActive && (
          <span
            style={{
              backgroundColor: "#ffffff",
              color: "#111111",
              borderRadius: "999px",
              padding: "4px 8px",
              fontSize: "10px",
              fontWeight: 900,
            }}
          >
            선택됨
          </span>
        )}
      </div>

      <p
        style={{
          margin: "8px 0 0",
          fontSize: "12px",
          lineHeight: 1.5,
          fontWeight: 700,
          color: isActive ? "#111111" : "#d4d4d8",
        }}
      >
        {description}
      </p>
    </button>
  );
}

export default function LogPage() {
  const {
    logs,
    weeklyLogs,
    addLog,
    deleteLog,
    resetAllLogs,
    weeklyScore,
    currentTier,
    nextTier,
    tierStatus,
    mode,
    setMode,
    isLeagueMode,
    rankings,
    dailyScoreLimit,
    seasonInfo,
  } = useTraining();

  const [type, setType] = useState("헬스");
  const [minutes, setMinutes] = useState("");
  const [difficulty, setDifficulty] = useState("normal");
  const [memo, setMemo] = useState("");
  const [reward, setReward] = useState(null);

  const safeWeeklyLogs = Array.isArray(weeklyLogs) ? weeklyLogs : logs;
  const safeRankings = Array.isArray(rankings) ? rankings : [];

  const previewScore = calculatePreviewScore(minutes, difficulty);
  const progressPercent = getProgressPercent(weeklyScore, currentTier);
  const progressText = getProgressText({
    weeklyScore,
    currentTier,
    nextTier,
  });

  const myRank = safeRankings.findIndex((player) => player.isMe) + 1;

  const weeklyWorkoutCount = safeWeeklyLogs.length;
  const weeklyTotalMinutes = safeWeeklyLogs.reduce((total, log) => {
    return total + Number(log.minutes || 0);
  }, 0);

  function getRankAfterScore(scoreAfter) {
    const updatedRankings = safeRankings
      .map((player) => {
        if (player.isMe) {
          return { ...player, score: scoreAfter };
        }

        return player;
      })
      .sort((a, b) => b.score - a.score);

    return updatedRankings.findIndex((player) => player.isMe) + 1;
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!minutes || Number(minutes) <= 0) {
      alert("운동 시간을 입력해줘!");
      return;
    }

    const addedScore = calculatePreviewScore(minutes, difficulty);
    const weeklyScoreAfter = weeklyScore + addedScore;
    const rankAfter = getRankAfterScore(weeklyScoreAfter);

    addLog({
      type,
      minutes,
      difficulty,
      memo,
    });

    setReward(
      getRewardMessage({
        addedScore,
        weeklyScoreAfter,
        currentTier,
        nextTier,
        isLeagueMode,
        rankAfter,
      })
    );

    setMinutes("");
    setMemo("");
    setDifficulty("normal");
  }

  function handleDeleteLog(logId) {
    const ok = window.confirm("이 운동 기록을 삭제할까요?");
    if (!ok) return;

    deleteLog(logId);
    setReward(null);
  }

  function handleResetAllLogs() {
    const ok = window.confirm("모든 운동 기록을 삭제할까요?");
    if (!ok) return;

    resetAllLogs();
    setReward(null);
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={{ marginBottom: "24px" }}>
          <p style={styles.headerSmall}>WEEKFIT LEAGUE</p>

          <h1 style={styles.title}>
            이번 주 운동 점수로
            <br />
            나를 증명해보자.
          </h1>

          <p style={styles.subtitle}>
            혼자 기록하면 티어가 오르고, 원하면 리그에서 친구들과 경쟁할 수
            있어요.
          </p>
        </header>

        <section style={styles.card}>
          <div style={styles.rowBetween}>
            <div>
              <p style={styles.cardTitle}>이번 주 시즌</p>
              <p style={{ margin: 0, fontWeight: 900, color: "#ffffff" }}>
                {seasonInfo?.startText || "이번 주"} -{" "}
                {seasonInfo?.endText || "시즌"}
              </p>
            </div>

            <span style={styles.redBadge}>
              {seasonInfo?.daysLeft === 0
                ? "오늘 종료"
                : `${seasonInfo?.daysLeft ?? 0}일 남음`}
            </span>
          </div>

          <p style={{ ...styles.blackBox, marginTop: "16px", lineHeight: 1.6 }}>
            매주 랭킹은 새로 시작돼요. 대신 내 티어와 기록은 계속 쌓입니다.
          </p>
        </section>

        <section style={styles.card}>
          <p style={styles.cardTitle}>이번 주 내 상태</p>

          <div style={styles.rowBetween}>
            <div>
              <h2 style={styles.bigScore}>{weeklyScore}점</h2>
              <p style={styles.muted}>현재 티어: {currentTier.name}</p>
            </div>

            <div style={{ textAlign: "right" }}>
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  fontWeight: 900,
                  color: getStatusColor(tierStatus.type),
                }}
              >
                {tierStatus.title}
              </p>

              <p style={styles.smallMuted}>
                {nextTier ? `다음 티어: ${nextTier.name}` : "최고 티어"}
              </p>
            </div>
          </div>

          {reward && (
            <div
              style={{
                marginTop: "16px",
                backgroundColor: "#451a1a",
                border: "1px solid #ef4444",
                borderRadius: "18px",
                padding: "14px",
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: "#fca5a5",
                  fontWeight: 900,
                  fontSize: "17px",
                }}
              >
                {reward.title}
              </p>
              <p style={{ margin: "6px 0 0", color: "#ffffff" }}>
                {reward.message}
              </p>
            </div>
          )}

          <div style={{ ...styles.blackBox, marginTop: "16px" }}>
            <div style={styles.rowBetween}>
              <p style={{ margin: 0, fontWeight: 900 }}>티어 진행률</p>
              <p style={{ margin: 0, color: "#f87171", fontWeight: 900 }}>
                {progressPercent}%
              </p>
            </div>

            <div
              style={{
                height: "12px",
                backgroundColor: "#3f3f46",
                borderRadius: "999px",
                overflow: "hidden",
                marginTop: "10px",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progressPercent}%`,
                  backgroundColor: "#ef4444",
                }}
              />
            </div>

            <p style={{ margin: "12px 0 0", color: "#ffffff", fontWeight: 800 }}>
              {progressText}
            </p>
          </div>

          <div style={{ ...styles.grid2, marginTop: "12px" }}>
            <div style={styles.blackBox}>
              <p style={styles.smallMuted}>유지 기준</p>
              <p style={{ margin: "6px 0 0", fontSize: "20px", fontWeight: 900 }}>
                {currentTier.keepScore}점
              </p>
            </div>

            <div style={styles.blackBox}>
              <p style={styles.smallMuted}>승급 기준</p>
              <p style={{ margin: "6px 0 0", fontSize: "20px", fontWeight: 900 }}>
                {currentTier.promoteScore}점
              </p>
            </div>
          </div>

          <p style={{ ...styles.blackBox, marginTop: "12px", lineHeight: 1.6 }}>
            {tierStatus.message}
          </p>
        </section>

        <section style={styles.card}>
          <p style={{ ...styles.cardTitle, color: "#f87171" }}>
            이번 주 결과 카드
          </p>

          <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 900 }}>
            {currentTier.name} · {weeklyScore}점
          </h2>

          <p style={styles.muted}>
            이번 주 {weeklyWorkoutCount}번 운동했고, 총 {weeklyTotalMinutes}
            분을 쌓았어요.
          </p>

          <div style={styles.grid3}>
            <div style={{ ...styles.blackBox, textAlign: "center" }}>
              <p style={styles.smallMuted}>운동 횟수</p>
              <p style={{ margin: "6px 0 0", fontSize: "20px", fontWeight: 900 }}>
                {weeklyWorkoutCount}
              </p>
            </div>

            <div style={{ ...styles.blackBox, textAlign: "center" }}>
              <p style={styles.smallMuted}>운동 시간</p>
              <p style={{ margin: "6px 0 0", fontSize: "20px", fontWeight: 900 }}>
                {weeklyTotalMinutes}
              </p>
            </div>

            <div style={{ ...styles.blackBox, textAlign: "center" }}>
              <p style={styles.smallMuted}>점수</p>
              <p style={{ margin: "6px 0 0", fontSize: "20px", fontWeight: 900 }}>
                {weeklyScore}
              </p>
            </div>
          </div>
        </section>

        <section style={styles.card}>
          <p style={styles.cardTitle}>기록 방식 선택</p>

          <div style={styles.grid2}>
            <OptionButton
              isActive={mode === "solo"}
              title="혼자 기록"
              description="내 목표와 티어 중심으로 운동을 쌓아요."
              onClick={() => setMode("solo")}
            />

            <OptionButton
              isActive={mode === "league"}
              title="리그 참가"
              description="친구들과 이번 주 점수로 경쟁해요."
              onClick={() => setMode("league")}
            />
          </div>
        </section>

        {isLeagueMode && (
          <section style={styles.card}>
            <div style={styles.rowBetween}>
              <div>
                <p style={styles.cardTitle}>현재 리그 순위</p>
                <h2 style={{ margin: 0, fontSize: "26px", fontWeight: 900 }}>
                  {myRank}위
                </h2>
              </div>

              <span style={styles.redBadge}>리그 모드</span>
            </div>

            <div style={{ marginTop: "16px" }}>
              {safeRankings.slice(0, 5).map((player, index) => (
                <div
                  key={player.id}
                  style={{
                    ...styles.blackBox,
                    ...styles.rowBetween,
                    marginBottom: "8px",
                    border: player.isMe
                      ? "1px solid #ef4444"
                      : "1px solid #27272a",
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 900 }}>
                    {index + 1}. {player.name}
                  </p>
                  <p style={{ margin: 0, fontWeight: 900 }}>
                    {player.score}점
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section style={styles.card}>
          <h2 style={{ marginTop: 0, fontSize: "24px", fontWeight: 900 }}>
            오늘 운동 기록
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label}>운동 종류</label>
              <select
                value={type}
                onChange={(event) => setType(event.target.value)}
                style={styles.input}
              >
                {EXERCISE_OPTIONS.map((exercise) => (
                  <option key={exercise} value={exercise}>
                    {exercise}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>운동 시간</label>
              <input
                type="number"
                value={minutes}
                onChange={(event) => setMinutes(event.target.value)}
                placeholder="예: 60"
                style={styles.input}
              />

              <p style={styles.smallMuted}>
                분 단위로 입력 · 하루 최대 {dailyScoreLimit}점까지 반영
              </p>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>운동 강도</label>

              <div style={styles.grid2}>
                {DIFFICULTY_OPTIONS.map((option) => (
                  <OptionButton
                    key={option.id}
                    isActive={difficulty === option.id}
                    title={option.label}
                    description={option.description}
                    onClick={() => setDifficulty(option.id)}
                  />
                ))}
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>한 줄 메모</label>
              <input
                value={memo}
                onChange={(event) => setMemo(event.target.value)}
                placeholder="예: 오늘 등 운동 찢었다"
                style={styles.input}
              />
            </div>

            <div style={{ ...styles.blackBox, marginBottom: "16px" }}>
              <p style={styles.smallMuted}>예상 획득 점수</p>
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: "26px",
                  fontWeight: 900,
                  color: "#f87171",
                }}
              >
                +{previewScore}점
              </p>
            </div>

            <button type="submit" style={styles.submitButton}>
              점수 등록하기
            </button>
          </form>
        </section>

        <section style={styles.card}>
          <div style={styles.rowBetween}>
            <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 900 }}>
              최근 기록
            </h2>

            {logs.length > 0 && (
              <button
                type="button"
                onClick={handleResetAllLogs}
                style={styles.deleteButton}
              >
                전체 초기화
              </button>
            )}
          </div>

          {logs.length === 0 ? (
            <p style={{ ...styles.blackBox, marginTop: "16px" }}>
              아직 기록이 없어. 오늘 운동 하나만 등록해보자.
            </p>
          ) : (
            <div style={{ marginTop: "16px" }}>
              {logs.slice(0, 8).map((log) => (
                <div
                  key={log.id}
                  style={{ ...styles.blackBox, marginBottom: "10px" }}
                >
                  <div style={styles.rowBetween}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 900 }}>{log.type}</p>
                      <p style={styles.muted}>
                        {log.minutes}분 · {log.difficultyLabel || "보통"} ·{" "}
                        {log.date}
                      </p>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <p
                        style={{
                          margin: 0,
                          color: "#f87171",
                          fontWeight: 900,
                        }}
                      >
                        +{log.score}점
                      </p>

                      <button
                        type="button"
                        onClick={() => handleDeleteLog(log.id)}
                        style={styles.deleteButton}
                      >
                        삭제
                      </button>
                    </div>
                  </div>

                  {log.memo && (
                    <p
                      style={{
                        marginTop: "12px",
                        backgroundColor: "#18181b",
                        borderRadius: "14px",
                        padding: "12px",
                        color: "#ffffff",
                      }}
                    >
                      {log.memo}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}