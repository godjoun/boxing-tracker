import { useEffect, useRef, useState } from "react";
import { useTraining } from "../store/TrainingContext";

const MATCH_PRESETS = [
  {
    id: "match3",
    title: "3R",
    description: "가볍게 실전 감각을 올리는 기본 경기식",
    rounds: 3,
    workSeconds: 180,
    restSeconds: 30,
  },
  {
    id: "match6",
    title: "6R",
    description: "체력과 집중력을 같이 올리는 중간 강도",
    rounds: 6,
    workSeconds: 180,
    restSeconds: 30,
  },
  {
    id: "match9",
    title: "9R",
    description: "길게 버티는 훈련용 경기식",
    rounds: 9,
    workSeconds: 180,
    restSeconds: 30,
  },
  {
    id: "match12",
    title: "12R",
    description: "챔피언 라운드 감각으로 끝까지 버티기",
    rounds: 12,
    workSeconds: 180,
    restSeconds: 30,
  },
];

const PREP_SECONDS = 10;

const SOUND_OPTIONS = [
  {
    id: "basic",
    label: "기본음",
    description: "복싱 종 울림",
  },
  {
    id: "strong",
    label: "강한 알림음",
    description: "운동 중 더 잘 들림",
  },
  {
    id: "mute",
    label: "무음",
    description: "소리 없이 진행",
  },
];

