import { useEffect, useRef, useState } from "react";
import { useTraining } from "../store/TrainingContext";

const ROUTINES = [
  {
    id: "quick",
    title: "짧게 6분 루틴",
    description: "오늘 시간이 없을 때 가볍게 몸 푸는 루틴",
    workMinutes: 1,
    restMinutes: 1,
    rounds: ["쉐도우복싱", "잽-스트레이트", "가벼운 풋워크"],
  },
  {
    id: "beginner",
    title: "초보자 15분 루틴",
    description: "복싱 기본기를 천천히 쌓는 기본 루틴",
    workMinutes: 3,
    restMinutes: 1,
    rounds: ["줄넘기", "잽 연습", "잽-스트레이트", "쉐도우복싱", "복근"],
  },
  {
    id: "bag",
    title: "샌드백 집중 루틴",
    description: "샌드백 칠 때 바로 따라 하기 좋은 루틴",
    workMinutes: 3,
    restMinutes: 1,
    rounds: ["가볍게 잽", "원투 콤비네이션", "훅 연습", "강도 높은 샌드백", "마무리 쉐도우"],
  },
  {
    id: "hard",
    title: "빡센 8라운드 루틴",
    description: "오늘 제대로 땀 빼고 싶을 때",
    workMinutes: 3,
    restMinutes: 1,
    rounds: [
      "줄넘기",
      "풋워크",
      "잽",
      "원투",
      "훅 콤비네이션",
      "샌드백",
      "복근",
      "전신 마무리",
    ],
  },
];

