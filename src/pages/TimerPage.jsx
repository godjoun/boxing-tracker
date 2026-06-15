import { useEffect, useRef, useState } from "react";
import { useTraining } from "../store/TrainingContext";

const MATCH_PRESETS = [
  {
    id: "match3",
    title: "3R",
    description: "가볍게 실전 감각을 올리는 기본 경기식",
    rounds: 3,
    workMinutes: 3,
    restMinutes: 1,
  },
  {
    id: "match6",
    title: "6R",
    description: "체력과 집중력을 같이 올리는 중간 강도",
    rounds: 6,
    workMinutes: 3,
    restMinutes: 1,
  },
  {
    id: "match9",
    title: "9R",
    description: "길게 버티는 훈련용 경기식",
    rounds: 9,
    workMinutes: 3,
    restMinutes: 1,
  },
  {
    id: "match12",
    title: "12R",
    description: "챔피언 라운드 감각으로 끝까지 버티기",
    rounds: 12,
    workMinutes: 3,
    restMinutes: 1,
  },
];

const PREP_SECONDS = 10;

const formatTime = (seconds) => {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const min = Math.floor(safeSeconds / 60);
  const sec = safeSeconds % 60;

  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

export default function TimerPage({ onGoLog, onGoHome, onGoProfile }) {
  const { addLog } = useTraining();

  const [selectedPresetId, setSelectedPresetId] = useState("match3");

  const selectedPreset = MATCH_PRESETS.find((preset) => {
    return preset.id === selectedPresetId;
  });

  const [totalRounds, setTotalRounds] = useState(3);
  const [workMinutes, setWorkMinutes] = useState(3);
  const [restMinutes, setRestMinutes] = useState(1);

  const [currentRound, setCurrentRound] = useState(1);
  const [phase, setPhase] = useState("work"); // prep, work, rest, done
  const [remainingTime, setRemainingTime] = useState(180);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStartedSession, setHasStartedSession] = useState(false);
  const [hasSavedLog, setHasSavedLog] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const savedLogRef = useRef(false);
  const previousPhaseRef = useRef("work");
  const audioContextRef = useRef(null);

  const workSeconds = workMinutes * 60;
  const restSeconds = restMinutes * 60;

  const totalWorkMinutes = totalRounds * workMinutes;
  const totalSessionMinutes =
    totalRounds * workMinutes + Math.max(totalRounds - 1, 0) * restMinutes;

  const routineTitle = selectedPreset
    ? selectedPreset.title
    : "직접 설정 루틴";

  const playBeep = async (type = "work") => {
    if (!soundEnabled) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;

    if (!AudioContext) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    const audioContext = audioContextRef.current;

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    const frequencyMap = {
      prep: 760,
      work: 880,
      rest: 520,
      done: 1040,
    };

    const durationMap = {
      prep: 0.16,
      work: 0.18,
      rest: 0.24,
      done: 0.34,
    };

    const now = audioContext.currentTime;
    const frequency = frequencyMap[type] || 880;
    const duration = durationMap[type] || 0.2;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start(now);
    oscillator.stop(now + duration);
  };

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev > 1) {
          return prev - 1;
        }

        if (phase === "prep") {
          setPhase("work");
          return workSeconds;
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
    if (previousPhaseRef.current === phase) return;

    if (phase === "prep") {
      playBeep("prep");
    }

    if (phase === "work") {
      playBeep("work");
    }

    if (phase === "rest") {
      playBeep("rest");
    }

    if (phase === "done") {
      playBeep("done");

      setTimeout(() => {
        playBeep("done");
      }, 180);
    }

    previousPhaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    if (phase !== "done") return;
    if (savedLogRef.current) return;
    if (hasSavedLog) return;

    savedLogRef.current = true;

    addLog({
      type: routineTitle,
      minutes: totalWorkMinutes,
      duration: totalWorkMinutes,
      rounds: totalRounds,
      totalRounds,
      completedRounds: totalRounds,
      difficulty: "normal",
      memo: `${totalRounds}라운드 완료 / 운동 ${workMinutes}분 / 휴식 ${restMinutes}분 / 준비 ${PREP_SECONDS}초`,
      publicComment: `${totalRounds}라운드 완료. 오늘도 끝까지 버텼다.`,
    });

    setHasSavedLog(true);
  }, [
    phase,
    hasSavedLog,
    addLog,
    routineTitle,
    totalRounds,
    workMinutes,
    restMinutes,
    totalWorkMinutes,
  ]);

  const resetTimerState = (nextWorkMinutes = workMinutes) => {
    setIsRunning(false);
    setCurrentRound(1);
    setPhase("work");
    previousPhaseRef.current = "work";
    setRemainingTime(nextWorkMinutes * 60);
    setHasStartedSession(false);
    setHasSavedLog(false);
    savedLogRef.current = false;
  };

  const applyPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setTotalRounds(preset.rounds);
    setWorkMinutes(preset.workMinutes);
    setRestMinutes(preset.restMinutes);
    resetTimerState(preset.workMinutes);
  };

  const handleStart = () => {
    if (phase === "done") {
      resetTimerState();

      setTimeout(() => {
        setHasStartedSession(true);
        setCurrentRound(1);
        setPhase("prep");
        setRemainingTime(PREP_SECONDS);
        setIsRunning(true);
        playBeep("prep");
      }, 0);

      return;
    }

    if (!hasStartedSession) {
      setHasStartedSession(true);
      setCurrentRound(1);
      setPhase("prep");
      setRemainingTime(PREP_SECONDS);
      setIsRunning(true);
      playBeep("prep");
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

  const handleTotalRoundsChange = (value) => {
    const number = Number(value);

    if (!number || number < 1) return;

    setSelectedPresetId("custom");
    setTotalRounds(number);
    resetTimerState(workMinutes);
  };

  const handleWorkMinutesChange = (value) => {
    const number = Number(value);

    if (!number || number < 1) return;

    setSelectedPresetId("custom");
    setWorkMinutes(number);

    if (!isRunning && phase === "work") {
      setRemainingTime(number * 60);
    }
  };

  const handleRestMinutesChange = (value) => {
    const number = Number(value);

    if (!number || number < 0) return;

    setSelectedPresetId("custom");
    setRestMinutes(number);
  };

  const getPhaseText = () => {
    if (phase === "prep") return "준비 시간";
    if (phase === "work") return "훈련 시간";
    if (phase === "rest") return "휴식 시간";
    return "운동 완료";
  };

  const getPhaseBadgeStyle = () => {
    if (phase === "prep") return styles.prepBadge;
    if (phase === "work") return styles.workBadge;
    if (phase === "rest") return styles.restBadge;
    return styles.doneBadge;
  };

  const getCurrentRoundName = () => {
    if (phase === "prep") return "10초 후 1라운드 자동 시작";
    if (phase === "done") return "훈련 완료";

    if (selectedPreset) {
      return `${selectedPreset.title} · ${currentRound}라운드`;
    }

    return `직접 설정 루틴 · ${currentRound}라운드`;
  };

  const handleGoProfile = () => {
    if (onGoProfile) {
      onGoProfile();
      return;
    }

    if (onGoHome) {
      onGoHome();
    }
  };

  return (
    <div style={styles.page}>
      <section style={styles.heroCard}>
        <div style={styles.kicker}>BOXING ROUND TIMER</div>

        <h1 style={styles.title}>오늘 몇 라운드 버텼나?</h1>

        <p style={styles.subtitle}>
          10초 준비 후 3분 라운드와 1분 휴식으로 훈련하고, 완료 기록을
          프로필 카드로 남기세요.
        </p>

        <div style={styles.soundBox}>
          <span style={styles.soundText}>
            소리 알림 {soundEnabled ? "켜짐" : "꺼짐"}
          </span>

          <button
            type="button"
            style={styles.soundButton}
            onClick={() => setSoundEnabled((prev) => !prev)}
          >
            {soundEnabled ? "끄기" : "켜기"}
          </button>
        </div>
      </section>

      <section style={styles.timerCard}>
        <div style={styles.timerTopRow}>
          <span style={{ ...styles.phaseBadge, ...getPhaseBadgeStyle() }}>
            {getPhaseText()}
          </span>

          <span style={styles.roundText}>
            {phase === "done" ? "완료" : `${currentRound} / ${totalRounds} R`}
          </span>
        </div>

        {phase !== "done" && (
          <div style={styles.currentRoundName}>{getCurrentRoundName()}</div>
        )}

        <div style={styles.timeText}>{formatTime(remainingTime)}</div>

        <div style={styles.sessionInfoGrid}>
          <div style={styles.sessionInfoBox}>
            <span style={styles.sessionInfoLabel}>라운드</span>
            <strong style={styles.sessionInfoValue}>{totalRounds}R</strong>
          </div>

          <div style={styles.sessionInfoBox}>
            <span style={styles.sessionInfoLabel}>운동</span>
            <strong style={styles.sessionInfoValue}>{totalWorkMinutes}분</strong>
          </div>

          <div style={styles.sessionInfoBox}>
            <span style={styles.sessionInfoLabel}>전체</span>
            <strong style={styles.sessionInfoValue}>
              {totalSessionMinutes}분
            </strong>
          </div>
        </div>

        {phase === "done" && (
          <div style={styles.doneBox}>
            <div style={styles.completeTitle}>SESSION COMPLETE</div>

            <p style={styles.savedText}>
              운동 기록에 자동 저장됐습니다. 이제 프로필 카드에서 인증 카드로
              만들 수 있어요.
            </p>

            <button
              type="button"
              style={styles.goLogButton}
              onClick={handleGoProfile}
            >
              내 프로필 확인하기
            </button>

            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => {
                if (onGoLog) onGoLog();
              }}
            >
              기록 보러가기
            </button>
          </div>
        )}

        <div style={styles.buttonRow}>
          {!isRunning ? (
            <button type="button" style={styles.startButton} onClick={handleStart}>
              {phase === "done"
                ? "다시 시작"
                : hasStartedSession
                ? "계속"
                : "시작"}
            </button>
          ) : (
            <button type="button" style={styles.pauseButton} onClick={handlePause}>
              일시정지
            </button>
          )}

          <button type="button" style={styles.resetButton} onClick={handleReset}>
            초기화
          </button>
        </div>
      </section>

      <section style={styles.routineCard}>
        <div style={styles.cardHeaderRow}>
          <h2 style={styles.cardTitle}>경기식 라운드 선택</h2>
          <span style={styles.cardHint}>3분 / 1분</span>
        </div>

        <div style={styles.routineButtonGrid}>
          {MATCH_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              style={{
                ...styles.routineButton,
                ...(selectedPresetId === preset.id
                  ? styles.activeRoutineButton
                  : {}),
              }}
              onClick={() => applyPreset(preset)}
              disabled={isRunning}
            >
              <strong>{preset.title}</strong>
            </button>
          ))}
        </div>

        <div style={styles.selectedRoutineBox}>
          <div style={styles.selectedRoutineTitle}>
            {selectedPreset ? selectedPreset.title : "직접 설정 루틴"}
          </div>

          <p style={styles.selectedRoutineDescription}>
            {selectedPreset
              ? selectedPreset.description
              : "아래 설정값으로 직접 타이머를 진행합니다."}
          </p>

          <div style={styles.roundPreviewGrid}>
            <div>
              <span>운동</span>
              <strong>{workMinutes}분</strong>
            </div>

            <div>
              <span>휴식</span>
              <strong>{restMinutes}분</strong>
            </div>

            <div>
              <span>준비</span>
              <strong>{PREP_SECONDS}초</strong>
            </div>
          </div>
        </div>
      </section>

      <section style={styles.settingCard}>
        <div style={styles.cardHeaderRow}>
          <h2 style={styles.cardTitle}>직접 설정</h2>
          <span style={styles.cardHint}>커스텀</span>
        </div>

        <label style={styles.label}>
          총 라운드
          <input
            style={styles.input}
            type="number"
            min="1"
            max="20"
            value={totalRounds}
            onChange={(event) => handleTotalRoundsChange(event.target.value)}
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
            onChange={(event) => handleWorkMinutesChange(event.target.value)}
            disabled={isRunning}
          />
        </label>

        <label style={styles.label}>
          휴식 시간 / 분
          <input
            style={styles.input}
            type="number"
            min="0"
            max="5"
            value={restMinutes}
            onChange={(event) => handleRestMinutesChange(event.target.value)}
            disabled={isRunning}
          />
        </label>
      </section>
    </div>
  );
}

