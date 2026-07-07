import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTraining } from "../store/TrainingContext";
import { getCompletionDelta } from "../utils/fighterProgress";
import {
  SPARRING_UNLOCK_LEVEL,
  isSparringUnlocked,
} from "../utils/featureUnlocks";
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
import {
  CALLOUT_PACES,
  cancelCallout,
  getPaceSeconds,
  isCalloutSupported,
  loadCalloutPref,
  pickRandomCombo,
  primeCalloutVoices,
  saveCalloutPref,
  speakCombo,
  warmUpCallout,
} from "../utils/comboCallout";
import { styles } from "./TimerPage.styles";
import CurriculumTimerPanel from "../components/CurriculumTimerPanel";

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

  const selectedPreset = MATCH_PRESETS.find((preset) => {
    return preset.id === selectedPresetId;
  });

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
  const [soundMode, setSoundMode] = useState(initialTimerState.soundMode);
  const [calloutPref, setCalloutPref] = useState(() => loadCalloutPref());
  const calloutSupported = isCalloutSupported();

  const savedLogRef = useRef(initialTimerState.hasSavedLog);
  const previousPhaseRef = useRef(initialTimerState.phase);

  const workSeconds = workSecondsSetting;
  const restSeconds = restSecondsSetting;

  const totalWorkSeconds = totalRounds * workSecondsSetting;
  const totalSessionSeconds =
    totalWorkSeconds + Math.max(totalRounds - 1, 0) * restSecondsSetting;
  const totalWorkMinutes = Math.max(1, Math.round(totalWorkSeconds / 60));

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
    primeCalloutVoices();
    return () => cancelCallout();
  }, []);

  useEffect(() => {
    if (!calloutPref.enabled) return undefined;
    if (!calloutSupported) return undefined;
    if (!isRunning || phase !== "work") {
      cancelCallout();
      return undefined;
    }

    speakCombo(pickRandomCombo());

    const intervalMs = getPaceSeconds(calloutPref.pace) * 1000;
    const intervalId = setInterval(() => {
      speakCombo(pickRandomCombo());
    }, intervalMs);

    return () => {
      clearInterval(intervalId);
      cancelCallout();
    };
  }, [
    calloutPref.enabled,
    calloutPref.pace,
    calloutSupported,
    isRunning,
    phase,
    currentRound,
  ]);

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

  const updateCalloutPref = (patch) => {
    setCalloutPref((current) => {
      const next = { ...current, ...patch };
      saveCalloutPref(next);
      return next;
    });
  };

  const handleToggleCallout = (enabled) => {
    if (enabled) {
      warmUpCallout();
    } else {
      cancelCallout();
    }

    updateCalloutPref({ enabled });
  };

  const handleStart = async () => {
    if (soundMode !== "mute") {
      await startTimerAudioSession();
    }

    if (calloutPref.enabled && calloutSupported) {
      warmUpCallout();
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
    cancelCallout();
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
    cancelCallout();
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
    <div className="timer-page" style={styles.page}>
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
                타이머 시작 후 연결된 이어폰으로 라운드 알림음이 재생됩니다.
                화면을 끄거나 다른 앱으로 이동해도 들으려면 무음 모드를 해제하고
                시작 버튼을 눌러 주세요.
              </span>
            </div>
          ) : null}
        </div>

        {calloutSupported ? (
          <div style={styles.soundBox}>
            <div style={styles.soundHeaderRow}>
              <span style={styles.soundText}>콤보 음성 콜아웃</span>
              <strong style={styles.soundStatus}>
                {calloutPref.enabled ? "켜짐" : "꺼짐"}
              </strong>
            </div>

            <span style={styles.headsetTipCopy}>
              라운드 중 "잽, 크로스" 같은 콤보를 음성으로 불러줍니다. 뭘 쳐야
              할지 모를 때 따라 치기 좋아요.
            </span>

            <div style={styles.soundOptionGrid}>
              <button
                type="button"
                style={{
                  ...styles.soundOptionButton,
                  ...(!calloutPref.enabled
                    ? styles.activeSoundOptionButton
                    : {}),
                }}
                onClick={() => handleToggleCallout(false)}
              >
                <strong style={styles.soundOptionLabel}>끄기</strong>
                <span style={styles.soundOptionDescription}>
                  소리 안내 없음
                </span>
              </button>

              <button
                type="button"
                style={{
                  ...styles.soundOptionButton,
                  ...(calloutPref.enabled
                    ? styles.activeSoundOptionButton
                    : {}),
                }}
                onClick={() => handleToggleCallout(true)}
              >
                <strong style={styles.soundOptionLabel}>켜기</strong>
                <span style={styles.soundOptionDescription}>
                  콤보 음성 안내
                </span>
              </button>
            </div>

            {calloutPref.enabled ? (
              <div style={styles.quickButtonRow}>
                {CALLOUT_PACES.map((pace) => (
                  <button
                    key={pace.id}
                    type="button"
                    style={{
                      ...styles.quickSelectButton,
                      ...(calloutPref.pace === pace.id
                        ? styles.activeQuickSelectButton
                        : {}),
                    }}
                    onClick={() => updateCalloutPref({ pace: pace.id })}
                  >
                    {pace.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
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
            <div style={styles.completeTitle}>훈련 완료</div>

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
                    <span style={styles.growthResultLabel}>이번 주</span>
                    <strong style={styles.growthResultValue}>
                      {completionResult.weeklyRounds}R
                    </strong>
                    {completionResult.weeklyRoundsAdded > 0 ? (
                      <span style={styles.growthResultSub}>
                        +{completionResult.weeklyRoundsAdded}R
                      </span>
                    ) : null}
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
                    {completionResult.levelLabel}
                  </strong>
                  <span style={styles.levelProgressText}>
                    {completionResult.isMaxLevel
                      ? "MAX LEVEL"
                      : `${completionResult.currentLevelExp} / ${completionResult.nextLevelExp} EXP`}
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
                  {completionResult.isMaxLevel
                    ? "최대 레벨에 도달했습니다"
                    : `다음 레벨까지 ${completionResult.expToNextLevel} EXP`}
                </p>

                {completionResult.didLevelUp && completionResult.newTitle ? (
                  <div style={styles.unlockNotice}>
                    <span style={styles.unlockNoticeLabel}>
                      NEW TITLE · 새 칭호
                    </span>
                    <p style={styles.unlockNoticeTitle}>
                      {completionResult.newTitle.ko}
                    </p>
                    <p style={styles.unlockNoticeItem}>
                      {completionResult.newTitle.en}
                    </p>
                    <p style={styles.unlockNoticeFlavor}>
                      {completionResult.newTitle.flavor}
                    </p>
                    {completionResult.currentLevel === SPARRING_UNLOCK_LEVEL &&
                    isSparringUnlocked(completionResult.currentLevel) ? (
                      <p style={styles.unlockNoticeSub}>
                        스파링 상대찾기 이용 가능
                      </p>
                    ) : null}
                  </div>
                ) : null}
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
              <strong>
                {isCurriculumSession
                  ? formatTimerDurationLabel(activePrepSeconds)
                  : `${PREP_SECONDS}초`}
              </strong>
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


