import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import { useTraining } from "../store/TrainingContext";
import { getCompletionDelta } from "../utils/fighterProgress";
import {
  getCurriculumPhaseFocus,
  markCurriculumSessionComplete,
} from "../utils/homeCurriculum";
import { formatTimerDurationLabel } from "../utils/curriculumTimerSync";
import {
  shouldApplyLaunchConfig,
  useTimerSessionListener,
} from "../hooks/useBackgroundTimerSession";
import {
  clearTimerSession,
  getTimerSessionSummary,
  reconcileTimerSession,
  saveTimerSession,
} from "../utils/timerSession";
import {
  bindTimerMediaSessionHandlers,
  clearTimerMediaSession,
  updateTimerMediaSession,
} from "../utils/timerMediaSession";
import {
  playTimerBeep,
  previewTimerBeep,
  resumeTimerAudio,
  startTimerAudioSession,
  stopTimerAudioSession,
  supportsHeadphoneTimerAudio,
} from "../utils/timerAudio";
import {
  buildTimerSnapshot,
  readInitialTimerState,
} from "../utils/timerPagePersistence";
import { styles } from "./TimerPage.styles";
import CurriculumTimerPanel from "../components/CurriculumTimerPanel";
import {
  INTERVAL_TIMER_PRESET,
  getTimerPresetById,
} from "../utils/timerPresets";
import "./TimerPage.css";

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

const SETUP_PRESETS = [INTERVAL_TIMER_PRESET, ...MATCH_PRESETS];

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

function getSetupSummary({
  isIntervalMode,
  totalRounds,
  workSecondsSetting,
  restSecondsSetting,
  totalSessionSeconds,
}) {
  const countLabel = isIntervalMode ? `${totalRounds}세트` : `${totalRounds}R`;

  return `${countLabel} · 운동 ${formatDurationLabel(
    workSecondsSetting
  )} / 휴식 ${formatDurationLabel(
    restSecondsSetting
  )} · 전체 ${formatDurationLabel(totalSessionSeconds)}`;
}

const clampSeconds = (value, min, max) => {
  const number = Number(value);

  if (Number.isNaN(number)) return min;

  return Math.max(min, Math.min(max, number));
};