const styles = {
  page: {
    width: "100%",
    maxWidth: "430px",
    margin: "0 auto",
    padding: "18px 14px 110px",
    boxSizing: "border-box",
    color: "#ffffff",
  },

  heroCard: {
    background: "linear-gradient(180deg, #1d1d1f 0%, #121212 100%)",
    border: "1px solid #2f2f33",
    borderRadius: "24px",
    padding: "20px",
    marginBottom: "14px",
    boxShadow: "0 18px 45px rgba(0, 0, 0, 0.32)",
  },

  kicker: {
    color: "#ff4444",
    fontSize: "11px",
    fontWeight: 900,
    letterSpacing: "1px",
    marginBottom: "8px",
  },

  title: {
    fontSize: "26px",
    lineHeight: 1.2,
    margin: "0 0 8px",
    fontWeight: 950,
    letterSpacing: "-0.04em",
  },

  subtitle: {
    color: "#b8b8b8",
    fontSize: "13px",
    lineHeight: 1.55,
    margin: "0 0 14px",
  },

  soundBox: {
    backgroundColor: "#0d0d0f",
    border: "1px solid #2f2f33",
    borderRadius: "16px",
    padding: "10px 12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
  },

  soundText: {
    color: "#eeeeee",
    fontSize: "13px",
    fontWeight: 800,
  },

  soundButton: {
    backgroundColor: "#ffffff",
    color: "#111111",
    border: "none",
    borderRadius: "999px",
    padding: "7px 12px",
    fontSize: "12px",
    fontWeight: 900,
    cursor: "pointer",
  },

  timerCard: {
    backgroundColor: "#1b1b1d",
    border: "1px solid #343438",
    borderRadius: "26px",
    padding: "20px",
    textAlign: "center",
    marginBottom: "14px",
    boxShadow: "0 18px 45px rgba(0, 0, 0, 0.28)",
  },

  timerTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    marginBottom: "14px",
  },

  phaseBadge: {
    borderRadius: "999px",
    padding: "7px 10px",
    fontSize: "12px",
    fontWeight: 900,
  },

  prepBadge: {
    backgroundColor: "#ffffff",
    color: "#111111",
  },

  workBadge: {
    backgroundColor: "#ff3333",
    color: "#ffffff",
  },

  restBadge: {
    backgroundColor: "#2b65ff",
    color: "#ffffff",
  },

  doneBadge: {
    backgroundColor: "#25d366",
    color: "#06150b",
  },

  roundText: {
    color: "#ff4d4d",
    fontSize: "14px",
    fontWeight: 900,
  },

  currentRoundName: {
    minHeight: "22px",
    fontSize: "17px",
    fontWeight: 900,
    marginBottom: "8px",
  },

  timeText: {
    fontSize: "62px",
    lineHeight: 1,
    fontWeight: 950,
    letterSpacing: "1px",
    margin: "14px 0 18px",
  },

  sessionInfoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "8px",
    marginBottom: "16px",
  },

  sessionInfoBox: {
    backgroundColor: "#0e0e10",
    border: "1px solid #2f2f33",
    borderRadius: "14px",
    padding: "10px 6px",
  },

  sessionInfoLabel: {
    display: "block",
    color: "#888888",
    fontSize: "11px",
    fontWeight: 800,
    marginBottom: "4px",
  },

  sessionInfoValue: {
    color: "#ffffff",
    fontSize: "15px",
  },

  doneBox: {
    backgroundColor: "#0f1912",
    border: "1px solid #244f30",
    borderRadius: "18px",
    padding: "14px",
    marginBottom: "14px",
  },

  completeTitle: {
    color: "#7CFF7C",
    fontSize: "12px",
    fontWeight: 950,
    letterSpacing: "1px",
    marginBottom: "6px",
  },

  savedText: {
    color: "#d9ffd9",
    fontSize: "13px",
    fontWeight: 800,
    lineHeight: 1.5,
    margin: "0 0 12px",
  },

  goLogButton: {
    width: "100%",
    backgroundColor: "#ffffff",
    color: "#111111",
    border: "none",
    borderRadius: "14px",
    padding: "13px 16px",
    fontSize: "14px",
    fontWeight: 900,
    cursor: "pointer",
  },

  secondaryButton: {
    width: "100%",
    marginTop: "8px",
    backgroundColor: "#1c1c1c",
    color: "#ffffff",
    border: "1px solid #333333",
    borderRadius: "14px",
    padding: "13px 16px",
    fontSize: "14px",
    fontWeight: 900,
    cursor: "pointer",
  },

  buttonRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },

  startButton: {
    backgroundColor: "#ff3333",
    color: "white",
    border: "none",
    borderRadius: "15px",
    padding: "15px",
    fontSize: "15px",
    fontWeight: 950,
    cursor: "pointer",
  },

  pauseButton: {
    backgroundColor: "#3a3a3f",
    color: "white",
    border: "none",
    borderRadius: "15px",
    padding: "15px",
    fontSize: "15px",
    fontWeight: 950,
    cursor: "pointer",
  },

  resetButton: {
    backgroundColor: "#0f0f11",
    color: "white",
    border: "1px solid #44444a",
    borderRadius: "15px",
    padding: "15px",
    fontSize: "15px",
    fontWeight: 800,
    cursor: "pointer",
  },

  routineCard: {
    backgroundColor: "#1b1b1d",
    border: "1px solid #343438",
    borderRadius: "24px",
    padding: "16px",
    marginBottom: "14px",
  },

  cardHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    marginBottom: "12px",
  },

  cardTitle: {
    fontSize: "17px",
    margin: 0,
    fontWeight: 950,
  },

  cardHint: {
    color: "#9b9b9b",
    fontSize: "12px",
    fontWeight: 800,
  },

  routineButtonGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    marginBottom: "12px",
  },

  routineButton: {
    backgroundColor: "#0f0f11",
    color: "#dddddd",
    border: "1px solid #39393f",
    borderRadius: "18px",
    padding: "18px 10px",
    fontSize: "16px",
    fontWeight: 950,
    cursor: "pointer",
    minHeight: "58px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },

  activeRoutineButton: {
    backgroundColor: "#ff3333",
    color: "white",
    border: "1px solid #ff3333",
  },

  selectedRoutineBox: {
    backgroundColor: "#0f0f11",
    border: "1px solid #303036",
    borderRadius: "18px",
    padding: "14px",
  },

  selectedRoutineTitle: {
    fontSize: "16px",
    fontWeight: 950,
    marginBottom: "6px",
  },

  selectedRoutineDescription: {
    color: "#a9a9a9",
    fontSize: "12px",
    marginTop: 0,
    marginBottom: "12px",
    lineHeight: 1.5,
  },

  roundPreviewGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "8px",
  },

  settingCard: {
    backgroundColor: "#1b1b1d",
    border: "1px solid #343438",
    borderRadius: "24px",
    padding: "16px",
  },

  label: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    marginBottom: "12px",
    color: "#dddddd",
    fontSize: "13px",
    fontWeight: 850,
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    backgroundColor: "#050505",
    color: "#ffffff",
    border: "1px solid #44444a",
    borderRadius: "12px",
    padding: "12px",
    fontSize: "15px",
    fontWeight: 800,
    outline: "none",
  },
};