const formatTime = (seconds) => {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const min = Math.floor(safeSeconds / 60);
  const sec = safeSeconds % 60;

  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

const formatDurationLabel = (seconds) => {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const min = Math.floor(safeSeconds / 60);
  const sec = safeSeconds % 60;

  if (min > 0 && sec > 0) {
    return `${min}분 ${sec}초`;
  }

  if (min > 0) {
    return `${min}분`;
  }

  return `${sec}초`;
};

const clampSeconds = (value, min, max) => {
  const number = Number(value);

  if (Number.isNaN(number)) return min;

  return Math.max(min, Math.min(max, number));
};

const getLogExp = (log) => {
  const score = Number(log.score);
  if (Number.isFinite(score) && score > 0) return score;
  return Math.max(0, Number(log.minutes || log.duration || 0));
};

const getLevelFromExp = (exp) => Math.floor(exp / 100) + 1;

export default function TimerPage({ onGoLog, onGoHome, onGoProfile }) {
  const { addLog, logs } = useTraining();

  const [selectedPresetId, setSelectedPresetId] = useState("match3");

  const selectedPreset = MATCH_PRESETS.find((preset) => {
    return preset.id === selectedPresetId;
  });

  const [totalRounds, setTotalRounds] = useState(3);
  const [workSecondsSetting, setWorkSecondsSetting] = useState(180);
  const [restSecondsSetting, setRestSecondsSetting] = useState(30);

  const [currentRound, setCurrentRound] = useState(1);
  const [phase, setPhase] = useState("work"); // prep, work, rest, done
  const [remainingTime, setRemainingTime] = useState(180);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStartedSession, setHasStartedSession] = useState(false);
  const [hasSavedLog, setHasSavedLog] = useState(false);
  const [completionResult, setCompletionResult] = useState(null);
  const [soundMode, setSoundMode] = useState("basic");

  const savedLogRef = useRef(false);
  const previousPhaseRef = useRef("work");
  const audioContextRef = useRef(null);

  const workSeconds = workSecondsSetting;
  const restSeconds = restSecondsSetting;

  const totalWorkSeconds = totalRounds * workSecondsSetting;
  const totalSessionSeconds =
    totalWorkSeconds + Math.max(totalRounds - 1, 0) * restSecondsSetting;
  const totalWorkMinutes = Math.max(1, Math.round(totalWorkSeconds / 60));

  const routineTitle = selectedPreset
    ? selectedPreset.title
    : "직접 설정 루틴";

  const playBeep = async (type = "work") => {
    if (soundMode === "mute") return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;

    if (!AudioContext) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    const audioContext = audioContextRef.current;

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    const now = audioContext.currentTime;

    // 기본음: 띵~ 하는 복싱 종 울림 느낌
    if (soundMode === "basic") {
      const isRest = type === "rest";
      const isDone = type === "done";

      const baseFrequencies = isRest
        ? [520, 1040, 1560]
        : [740, 1480, 2220];

      const duration = isDone ? 0.95 : 0.72;
      const volume = isDone ? 0.34 : 0.28;

      baseFrequencies.forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(
          volume / (index + 1),
          now + 0.015
        );
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.start(now);
        oscillator.stop(now + duration);
      });

      return;
    }

    // 강한 알림음: 운동 중 잘 들리는 짧고 강한 소리
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    const frequencyMap = {
      prep: 920,
      work: 1120,
      rest: 620,
      done: 1280,
    };

    const durationMap = {
      prep: 0.26,
      work: 0.3,
      rest: 0.34,
      done: 0.46,
    };

    const frequency = frequencyMap[type] || 1120;
    const duration = durationMap[type] || 0.3;

    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(frequency, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.42, now + 0.01);
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

    const totalExpBefore = logs.reduce((sum, log) => sum + getLogExp(log), 0);
    const savedLog = addLog({
      type: routineTitle,
      minutes: totalWorkMinutes,
      duration: totalWorkMinutes,
      rounds: totalRounds,
      totalRounds,
      completedRounds: totalRounds,
      difficulty: "normal",
      source: "timer",
      memo: `${totalRounds}라운드 완료 / 운동 ${formatDurationLabel(
        workSecondsSetting
      )} / 휴식 ${formatDurationLabel(
        restSecondsSetting
      )} / 준비 ${PREP_SECONDS}초`,
      publicComment: `${totalRounds}라운드 완료. 오늘도 끝까지 버텼다.`,
    });

    const gainedExp = getLogExp(savedLog);
    const totalExpAfter = totalExpBefore + gainedExp;
    const previousLevel = getLevelFromExp(totalExpBefore);
    const currentLevel = getLevelFromExp(totalExpAfter);

    setCompletionResult({
      gainedExp,
      totalExp: totalExpAfter,
      previousLevel,
      currentLevel,
      currentLevelExp: totalExpAfter % 100,
      expToNextLevel: 100 - (totalExpAfter % 100),
      didLevelUp: currentLevel > previousLevel,
    });
    setHasSavedLog(true);
  }, [
    phase,
    hasSavedLog,
    addLog,
    routineTitle,
    totalRounds,
    workSecondsSetting,
    restSecondsSetting,
    totalWorkMinutes,
    logs,
  ]);

  const resetTimerState = (nextWorkSeconds = workSecondsSetting) => {
    setIsRunning(false);
    setCurrentRound(1);
    setPhase("work");
    previousPhaseRef.current = "work";
    setRemainingTime(nextWorkSeconds);
    setHasStartedSession(false);
    setHasSavedLog(false);
    setCompletionResult(null);
    savedLogRef.current = false;
  };

  const applyPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setTotalRounds(preset.rounds);
    setWorkSecondsSetting(preset.workSeconds);
    setRestSecondsSetting(preset.restSeconds);
    resetTimerState(preset.workSeconds);
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
    resetTimerState(workSecondsSetting);
  };

  const handleWorkSecondsChange = (deltaSeconds) => {
    if (isRunning) return;

    const nextSeconds = clampSeconds(
      workSecondsSetting + deltaSeconds,
      10,
      600
    );

    setSelectedPresetId("custom");
    setWorkSecondsSetting(nextSeconds);

    if (!isRunning && phase === "work") {
      setRemainingTime(nextSeconds);
    }
  };

  const handleRestSecondsChange = (deltaSeconds) => {
    if (isRunning) return;

    const nextSeconds = clampSeconds(
      restSecondsSetting + deltaSeconds,
      0,
      300
    );

    setSelectedPresetId("custom");
    setRestSecondsSetting(nextSeconds);
  };

  const handleRestQuickSelect = (seconds) => {
    if (isRunning) return;

    setSelectedPresetId("custom");
    setRestSecondsSetting(seconds);
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
          10초 준비 후 3분 라운드와 30초 휴식으로 훈련하고, 완료 기록을
          프로필 카드로 남기세요.
        </p>

        <div style={styles.soundBox}>
          <div style={styles.soundHeaderRow}>
            <span style={styles.soundText}>알림음 선택</span>
            <strong style={styles.soundStatus}>
              {SOUND_OPTIONS.find((option) => option.id === soundMode)?.label}
            </strong>
          </div>

          <div style={styles.soundOptionGrid}>
            {SOUND_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                style={{
                  ...styles.soundOptionButton,
                  ...(soundMode === option.id
                    ? styles.activeSoundOptionButton
                    : {}),
                }}
                onClick={() => setSoundMode(option.id)}
              >
                <strong style={styles.soundOptionLabel}>{option.label}</strong>
                <span style={styles.soundOptionDescription}>
                  {option.description}
                </span>
              </button>
            ))}
          </div>
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
              {formatDurationLabel(totalSessionSeconds)}
            </strong>
          </div>
        </div>

        {phase === "done" && (
          <div style={styles.doneBox}>
            <div style={styles.completeTitle}>SESSION COMPLETE</div>

            <p style={styles.savedText}>
              운동 기록에 자동 저장됐습니다.
            </p>

            {completionResult && (
              <div style={styles.growthResult}>
                {completionResult.didLevelUp && (
                  <div style={styles.levelUpBadge}>LEVEL UP!</div>
                )}

                <div style={styles.growthResultGrid}>
                  <div style={styles.growthResultItem}>
                    <span style={styles.growthResultLabel}>완료 라운드</span>
                    <strong style={styles.growthResultValue}>{totalRounds}R</strong>
                  </div>
                  <div style={styles.growthResultItem}>
                    <span style={styles.growthResultLabel}>훈련 시간</span>
                    <strong style={styles.growthResultValue}>
                      {totalWorkMinutes}분
                    </strong>
                  </div>
                  <div style={styles.growthResultItem}>
                    <span style={styles.growthResultLabel}>획득 경험치</span>
                    <strong style={styles.growthExpValue}>
                      +{completionResult.gainedExp} EXP
                    </strong>
                  </div>
                </div>

                <div style={styles.levelProgressHeader}>
                  <strong style={styles.levelText}>
                    LV. {completionResult.currentLevel}
                  </strong>
                  <span style={styles.levelProgressText}>
                    {completionResult.currentLevelExp} / 100 EXP
                  </span>
                </div>
                <div style={styles.levelProgressTrack}>
                  <div
                    style={{
                      ...styles.levelProgressFill,
                      width: `${completionResult.currentLevelExp}%`,
                    }}
                  />
                </div>
                <p style={styles.nextLevelText}>
                  다음 레벨까지 {completionResult.expToNextLevel} EXP
                </p>
              </div>
            )}

            <button
              type="button"
              style={styles.goLogButton}
              onClick={handleGoProfile}
            >
              파이터 카드 만들기
            </button>

            <button
              type="button"
              style={styles.homeResultButton}
              onClick={() => {
                if (onGoHome) onGoHome();
              }}
            >
              홈에서 성장 확인
            </button>

            <button
              type="button"
              style={styles.textResultButton}
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
          <span style={styles.cardHint}>3분 / 30초</span>
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
              <strong>{formatDurationLabel(workSecondsSetting)}</strong>
            </div>

            <div>
              <span>휴식</span>
              <strong>{formatDurationLabel(restSecondsSetting)}</strong>
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
          <span style={styles.cardHint}>버튼으로 조절</span>
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

        <div style={styles.settingGroup}>
          <div style={styles.settingLabelRow}>
            <span style={styles.settingLabel}>운동 시간</span>
            <strong style={styles.timeDisplay}>
              {formatTime(workSecondsSetting)}
            </strong>
          </div>

          <div style={styles.timeButtonRow}>
            <button
              type="button"
              style={styles.timeAdjustButton}
              onClick={() => handleWorkSecondsChange(-10)}
              disabled={isRunning}
            >
              -10초
            </button>

            <button
              type="button"
              style={styles.timeAdjustButton}
              onClick={() => handleWorkSecondsChange(-1)}
              disabled={isRunning}
            >
              -1초
            </button>

            <button
              type="button"
              style={styles.timeAdjustButton}
              onClick={() => handleWorkSecondsChange(1)}
              disabled={isRunning}
            >
              +1초
            </button>

            <button
              type="button"
              style={styles.timeAdjustButton}
              onClick={() => handleWorkSecondsChange(10)}
              disabled={isRunning}
            >
              +10초
            </button>
          </div>
        </div>

        <div style={styles.settingGroup}>
          <div style={styles.settingLabelRow}>
            <span style={styles.settingLabel}>휴식 시간</span>
            <strong style={styles.timeDisplay}>
              {formatTime(restSecondsSetting)}
            </strong>
          </div>

          <div style={styles.quickButtonRow}>
            {[30, 45, 60].map((seconds) => (
              <button
                key={seconds}
                type="button"
                style={{
                  ...styles.quickSelectButton,
                  ...(restSecondsSetting === seconds
                    ? styles.activeQuickSelectButton
                    : {}),
                }}
                onClick={() => handleRestQuickSelect(seconds)}
                disabled={isRunning}
              >
                {formatDurationLabel(seconds)}
              </button>
            ))}
          </div>

          <div style={styles.timeButtonRow}>
            <button
              type="button"
              style={styles.timeAdjustButton}
              onClick={() => handleRestSecondsChange(-10)}
              disabled={isRunning}
            >
              -10초
            </button>

            <button
              type="button"
              style={styles.timeAdjustButton}
              onClick={() => handleRestSecondsChange(-1)}
              disabled={isRunning}
            >
              -1초
            </button>

            <button
              type="button"
              style={styles.timeAdjustButton}
              onClick={() => handleRestSecondsChange(1)}
              disabled={isRunning}
            >
              +1초
            </button>

            <button
              type="button"
              style={styles.timeAdjustButton}
              onClick={() => handleRestSecondsChange(10)}
              disabled={isRunning}
            >
              +10초
            </button>
          </div>
        </div>
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
    padding: "12px",
  },

  soundHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    marginBottom: "10px",
  },

  soundText: {
    color: "#eeeeee",
    fontSize: "13px",
    fontWeight: 900,
  },

  soundStatus: {
    color: "#ff5555",
    fontSize: "12px",
    fontWeight: 950,
  },

  soundOptionGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "8px",
  },

  soundOptionButton: {
    width: "100%",
    border: "1px solid #2f2f33",
    borderRadius: "14px",
    padding: "11px 12px",
    backgroundColor: "#151517",
    color: "#ffffff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    textAlign: "left",
  },

  activeSoundOptionButton: {
    backgroundColor: "#ff3333",
    border: "1px solid #ff3333",
  },

  soundOptionLabel: {
    fontSize: "13px",
    fontWeight: 950,
  },

  soundOptionDescription: {
    color: "rgba(255, 255, 255, 0.68)",
    fontSize: "11px",
    fontWeight: 800,
    whiteSpace: "nowrap",
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

  growthResult: {
    marginBottom: "12px",
    padding: "12px",
    border: "1px solid rgba(124, 255, 124, 0.18)",
    borderRadius: "15px",
    background: "rgba(0, 0, 0, 0.18)",
  },

  levelUpBadge: {
    display: "inline-block",
    marginBottom: "10px",
    padding: "5px 8px",
    borderRadius: "999px",
    background: "#d6a234",
    color: "#111111",
    fontSize: "10px",
    fontWeight: 950,
    letterSpacing: "0.08em",
  },

  growthResultGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "6px",
  },

  growthResultItem: {
    minWidth: 0,
    padding: "8px 4px",
    borderRadius: "11px",
    background: "rgba(255, 255, 255, 0.045)",
  },

  growthResultLabel: {
    display: "block",
    marginBottom: "5px",
    color: "rgba(255, 255, 255, 0.52)",
    fontSize: "9px",
    fontWeight: 800,
  },

  growthResultValue: {
    display: "block",
    color: "#ffffff",
    fontSize: "14px",
  },

  growthExpValue: {
    display: "block",
    color: "#7CFF7C",
    fontSize: "13px",
  },

  levelProgressHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "12px",
  },

  levelText: {
    color: "#ffffff",
    fontSize: "12px",
  },

  levelProgressText: {
    color: "rgba(255, 255, 255, 0.52)",
    fontSize: "10px",
    fontWeight: 800,
  },

  levelProgressTrack: {
    height: "7px",
    marginTop: "7px",
    overflow: "hidden",
    borderRadius: "999px",
    background: "rgba(255, 255, 255, 0.09)",
  },

  levelProgressFill: {
    height: "100%",
    minWidth: "3px",
    borderRadius: "999px",
    background: "linear-gradient(90deg, #7CFF7C, #d6ff9b)",
  },

  nextLevelText: {
    margin: "7px 0 0",
    color: "rgba(255, 255, 255, 0.52)",
    fontSize: "10px",
    textAlign: "right",
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

  homeResultButton: {
    width: "100%",
    marginTop: "8px",
    backgroundColor: "#ff3333",
    color: "#ffffff",
    border: "none",
    borderRadius: "14px",
    padding: "13px 16px",
    fontSize: "14px",
    fontWeight: 900,
    cursor: "pointer",
  },

  textResultButton: {
    width: "100%",
    marginTop: "6px",
    padding: "8px",
    border: "none",
    background: "transparent",
    color: "rgba(255, 255, 255, 0.58)",
    fontSize: "12px",
    fontWeight: 800,
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

  settingGroup: {
    backgroundColor: "#0f0f11",
    border: "1px solid #303036",
    borderRadius: "18px",
    padding: "14px",
    marginBottom: "12px",
  },

  settingLabelRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    marginBottom: "10px",
  },

  settingLabel: {
    color: "#dddddd",
    fontSize: "13px",
    fontWeight: 900,
  },

  timeDisplay: {
    color: "#ffffff",
    fontSize: "18px",
    fontWeight: 950,
    letterSpacing: "0.5px",
  },

  timeButtonRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr",
    gap: "8px",
  },

  timeAdjustButton: {
    backgroundColor: "#18181b",
    color: "#ffffff",
    border: "1px solid #3a3a40",
    borderRadius: "12px",
    padding: "12px 6px",
    fontSize: "13px",
    fontWeight: 900,
    cursor: "pointer",
  },

  quickButtonRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "8px",
    marginBottom: "8px",
  },

  quickSelectButton: {
    backgroundColor: "#18181b",
    color: "#ffffff",
    border: "1px solid #3a3a40",
    borderRadius: "12px",
    padding: "12px 6px",
    fontSize: "13px",
    fontWeight: 900,
    cursor: "pointer",
  },

  activeQuickSelectButton: {
    backgroundColor: "#ff3333",
    border: "1px solid #ff3333",
  },
};