export default function TimerPage({
  launchConfig = null,
  onLaunchConsumed,
  onGoLog,
  onGoHome,
  onGoProfile,
}) {
  const { addLog, logs } = useTraining();
  const initialTimerState = readInitialTimerState();

  const [selectedPresetId, setSelectedPresetId] = useState(
    initialTimerState.selectedPresetId
  );
  const [curriculumSessionId, setCurriculumSessionId] = useState(
    initialTimerState.curriculumSessionId
  );
  const [curriculumRoutineTitle, setCurriculumRoutineTitle] = useState(
    initialTimerState.curriculumRoutineTitle
  );
  const [curriculumLogType, setCurriculumLogType] = useState(
    initialTimerState.curriculumLogType
  );
  const [curriculumSessionTitle, setCurriculumSessionTitle] = useState(
    initialTimerState.curriculumSessionTitle
  );
  const [curriculumGoal, setCurriculumGoal] = useState(
    initialTimerState.curriculumGoal
  );
  const [curriculumSessionCode, setCurriculumSessionCode] = useState(
    initialTimerState.curriculumSessionCode
  );
  const [curriculumWeekLabel, setCurriculumWeekLabel] = useState(
    initialTimerState.curriculumWeekLabel
  );
  const [curriculumWeekTheme, setCurriculumWeekTheme] = useState(
    initialTimerState.curriculumWeekTheme
  );
  const [curriculumDrills, setCurriculumDrills] = useState(
    initialTimerState.curriculumDrills
  );
  const [prepSecondsSetting, setPrepSecondsSetting] = useState(
    initialTimerState.prepSecondsSetting
  );
  const [cooldownSecondsSetting, setCooldownSecondsSetting] = useState(
    initialTimerState.cooldownSecondsSetting
  );

  const isCurriculumSession = curriculumDrills.length > 0;
  const activePrepSeconds = isCurriculumSession ? prepSecondsSetting : PREP_SECONDS;

  const selectedPreset = getTimerPresetById(selectedPresetId);
  const isIntervalMode = selectedPresetId === INTERVAL_TIMER_PRESET.id;

  const [totalRounds, setTotalRounds] = useState(initialTimerState.totalRounds);
  const [workSecondsSetting, setWorkSecondsSetting] = useState(
    initialTimerState.workSecondsSetting
  );
  const [restSecondsSetting, setRestSecondsSetting] = useState(
    initialTimerState.restSecondsSetting
  );

  const [currentRound, setCurrentRound] = useState(initialTimerState.currentRound);
  const [phase, setPhase] = useState(initialTimerState.phase);
  const [remainingTime, setRemainingTime] = useState(
    initialTimerState.remainingTime
  );
  const [isRunning, setIsRunning] = useState(initialTimerState.isRunning);
  const [hasStartedSession, setHasStartedSession] = useState(
    initialTimerState.hasStartedSession
  );
  const [hasSavedLog, setHasSavedLog] = useState(initialTimerState.hasSavedLog);
  const [completionResult, setCompletionResult] = useState(null);
  const [completedLogId, setCompletedLogId] = useState(null);
  const [soundMode, setSoundMode] = useState(initialTimerState.soundMode);

  const savedLogRef = useRef(initialTimerState.hasSavedLog);
  const previousPhaseRef = useRef(initialTimerState.phase);
  const lastTapRef = useRef(0);

  const workSeconds = workSecondsSetting;
  const restSeconds = restSecondsSetting;

  const totalWorkSeconds = totalRounds * workSecondsSetting;
  const totalSessionSeconds =
    totalWorkSeconds + Math.max(totalRounds - 1, 0) * restSecondsSetting;
  const totalWorkMinutes = Math.max(1, Math.round(totalWorkSeconds / 60));

  const setupSummary = useMemo(
    () =>
      getSetupSummary({
        isIntervalMode,
        totalRounds,
        workSecondsSetting,
        restSecondsSetting,
        totalSessionSeconds,
      }),
    [
      isIntervalMode,
      totalRounds,
      workSecondsSetting,
      restSecondsSetting,
      totalSessionSeconds,
    ]
  );

  const routineTitle = curriculumRoutineTitle
    ? curriculumRoutineTitle
    : selectedPreset
      ? selectedPreset.title
      : "직접 설정 루틴";

  const curriculumFocus = useMemo(
    () =>
      getCurriculumPhaseFocus(
        curriculumDrills,
        phase,
        currentRound,
        totalRounds
      ),
    [curriculumDrills, phase, currentRound, totalRounds]
  );

  const applyPersistedState = useCallback((saved) => {
    if (!saved) return;

    setSelectedPresetId(saved.selectedPresetId ?? "match3");
    setCurriculumSessionId(saved.curriculumSessionId ?? null);
    setCurriculumRoutineTitle(saved.curriculumRoutineTitle ?? "");
    setCurriculumLogType(saved.curriculumLogType ?? "");
    setCurriculumSessionTitle(saved.curriculumSessionTitle ?? "");
    setCurriculumGoal(saved.curriculumGoal ?? "");
    setCurriculumSessionCode(saved.curriculumSessionCode ?? "");
    setCurriculumWeekLabel(saved.curriculumWeekLabel ?? "");
    setCurriculumWeekTheme(saved.curriculumWeekTheme ?? "");
    setCurriculumDrills(
      Array.isArray(saved.curriculumDrills) ? saved.curriculumDrills : []
    );
    setPrepSecondsSetting(saved.prepSecondsSetting ?? 10);
    setCooldownSecondsSetting(saved.cooldownSecondsSetting ?? 0);
    setTotalRounds(saved.totalRounds ?? 3);
    setWorkSecondsSetting(saved.workSecondsSetting ?? 180);
    setRestSecondsSetting(saved.restSecondsSetting ?? 30);
    setCurrentRound(saved.currentRound ?? 1);
    setPhase(saved.phase ?? "work");
    setRemainingTime(saved.remainingTime ?? 180);
    setIsRunning(Boolean(saved.isRunning));
    setHasStartedSession(Boolean(saved.hasStartedSession));
    setHasSavedLog(Boolean(saved.hasSavedLog));
    setSoundMode(saved.soundMode ?? "basic");
    previousPhaseRef.current = saved.phase ?? "work";
    savedLogRef.current = Boolean(saved.hasSavedLog);
  }, []);

  useTimerSessionListener(applyPersistedState);

  function clearCurriculumContext() {
    setCurriculumSessionId(null);
    setCurriculumRoutineTitle("");
    setCurriculumLogType("");
    setCurriculumSessionTitle("");
    setCurriculumGoal("");
    setCurriculumSessionCode("");
    setCurriculumWeekLabel("");
    setCurriculumWeekTheme("");
    setCurriculumDrills([]);
    setPrepSecondsSetting(10);
    setCooldownSecondsSetting(0);
  }

  useEffect(() => {
    const snapshot = buildTimerSnapshot({
      selectedPresetId,
      curriculumSessionId,
      curriculumRoutineTitle,
      curriculumLogType,
      curriculumSessionTitle,
      curriculumGoal,
      curriculumSessionCode,
      curriculumWeekLabel,
      curriculumWeekTheme,
      curriculumDrills,
      prepSecondsSetting,
      cooldownSecondsSetting,
      totalRounds,
      workSecondsSetting,
      restSecondsSetting,
      currentRound,
      phase,
      remainingTime,
      isRunning,
      hasStartedSession,
      hasSavedLog,
      soundMode,
      routineTitle,
    });

    saveTimerSession(snapshot);
    updateTimerMediaSession(getTimerSessionSummary(snapshot));
  }, [
    selectedPresetId,
    curriculumSessionId,
    curriculumRoutineTitle,
    curriculumLogType,
    curriculumSessionTitle,
    curriculumGoal,
    curriculumSessionCode,
    curriculumWeekLabel,
    curriculumWeekTheme,
    curriculumDrills,
    prepSecondsSetting,
    cooldownSecondsSetting,
    totalRounds,
    workSecondsSetting,
    restSecondsSetting,
    currentRound,
    phase,
    remainingTime,
    isRunning,
    hasStartedSession,
    hasSavedLog,
    soundMode,
    routineTitle,
  ]);

  useEffect(() => {
    return bindTimerMediaSessionHandlers({
      onPlay: () => {
        resumeTimerAudio();
        setIsRunning(true);
      },
      onPause: () => setIsRunning(false),
    });
  }, []);

  useEffect(() => {
    if (soundMode === "mute" || !hasStartedSession) {
      stopTimerAudioSession();
      return undefined;
    }

    if (phase === "done") {
      const timeoutId = setTimeout(() => stopTimerAudioSession(), 2500);
      return () => clearTimeout(timeoutId);
    }

    startTimerAudioSession();
    return undefined;
  }, [hasStartedSession, phase, soundMode]);

  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible") {
        resumeTimerAudio();
      }

      if (document.visibilityState !== "visible") return;

      const saved = reconcileTimerSession(
        buildTimerSnapshot({
          selectedPresetId,
          curriculumSessionId,
          curriculumRoutineTitle,
          curriculumLogType,
          curriculumSessionTitle,
          curriculumGoal,
          curriculumSessionCode,
          curriculumWeekLabel,
          curriculumWeekTheme,
          curriculumDrills,
          totalRounds,
          workSecondsSetting,
          restSecondsSetting,
          currentRound,
          phase,
          remainingTime,
          isRunning,
          hasStartedSession,
          hasSavedLog,
          soundMode,
          routineTitle,
        })
      );

      applyPersistedState(saved);
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [
    applyPersistedState,
    selectedPresetId,
    curriculumSessionId,
    curriculumRoutineTitle,
    curriculumLogType,
    curriculumSessionTitle,
    curriculumGoal,
    curriculumSessionCode,
    curriculumWeekLabel,
    curriculumWeekTheme,
    curriculumDrills,
    prepSecondsSetting,
    cooldownSecondsSetting,
    totalRounds,
    workSecondsSetting,
    restSecondsSetting,
    currentRound,
    phase,
    remainingTime,
    isRunning,
    hasStartedSession,
    hasSavedLog,
    soundMode,
    routineTitle,
  ]);

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
            if (isCurriculumSession && cooldownSecondsSetting > 0) {
              setPhase("cooldown");
              return cooldownSecondsSetting;
            }

            setPhase("done");
            setIsRunning(false);
            return 0;
          }

          setPhase("rest");
          return restSeconds;
        }

        if (phase === "cooldown") {
          setPhase("done");
          setIsRunning(false);
          return 0;
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
  }, [isRunning, phase, currentRound, totalRounds, workSeconds, restSeconds, isCurriculumSession, cooldownSecondsSetting]);

  useEffect(() => {
    if (previousPhaseRef.current === phase) return;

    if (phase === "prep") {
      playTimerBeep(soundMode, "prep");
    }

    if (phase === "work") {
      playTimerBeep(soundMode, "work");
    }

    if (phase === "rest") {
      playTimerBeep(soundMode, "rest");
    }

    if (phase === "cooldown") {
      playTimerBeep(soundMode, "cooldown");
    }

    if (phase === "done") {
      playTimerBeep(soundMode, "done");

      setTimeout(() => {
        playTimerBeep(soundMode, "done");
      }, 180);
    }

    previousPhaseRef.current = phase;
  }, [phase, soundMode]);

  useEffect(() => {
    if (phase !== "done") return;
    if (savedLogRef.current) return;
    if (hasSavedLog) return;

    savedLogRef.current = true;

    const savedLog = addLog({
      type: curriculumLogType || `${totalRounds}R 라운드 훈련`,
      minutes: totalWorkMinutes,
      duration: totalWorkMinutes,
      rounds: totalRounds,
      totalRounds,
      completedRounds: totalRounds,
      difficulty: "normal",
      source: "timer",
      memo: `${routineTitle} · ${totalRounds}라운드 완료 / 운동 ${formatDurationLabel(
        workSecondsSetting
      )} / 휴식 ${formatDurationLabel(
        restSecondsSetting
      )} / 준비 ${isCurriculumSession ? formatTimerDurationLabel(activePrepSeconds) : `${PREP_SECONDS}초`}`,
      publicComment: curriculumSessionId
        ? `${routineTitle} 완료. 홈 커리큘럼 한 세션 더 버텼다.`
        : `${totalRounds}R 완료. 오늘도 끝까지 버텼다.`,
    });

    if (curriculumSessionId) {
      markCurriculumSessionComplete(curriculumSessionId);
    }

    setCompletionResult(getCompletionDelta(logs, savedLog));
    setCompletedLogId(savedLog.id);
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
    curriculumLogType,
    curriculumSessionId,
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
    setCompletedLogId(null);
    savedLogRef.current = false;
  };

  const applyLaunchConfig = (config) => {
    if (!config) return;

    setSelectedPresetId(config.presetId || "custom");
    setTotalRounds(config.rounds);
    setWorkSecondsSetting(config.workSeconds);
    setRestSecondsSetting(config.restSeconds);
    setCurriculumSessionId(config.curriculumSessionId || null);
    setCurriculumRoutineTitle(config.routineTitle || "");
    setCurriculumLogType(config.logType || "");
    setCurriculumSessionTitle(config.curriculumTitle || "");
    setCurriculumGoal(config.curriculumGoal || "");
    setCurriculumSessionCode(config.curriculumSessionCode || "");
    setCurriculumWeekLabel(config.curriculumWeekLabel || "");
    setCurriculumWeekTheme(config.curriculumWeekTheme || "");
    setCurriculumDrills(config.curriculumDrills || []);
    setPrepSecondsSetting(config.prepSeconds ?? 10);
    setCooldownSecondsSetting(config.cooldownSeconds ?? 0);
    resetTimerState(config.workSeconds);
  };

  const applyPreset = (preset) => {
    setSelectedPresetId(preset.id);
    clearCurriculumContext();
    setCurriculumLogType(preset.logType || "");
    setTotalRounds(preset.rounds);
    setWorkSecondsSetting(preset.workSeconds);
    setRestSecondsSetting(preset.restSeconds);
    resetTimerState(preset.workSeconds);
  };

  useEffect(() => {
    if (!launchConfig) return;
    if (!shouldApplyLaunchConfig(launchConfig)) {
      onLaunchConsumed?.();
      return;
    }

    applyLaunchConfig(launchConfig);
    onLaunchConsumed?.();
  }, [launchConfig]);

  const handleStart = async () => {
    if (phase === "done" || !hasStartedSession) {
      track("training_start", {
        mode: launchConfig?.curriculumSessionId ? "curriculum" : "timer",
      });
    }

    if (soundMode !== "mute") {
      await startTimerAudioSession();
    }

    if (phase === "done") {
      resetTimerState();

      setTimeout(() => {
        setHasStartedSession(true);
        setCurrentRound(1);
        setPhase("prep");
        setRemainingTime(activePrepSeconds);
        setIsRunning(true);
        playTimerBeep(soundMode, "prep");
      }, 0);

      return;
    }

    if (!hasStartedSession) {
      setHasStartedSession(true);
      setCurrentRound(1);
      setPhase("prep");
      setRemainingTime(activePrepSeconds);
      setIsRunning(true);
      playTimerBeep(soundMode, "prep");
      return;
    }

    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    resetTimerState();
    clearCurriculumContext();
    clearTimerSession();
    clearTimerMediaSession();
    stopTimerAudioSession();
  };

  const handleEndCurriculum = () => {
    if (
      !window.confirm(
        "커리큘럼을 종료할까요? 이번 세션은 완료 처리되지 않습니다."
      )
    ) {
      return;
    }

    setIsRunning(false);
    clearCurriculumContext();
    clearTimerSession();
    clearTimerMediaSession();
    stopTimerAudioSession();
    resetTimerState();
  };

  const handleTotalRoundsChange = (value) => {
    const number = Number(value);

    if (!number || number < 1) return;

    setSelectedPresetId("custom");
    clearCurriculumContext();
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
    clearCurriculumContext();
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
    if (phase === "cooldown") return "마무리 시간";
    return "운동 완료";
  };

  const getPhaseBadgeStyle = () => {
    if (phase === "prep") return styles.prepBadge;
    if (phase === "work") return styles.workBadge;
    if (phase === "rest") return styles.restBadge;
    if (phase === "cooldown") return styles.prepBadge;
    return styles.doneBadge;
  };

  const getCurrentRoundName = () => {
    if (phase === "prep") {
      return `${formatTimerDurationLabel(activePrepSeconds)} 준비 후 1라운드 시작`;
    }
    if (phase === "cooldown") return "쿨다운 · 스트레칭";
    if (phase === "done") return "훈련 완료";

    if (curriculumRoutineTitle) {
      return `${curriculumRoutineTitle} · ${currentRound}라운드`;
    }

    if (selectedPreset) {
      return isIntervalMode
        ? `인터벌 · ${currentRound}세트`
        : `${selectedPreset.title} · ${currentRound}라운드`;
    }

    return `직접 설정 루틴 · ${currentRound}라운드`;
  };

  const handleGoProfile = () => {
    if (onGoProfile) {
      onGoProfile(completedLogId);
      return;
    }

    if (onGoHome) {
      onGoHome();
    }
  };

  const isComplete = phase === "done";
  const isFocusMode = hasStartedSession && !isComplete;
  const isSetupMode = !hasStartedSession && !isComplete;

  function handleTimerSurfaceTap() {
    if (!isFocusMode) return;

    const now = Date.now();

    if (now - lastTapRef.current < 350) {
      if (isRunning) {
        handlePause();
      } else {
        handleStart();
      }
    }

    lastTapRef.current = now;
  }

  function handleFocusStop() {
    const ok = window.confirm("훈련을 종료하고 타이머를 초기화할까요?");
    if (!ok) return;

    handleReset();
  }

  const timerCardStyle = {
    ...styles.timerCard,
    ...(isFocusMode ? { marginBottom: 0 } : {}),
  };

  const timeTextStyle = {
    ...styles.timeText,
    ...(isFocusMode ? { fontSize: "clamp(72px, 22vw, 96px)", margin: "20px 0 12px" } : {}),
  };

  return (
    <div
      className={`timer-page${isSetupMode ? " timer-page-setup" : ""}${
        isFocusMode ? " timer-page-focus" : ""
      }${isComplete ? " timer-page-complete" : ""}`}
      style={styles.page}
    >
      {isSetupMode ? (
        <section className="timer-setup-hero">
          <p className="timer-setup-kicker">TIMER</p>
          <h1 className="timer-setup-title">타이머</h1>
          <p className="timer-setup-subtitle">
            프리셋을 고르고 바로 시작하세요. 완료 시 EXP가 자동 기록됩니다.
          </p>

          <details className="timer-sound-details">
            <summary>
              알림음 ·{" "}
              {SOUND_OPTIONS.find((option) => option.id === soundMode)?.label}
            </summary>
            <div className="timer-sound-details-body" style={styles.soundBox}>
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
                    onClick={() => {
                      setSoundMode(option.id);
                      if (option.id === "mute") {
                        stopTimerAudioSession();
                        return;
                      }
                      previewTimerBeep(option.id);
                    }}
                  >
                    <strong style={styles.soundOptionLabel}>{option.label}</strong>
                    <span style={styles.soundOptionDescription}>
                      {option.description}
                    </span>
                  </button>
                ))}
              </div>

              {supportsHeadphoneTimerAudio() ? (
                <div style={styles.headsetTip}>
                  <strong style={styles.headsetTipTitle}>
                    에어팟 · 블루투스 이어폰
                  </strong>
                  <span style={styles.headsetTipCopy}>
                    시작 후 이어폰으로 라운드 알림음이 재생됩니다.
                  </span>
                </div>
              ) : null}
            </div>
          </details>
        </section>
      ) : null}

      {isSetupMode ? (
        <div className="timer-setup-config">
          <section className="timer-setup-panel">
            <div className="timer-setup-panel-head">
              <h2>훈련 선택</h2>
              <span>{isIntervalMode ? "인터벌" : "라운드"}</span>
            </div>

            <div className="timer-preset-grid">
              {SETUP_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`timer-preset-chip${
                    selectedPresetId === preset.id ? " is-active" : ""
                  }`}
                  onClick={() => applyPreset(preset)}
                  disabled={isRunning}
                >
                  <strong>{preset.title}</strong>
                  <small>
                    {preset.id === INTERVAL_TIMER_PRESET.id
                      ? "30/15초"
                      : "3분/30초"}
                  </small>
                </button>
              ))}
            </div>

            <p className="timer-setup-summary">{setupSummary}</p>

            <div className="timer-setup-preview-time" aria-hidden="true">
              {formatTime(workSecondsSetting)}
            </div>

            <div className="timer-setup-adjust">
              <label className="timer-setup-field">
                <span>{isIntervalMode ? "세트" : "라운드"}</span>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={totalRounds}
                  onChange={(event) => handleTotalRoundsChange(event.target.value)}
                  disabled={isRunning}
                />
              </label>

              <div className="timer-setup-field-group">
                <div className="timer-setup-field-head">
                  <span>운동</span>
                  <strong>{formatTime(workSecondsSetting)}</strong>
                </div>
                <div className="timer-setup-step-row">
                  <button
                    type="button"
                    onClick={() => handleWorkSecondsChange(-10)}
                    disabled={isRunning}
                  >
                    -10
                  </button>
                  <button
                    type="button"
                    onClick={() => handleWorkSecondsChange(10)}
                    disabled={isRunning}
                  >
                    +10
                  </button>
                </div>
              </div>

              <div className="timer-setup-field-group">
                <div className="timer-setup-field-head">
                  <span>휴식</span>
                  <strong>{formatTime(restSecondsSetting)}</strong>
                </div>
                <div className="timer-setup-quick-row">
                  {[15, 30, 45, 60].map((seconds) => (
                    <button
                      key={seconds}
                      type="button"
                      className={
                        restSecondsSetting === seconds ? "is-active" : undefined
                      }
                      onClick={() => handleRestQuickSelect(seconds)}
                      disabled={isRunning}
                    >
                      {seconds}초
                    </button>
                  ))}
                </div>
                <div className="timer-setup-step-row">
                  <button
                    type="button"
                    onClick={() => handleRestSecondsChange(-5)}
                    disabled={isRunning}
                  >
                    -5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRestSecondsChange(5)}
                    disabled={isRunning}
                  >
                    +5
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="timer-setup-start"
              onClick={handleStart}
              disabled={isRunning}
            >
              시작
            </button>
          </section>
        </div>
      ) : null}

      {!isSetupMode ? (
      <section
        className={isFocusMode ? "timer-focus-card" : ""}
        style={timerCardStyle}
        onClick={isFocusMode ? handleTimerSurfaceTap : undefined}
      >
        {isFocusMode ? (
          <p className="timer-focus-hint">더블 탭 · 일시정지 / 재개</p>
        ) : null}

        <div style={styles.timerTopRow}>
          <span style={{ ...styles.phaseBadge, ...getPhaseBadgeStyle() }}>
            {getPhaseText()}
          </span>

          <span
            className={isFocusMode ? "timer-focus-round" : ""}
            style={styles.roundText}
          >
            {phase === "done" ? "완료" : isIntervalMode ? `${currentRound} / ${totalRounds} 세트` : `${currentRound} / ${totalRounds} R`}
          </span>
        </div>

        {phase !== "done" && (
          <div
            className={isFocusMode ? "timer-focus-name" : ""}
            style={styles.currentRoundName}
          >
            {getCurrentRoundName()}
          </div>
        )}

        {phase !== "done" ? (
          <div className={isFocusMode ? "timer-focus-time" : ""} style={timeTextStyle}>
            {formatTime(remainingTime)}
          </div>
        ) : null}

        {curriculumDrills.length > 0 && phase !== "done" ? (
          <CurriculumTimerPanel
            sessionTitle={curriculumSessionTitle}
            sessionGoal={curriculumGoal}
            sessionCode={curriculumSessionCode}
            weekLabel={curriculumWeekLabel}
            weekTheme={curriculumWeekTheme}
            phase={phase}
            currentRound={currentRound}
            totalRounds={totalRounds}
            focus={curriculumFocus}
            drills={curriculumDrills}
            onEndCurriculum={handleEndCurriculum}
          />
        ) : null}

        {!isFocusMode && !isComplete ? (
        <div style={styles.sessionInfoGrid}>
          <div style={styles.sessionInfoBox}>
            <span style={styles.sessionInfoLabel}>
              {isIntervalMode ? "세트" : "라운드"}
            </span>
            <strong style={styles.sessionInfoValue}>
              {isIntervalMode ? `${totalRounds}세트` : `${totalRounds}R`}
            </strong>
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
        ) : null}

        {phase === "done" && (
          <div className="timer-complete-hero">
            <p className="timer-complete-kicker">WORKOUT COMPLETE</p>
            <h2 className="timer-complete-title">오늘도 끝까지 버텼다</h2>

            {completionResult ? (
              <>
                <div className="timer-complete-statline">
                  <strong>{isIntervalMode ? `${totalRounds}세트` : `${totalRounds}R`}</strong>
                  <span>·</span>
                  <em>+{completionResult.gainedExp} EXP</em>
                </div>

                <p className="timer-complete-sub">
                  이번 주 {completionResult.weeklyRounds}R
                  {completionResult.weeklyRoundsAdded > 0
                    ? ` · +${completionResult.weeklyRoundsAdded}R`
                    : ""}{" "}
                  · {totalWorkMinutes}분
                </p>

                {completionResult.didLevelUp ? (
                  <div className="timer-complete-levelup">LEVEL UP</div>
                ) : null}

                <div className="timer-complete-level">
                  <div className="timer-complete-level-head">
                    <strong>{completionResult.levelLabel}</strong>
                    <span>
                      {completionResult.isMaxLevel
                        ? "MAX LEVEL"
                        : `${completionResult.currentLevelExp} / ${completionResult.nextLevelExp} EXP`}
                    </span>
                  </div>
                  <div className="timer-complete-level-track" aria-hidden="true">
                    <div
                      style={{ width: `${completionResult.progressPercent}%` }}
                    />
                  </div>
                </div>

                {completionResult.didLevelUp && completionResult.newTitle ? (
                  <div className="timer-complete-unlock">
                    <span>NEW TITLE</span>
                    <strong>{completionResult.newTitle.ko}</strong>
                    <small>{completionResult.newTitle.en}</small>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="timer-complete-sub">운동 기록에 자동 저장됐습니다.</p>
            )}

            <button
              type="button"
              className="timer-complete-card-cta"
              onClick={handleGoProfile}
            >
              인증 카드 만들기
            </button>

            <div className="timer-complete-links">
              <button type="button" onClick={() => onGoHome?.()}>
                홈으로
              </button>
              <button type="button" onClick={() => onGoLog?.()}>
                기록 보기
              </button>
            </div>
          </div>
        )}

        {isFocusMode ? (
          <div className="timer-focus-controls">
            <button
              type="button"
              className="timer-focus-pause"
              onClick={(event) => {
                event.stopPropagation();
                if (isRunning) {
                  handlePause();
                } else {
                  handleStart();
                }
              }}
            >
              {isRunning ? "일시정지" : "계속"}
            </button>
            <button
              type="button"
              className="timer-focus-stop"
              onClick={(event) => {
                event.stopPropagation();
                handleFocusStop();
              }}
            >
              종료
            </button>
          </div>
        ) : (
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
        )}
      </section>
      ) : null}
    </div>
  );
}


