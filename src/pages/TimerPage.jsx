import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import { useTraining } from "../store/TrainingContext";
import {
  getCompletionDelta,
  getTotalMinutesFromLogs,
  getTotalRoundsFromLogs,
} from "../utils/fighterProgress";
import { getTrainingStreak } from "./profilePage/profileCardUtils";
import {
  buildStrengthDayLaunch,
  getStrengthDay,
} from "../utils/strengthProgram";
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
import StrengthTimerGuide from "../components/StrengthTimerGuide";
import ComposerShell, {
  ComposerDockPrimary,
  ComposerSegmentTabs,
} from "../components/ComposerShell";
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
  onRelaunch,
  onGoLog,
  onGoHome,
  onGoBack,
  backLabel = "링",
  onGoProfile,
}) {
  const { addLog, logs, profile } = useTraining();
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
  const [strengthDayId, setStrengthDayId] = useState(
    initialTimerState.strengthDayId || null
  );
  const [canSkipStrengthWarmup, setCanSkipStrengthWarmup] = useState(
    Boolean(initialTimerState.canSkipStrengthWarmup)
  );
  const [strengthPlan, setStrengthPlan] = useState(
    initialTimerState.strengthPlan || null
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
  const [roundsDraft, setRoundsDraft] = useState(
    String(initialTimerState.totalRounds)
  );
  const roundsInputFocusedRef = useRef(false);
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
  const [completedAt, setCompletedAt] = useState(null);
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
    setStrengthDayId(saved.strengthDayId || null);
    setCanSkipStrengthWarmup(Boolean(saved.canSkipStrengthWarmup));
    setStrengthPlan(saved.strengthPlan || null);
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

  useEffect(() => {
    // 입력 중에 totalRounds가 바뀌면 빈 칸/작성 중이던 값이 도로 덮인다.
    if (roundsInputFocusedRef.current) return;
    setRoundsDraft(String(totalRounds));
  }, [totalRounds]);

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
    setStrengthDayId(null);
    setCanSkipStrengthWarmup(false);
    setStrengthPlan(null);
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
      strengthDayId,
      canSkipStrengthWarmup,
      strengthPlan,
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
    strengthDayId,
    canSkipStrengthWarmup,
    strengthPlan,
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
          strengthDayId,
          canSkipStrengthWarmup,
          strengthPlan,
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
    strengthDayId,
    canSkipStrengthWarmup,
    strengthPlan,
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
        ? `${routineTitle} 완료. 기술 코스 한 세션 더 버텼다.`
        : `${totalRounds}R 완료. 오늘도 끝까지 버텼다.`,
    });

    if (curriculumSessionId) {
      markCurriculumSessionComplete(curriculumSessionId);
    }

    setCompletionResult(getCompletionDelta(logs, savedLog));
    setCompletedLogId(savedLog.id);
    setCompletedAt(new Date());
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
    setCompletedAt(null);
    savedLogRef.current = false;
  };

  function getCompletedRoundsSoFar() {
    if (!hasStartedSession) return 0;
    if (phase === "prep") return 0;
    if (phase === "work") return Math.max(0, currentRound - 1);
    if (phase === "rest") return currentRound;
    if (phase === "cooldown" || phase === "done") return totalRounds;
    return 0;
  }

  function savePartialSession(completedRounds) {
    if (savedLogRef.current || hasSavedLog) return null;

    const safeRounds = Math.max(1, Math.min(completedRounds, totalRounds));
    const minutesPerRound = Math.max(1, Math.round(workSecondsSetting / 60));
    const minutes = safeRounds * minutesPerRound;

    savedLogRef.current = true;

    const savedLog = addLog({
      type: curriculumLogType || `${safeRounds}R 라운드 훈련`,
      minutes,
      duration: minutes,
      rounds: safeRounds,
      totalRounds: safeRounds,
      completedRounds: safeRounds,
      difficulty: "normal",
      source: "timer",
      memo: `${routineTitle} · ${safeRounds}/${totalRounds}라운드 기록 / 운동 ${formatDurationLabel(
        workSecondsSetting
      )} / 휴식 ${formatDurationLabel(restSecondsSetting)}`,
      publicComment: curriculumSessionId
        ? `${routineTitle} · ${safeRounds}라운드까지 기록했다.`
        : `${safeRounds}R 기록. 오늘은 여기까지 벨을 울렸다.`,
    });

    setCompletionResult(getCompletionDelta(logs, savedLog));
    setCompletedLogId(savedLog.id);
    setCompletedAt(new Date());
    setHasSavedLog(true);
    return savedLog;
  }

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
    setStrengthDayId(config.strengthDayId || null);
    setCanSkipStrengthWarmup(Boolean(config.canSkipStrengthWarmup));
    setStrengthPlan(config.strengthPlan || null);
    setPrepSecondsSetting(config.prepSeconds ?? 10);
    setCooldownSecondsSetting(config.cooldownSeconds ?? 0);
    resetTimerState(config.workSeconds);
  };

  function handleSkipStrengthWarmup() {
    if (!strengthDayId || !canSkipStrengthWarmup) return;
    const day = getStrengthDay(strengthDayId);
    const next = buildStrengthDayLaunch(day, { skipWarmup: true });
    if (onRelaunch) {
      onRelaunch(next);
      return;
    }
    applyLaunchConfig(next);
  }

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
    const completedRounds = getCompletedRoundsSoFar();

    if (hasStartedSession && phase !== "done" && completedRounds >= 1) {
      const ok = window.confirm(
        `지금까지 ${completedRounds}라운드를 기록하고 초기화할까요?`
      );
      if (!ok) return;

      setIsRunning(false);
      savePartialSession(completedRounds);
      setPhase("done");
      clearTimerMediaSession();
      stopTimerAudioSession();
      return;
    }

    if (hasStartedSession && phase !== "done") {
      const ok = window.confirm(
        "아직 완료한 라운드가 없어요. 타이머를 초기화할까요?"
      );
      if (!ok) return;
    }

    resetTimerState();
    clearCurriculumContext();
    clearTimerSession();
    clearTimerMediaSession();
    stopTimerAudioSession();
  };

  const handleEndCurriculum = () => {
    const completedRounds = getCompletedRoundsSoFar();
    const endLabel = strengthPlan ? "신체" : "기술";

    if (completedRounds >= 1) {
      const ok = window.confirm(
        `지금까지 ${completedRounds}라운드를 기록하고 ${endLabel}을 종료할까요?`
      );
      if (!ok) return;

      setIsRunning(false);
      savePartialSession(completedRounds);
      setPhase("done");
      clearTimerMediaSession();
      stopTimerAudioSession();
      return;
    }

    if (
      !window.confirm(
        `아직 완료한 라운드가 없어요. ${endLabel}을 종료할까요?`
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

  const commitTotalRounds = (rawValue) => {
    const number = Math.min(20, Math.max(1, Number(rawValue) || 1));
    setRoundsDraft(String(number));

    if (number === totalRounds) return;

    setSelectedPresetId("custom");
    clearCurriculumContext();
    setTotalRounds(number);
    resetTimerState(workSecondsSetting);
  };

  const handleTotalRoundsChange = (value) => {
    // 숫자만 허용하되, 전부 지운 빈 문자열은 입력 중에 유지한다.
    const digitsOnly = String(value ?? "").replace(/\D/g, "");

    if (digitsOnly === "") {
      setRoundsDraft("");
      return;
    }

    setRoundsDraft(digitsOnly);

    const number = Number(digitsOnly);
    if (!Number.isFinite(number) || number < 1) return;

    const clamped = Math.min(20, number);
    setSelectedPresetId("custom");
    clearCurriculumContext();
    setTotalRounds(clamped);
    if (clamped !== number) {
      setRoundsDraft(String(clamped));
    }
    resetTimerState(workSecondsSetting);
  };

  const handleTotalRoundsFocus = () => {
    roundsInputFocusedRef.current = true;
  };

  const handleTotalRoundsBlur = () => {
    roundsInputFocusedRef.current = false;
    commitTotalRounds(roundsDraft);
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

  const completedMoment = completedAt || new Date();
  const completedDateLabel = `${completedMoment.getFullYear()}.${String(
    completedMoment.getMonth() + 1
  ).padStart(2, "0")}.${String(completedMoment.getDate()).padStart(2, "0")}`;
  const completedTimeLabel = `${String(completedMoment.getHours()).padStart(
    2,
    "0"
  )}:${String(completedMoment.getMinutes()).padStart(2, "0")}`;

  const stillCountLabel = isIntervalMode
    ? `${totalRounds}세트`
    : `${totalRounds}R`;
  const cumulativeRounds =
    completionResult?.totalRounds ?? getTotalRoundsFromLogs(logs);
  const cumulativeMinutes = getTotalMinutesFromLogs(logs);
  const cumulativeTimeLabel =
    cumulativeMinutes >= 60
      ? `${Math.floor(cumulativeMinutes / 60)}시간`
      : `${cumulativeMinutes}분`;
  const stillPlace = (profile?.area || "").trim();
  const trainingStreak = getTrainingStreak(logs);

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
    const completedRounds = getCompletedRoundsSoFar();

    if (completedRounds >= 1) {
      const ok = window.confirm(
        `지금까지 ${completedRounds}라운드를 기록하고 종료할까요?`
      );
      if (!ok) return;

      setIsRunning(false);
      savePartialSession(completedRounds);
      setPhase("done");
      clearTimerMediaSession();
      stopTimerAudioSession();
      return;
    }

    const ok = window.confirm(
      "아직 완료한 라운드가 없어요. 훈련을 종료할까요?"
    );
    if (!ok) return;

    resetTimerState();
    clearCurriculumContext();
    clearTimerSession();
    clearTimerMediaSession();
    stopTimerAudioSession();
  }

  function handleLeaveTimer() {
    if (!onGoBack) return;

    if (isComplete || !hasStartedSession) {
      onGoBack();
      return;
    }

    const completedRounds = getCompletedRoundsSoFar();

    if (completedRounds >= 1) {
      const ok = window.confirm(
        `지금까지 ${completedRounds}라운드를 기록하고 나갈까요?`
      );
      if (!ok) return;

      setIsRunning(false);
      savePartialSession(completedRounds);
      clearTimerMediaSession();
      stopTimerAudioSession();
      clearTimerSession();
      onGoBack();
      return;
    }

    const ok = window.confirm(
      "아직 완료한 라운드가 없어요. 타이머에서 나갈까요?"
    );
    if (!ok) return;

    resetTimerState();
    clearCurriculumContext();
    clearTimerSession();
    clearTimerMediaSession();
    stopTimerAudioSession();
    onGoBack();
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
      style={isSetupMode ? undefined : styles.page}
    >
      {isSetupMode ? (
        <ComposerShell
          className="timer-composer"
          kicker="TIMER"
          title="라운드"
          back={
            onGoBack ? (
              <button
                type="button"
                className="composer-shell-back"
                onClick={onGoBack}
              >
                ← {backLabel}
              </button>
            ) : null
          }
          summary={
            <>
              <span className="composer-meta-label">
                {isIntervalMode ? "인터벌" : "라운드"}
              </span>
              <strong>{setupSummary}</strong>
              <p className="timer-composer-preview">{formatTime(workSecondsSetting)}</p>
            </>
          }
          segments={
            <ComposerSegmentTabs
              tabs={SETUP_PRESETS.map((preset) => ({
                id: preset.id,
                label: preset.title,
              }))}
              activeId={selectedPresetId}
              onChange={(presetId) => {
                const preset = SETUP_PRESETS.find((item) => item.id === presetId);
                if (preset) applyPreset(preset);
              }}
              ariaLabel="타이머 프리셋"
            />
          }
          dock={
            <ComposerDockPrimary
              label="시작"
              onClick={handleStart}
              disabled={isRunning}
            />
          }
        >
          <section className="timer-setup-panel timer-setup-panel-plain">
            <div className="timer-setup-adjust">
              <label className="timer-setup-field">
                <span>{isIntervalMode ? "세트" : "라운드"}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  enterKeyHint="done"
                  value={roundsDraft}
                  onFocus={handleTotalRoundsFocus}
                  onChange={(event) => handleTotalRoundsChange(event.target.value)}
                  onBlur={handleTotalRoundsBlur}
                  disabled={isRunning}
                  aria-label={isIntervalMode ? "세트 수" : "라운드 수"}
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
                      <strong style={styles.soundOptionLabel}>
                        {option.label}
                      </strong>
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

          {strengthPlan ? (
            <>
              {canSkipStrengthWarmup && strengthDayId ? (
                <button
                  type="button"
                  className="timer-skip-warmup"
                  onClick={handleSkipStrengthWarmup}
                >
                  줄넘기 제외하기
                </button>
              ) : null}
              <StrengthTimerGuide
                plan={strengthPlan}
                phase={phase}
                currentRound={currentRound}
              />
            </>
          ) : null}
        </ComposerShell>
      ) : null}

      {!isSetupMode ? (
      <>
      {onGoBack ? (
        <div className="timer-running-bar">
          <button
            type="button"
            className="timer-back-button"
            onClick={handleLeaveTimer}
          >
            ← 뒤로
          </button>
        </div>
      ) : null}
      <section
        className={
          isFocusMode
            ? "timer-focus-card"
            : isComplete
              ? "timer-complete-card"
              : ""
        }
        style={timerCardStyle}
        onClick={isFocusMode ? handleTimerSurfaceTap : undefined}
      >
        {isFocusMode ? (
          <p className="timer-focus-hint">더블 탭 · 일시정지 / 재개</p>
        ) : null}

        {!isComplete ? (
          <div style={styles.timerTopRow}>
            <span style={{ ...styles.phaseBadge, ...getPhaseBadgeStyle() }}>
              {getPhaseText()}
            </span>

            <span
              className={isFocusMode ? "timer-focus-round" : ""}
              style={styles.roundText}
            >
              {isIntervalMode
                ? `${currentRound} / ${totalRounds} 세트`
                : `${currentRound} / ${totalRounds} R`}
            </span>
          </div>
        ) : null}

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

        {strengthPlan && phase !== "done" ? (
          <StrengthTimerGuide
            plan={strengthPlan}
            phase={phase}
            currentRound={currentRound}
            onEnd={handleEndCurriculum}
          />
        ) : curriculumDrills.length > 0 && phase !== "done" ? (
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
          <div className="timer-still">
            <p className="timer-still-kicker">ROUND COMPLETE</p>

            <div className="timer-still-headline">
              <span className="timer-still-rounds">{stillCountLabel}</span>
              <span className="timer-still-duration">
                {formatTime(totalWorkSeconds)}
              </span>
            </div>

            <div className="timer-still-meta">
              <span>{completedDateLabel}</span>
              <span className="timer-still-meta-dot" aria-hidden="true">
                ·
              </span>
              <span>{completedTimeLabel}</span>
              {stillPlace ? (
                <span className="timer-still-place">{stillPlace}.</span>
              ) : null}
            </div>

            {trainingStreak >= 2 ? (
              <p className="timer-still-streak">{trainingStreak}일 연속</p>
            ) : null}

            <p className="timer-still-slogan">오늘도 벨은 울렸다.</p>

            <div className="timer-still-trace">
              <strong className="timer-still-bell">
                {cumulativeRounds}번째 벨.
              </strong>
              <span className="timer-still-hours">
                링 위에서 {cumulativeTimeLabel}
              </span>
            </div>

            {completionResult?.didLevelUp && completionResult.newTitle ? (
              <p className="timer-still-chapter">
                새 이름 · {completionResult.newTitle.ko}
              </p>
            ) : null}

            <button
              type="button"
              className="timer-complete-card-cta"
              onClick={handleGoProfile}
            >
              인증 카드 만들기
            </button>

            <div className="timer-complete-links">
              <button type="button" onClick={handleStart}>
                다시 시작
              </button>
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
        ) : isComplete ? null : (
        <div style={styles.buttonRow}>
          {!isRunning ? (
            <button type="button" style={styles.startButton} onClick={handleStart}>
              {hasStartedSession ? "계속" : "시작"}
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
      </>
      ) : null}
    </div>
  );
}