const formatTime = (seconds) => {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

function TimerPage({ onGoLog }) {
  const { addLog } = useTraining();

  const [selectedRoutineId, setSelectedRoutineId] = useState("beginner");

  const selectedRoutine = ROUTINES.find((routine) => {
    return routine.id === selectedRoutineId;
  });

  const [totalRounds, setTotalRounds] = useState(5);
  const [workMinutes, setWorkMinutes] = useState(3);
  const [restMinutes, setRestMinutes] = useState(1);

  const [currentRound, setCurrentRound] = useState(1);
  const [phase, setPhase] = useState("work"); // work, rest, done
  const [remainingTime, setRemainingTime] = useState(180);
  const [isRunning, setIsRunning] = useState(false);
  const [hasSavedLog, setHasSavedLog] = useState(false);

  const savedLogRef = useRef(false);

  const workSeconds = workMinutes * 60;
  const restSeconds = restMinutes * 60;

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev > 1) {
          return prev - 1;
        }

        if (phase === "work") {
          if (currentRound === totalRounds) {
            setPhase("done");
            setIsRunning(false);
            return 0;
          }

          setPhase("rest");
          return restSeconds;
        }

        if (phase === "rest") {
          setCurrentRound((round) => round + 1);
          setPhase("work");
          return workSeconds;
        }

        return 0;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, phase, currentRound, totalRounds, workSeconds, restSeconds]);

  useEffect(() => {
    if (phase !== "done") return;
    if (savedLogRef.current) return;
    if (hasSavedLog) return;

    savedLogRef.current = true;

    const totalWorkoutMinutes = totalRounds * workMinutes;
    const routineTitle = selectedRoutine ? selectedRoutine.title : "직접 설정 루틴";

    addLog({
      type: routineTitle,
      minutes: totalWorkoutMinutes,
      difficulty: "normal",
      memo: `${totalRounds}라운드 완료 / 운동 ${workMinutes}분 / 휴식 ${restMinutes}분`,
    });

    setHasSavedLog(true);
  }, [
    phase,
    hasSavedLog,
    addLog,
    totalRounds,
    workMinutes,
    restMinutes,
    selectedRoutine,
  ]);

  const resetTimerState = (nextWorkMinutes = workMinutes) => {
    setIsRunning(false);
    setCurrentRound(1);
    setPhase("work");
    setRemainingTime(nextWorkMinutes * 60);
    setHasSavedLog(false);
    savedLogRef.current = false;
  };

  const applyRoutine = (routine) => {
    setSelectedRoutineId(routine.id);
    setTotalRounds(routine.rounds.length);
    setWorkMinutes(routine.workMinutes);
    setRestMinutes(routine.restMinutes);
    resetTimerState(routine.workMinutes);
  };

  const handleStart = () => {
    if (phase === "done") {
      resetTimerState();
      setTimeout(() => setIsRunning(true), 0);
      return;
    }

    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    resetTimerState();
  };

  const handleWorkMinutesChange = (value) => {
    const number = Number(value);
    setSelectedRoutineId("custom");
    setWorkMinutes(number);

    if (!isRunning && phase === "work") {
      setRemainingTime(number * 60);
    }
  };

  const handleTotalRoundsChange = (value) => {
    const number = Number(value);
    setSelectedRoutineId("custom");
    setTotalRounds(number);
  };

  const handleRestMinutesChange = (value) => {
    const number = Number(value);
    setSelectedRoutineId("custom");
    setRestMinutes(number);
  };

  const getPhaseText = () => {
    if (phase === "work") return "훈련 시간";
    if (phase === "rest") return "휴식 시간";
    return "운동 완료";
  };

  const getCurrentRoundName = () => {
    if (!selectedRoutine) return "직접 설정한 운동";
    return selectedRoutine.rounds[currentRound - 1] || "마무리 운동";
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>복싱 라운드 타이머</h1>
      <p style={styles.subtitle}>
        루틴을 고르면 타이머가 자동으로 설정됩니다.
      </p>

      <div style={styles.routineCard}>
        <h2 style={styles.settingTitle}>오늘의 복싱 루틴</h2>

        <div style={styles.routineButtonGrid}>
          {ROUTINES.map((routine) => (
            <button
              key={routine.id}
              style={{
                ...styles.routineButton,
                ...(selectedRoutineId === routine.id ? styles.activeRoutineButton : {}),
              }}
              onClick={() => applyRoutine(routine)}
              disabled={isRunning}
            >
              {routine.title}
            </button>
          ))}
        </div>

        <div style={styles.selectedRoutineBox}>
          <div style={styles.selectedRoutineTitle}>
            {selectedRoutine ? selectedRoutine.title : "직접 설정 루틴"}
          </div>

          <p style={styles.selectedRoutineDescription}>
            {selectedRoutine
              ? selectedRoutine.description
              : "아래 설정값으로 직접 타이머를 진행합니다."}
          </p>

          {selectedRoutine && (
            <div style={styles.roundList}>
              {selectedRoutine.rounds.map((round, index) => (
                <div key={round} style={styles.roundItem}>
                  <span style={styles.roundNumber}>{index + 1}R</span>
                  <span>{round}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={styles.timerCard}>
        <div style={styles.roundText}>
          {phase === "done" ? "완료" : `${currentRound} / ${totalRounds} 라운드`}
        </div>

        {phase !== "done" && (
          <div style={styles.currentRoundName}>{getCurrentRoundName()}</div>
        )}

        <div style={styles.phaseText}>{getPhaseText()}</div>

        <div style={styles.timeText}>{formatTime(remainingTime)}</div>

        {phase === "done" && (
          <div style={styles.doneBox}>
            <p style={styles.savedText}>운동 기록에 자동 저장됐습니다.</p>

            <button style={styles.goLogButton} onClick={onGoLog}>
              기록 보러가기
            </button>
          </div>
        )}

        <div style={styles.buttonRow}>
          {!isRunning ? (
            <button style={styles.startButton} onClick={handleStart}>
              {phase === "done" ? "다시 시작" : "시작"}
            </button>
          ) : (
            <button style={styles.pauseButton} onClick={handlePause}>
              일시정지
            </button>
          )}

          <button style={styles.resetButton} onClick={handleReset}>
            초기화
          </button>
        </div>
      </div>

      <div style={styles.settingCard}>
        <h2 style={styles.settingTitle}>타이머 설정</h2>

        <label style={styles.label}>
          총 라운드
          <input
            style={styles.input}
            type="number"
            min="1"
            max="20"
            value={totalRounds}
            onChange={(e) => handleTotalRoundsChange(e.target.value)}
            disabled={isRunning}
          />
        </label>

        <label style={styles.label}>
          운동 시간 / 분
          <input
            style={styles.input}
            type="number"
            min="1"
            max="10"
            value={workMinutes}
            onChange={(e) => handleWorkMinutesChange(e.target.value)}
            disabled={isRunning}
          />
        </label>

        <label style={styles.label}>
          휴식 시간 / 분
          <input
            style={styles.input}
            type="number"
            min="1"
            max="5"
            value={restMinutes}
            onChange={(e) => handleRestMinutesChange(e.target.value)}
            disabled={isRunning}
          />
        </label>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#111111",
    color: "white",
    padding: "24px",
    boxSizing: "border-box",
  },
  title: {
    fontSize: "28px",
    marginBottom: "8px",
  },
  subtitle: {
    color: "#aaaaaa",
    marginBottom: "24px",
  },
  routineCard: {
    backgroundColor: "#1c1c1c",
    border: "1px solid #333333",
    borderRadius: "20px",
    padding: "20px",
    marginBottom: "20px",
  },
  routineButtonGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginBottom: "16px",
  },
  routineButton: {
    backgroundColor: "#111111",
    color: "#dddddd",
    border: "1px solid #444444",
    borderRadius: "12px",
    padding: "12px",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  activeRoutineButton: {
    backgroundColor: "#ff3333",
    color: "white",
    border: "1px solid #ff3333",
  },
  selectedRoutineBox: {
    backgroundColor: "#111111",
    border: "1px solid #333333",
    borderRadius: "16px",
    padding: "16px",
  },
  selectedRoutineTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "6px",
  },
  selectedRoutineDescription: {
    color: "#aaaaaa",
    marginTop: 0,
    marginBottom: "14px",
    lineHeight: "1.5",
  },
  roundList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  roundItem: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    color: "#eeeeee",
  },
  roundNumber: {
    color: "#ff4d4d",
    fontWeight: "bold",
    minWidth: "30px",
  },
  timerCard: {
    backgroundColor: "#1c1c1c",
    border: "1px solid #333333",
    borderRadius: "20px",
    padding: "28px",
    textAlign: "center",
    marginBottom: "20px",
  },
  roundText: {
    fontSize: "18px",
    color: "#ff4d4d",
    fontWeight: "bold",
    marginBottom: "8px",
  },
  currentRoundName: {
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "12px",
  },
  phaseText: {
    fontSize: "20px",
    marginBottom: "16px",
  },
  timeText: {
    fontSize: "64px",
    fontWeight: "bold",
    letterSpacing: "2px",
    marginBottom: "16px",
  },
  doneBox: {
    marginBottom: "20px",
  },
  savedText: {
    color: "#7CFF7C",
    fontWeight: "bold",
    marginBottom: "12px",
  },
  goLogButton: {
    backgroundColor: "#ffffff",
    color: "#111111",
    border: "none",
    borderRadius: "12px",
    padding: "12px 20px",
    fontSize: "15px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  buttonRow: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
  },
  startButton: {
    backgroundColor: "#ff3333",
    color: "white",
    border: "none",
    borderRadius: "12px",
    padding: "14px 24px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  pauseButton: {
    backgroundColor: "#444444",
    color: "white",
    border: "none",
    borderRadius: "12px",
    padding: "14px 24px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  resetButton: {
    backgroundColor: "transparent",
    color: "white",
    border: "1px solid #555555",
    borderRadius: "12px",
    padding: "14px 24px",
    fontSize: "16px",
    cursor: "pointer",
  },
  settingCard: {
    backgroundColor: "#1c1c1c",
    border: "1px solid #333333",
    borderRadius: "20px",
    padding: "20px",
  },
  settingTitle: {
    fontSize: "20px",
    marginBottom: "16px",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "14px",
    color: "#dddddd",
  },
  input: {
    backgroundColor: "#000000",
    color: "white",
    border: "1px solid #555555",
    borderRadius: "10px",
    padding: "12px",
    fontSize: "16px",
  },
};

export default TimerPage;