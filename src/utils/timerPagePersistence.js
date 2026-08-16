import {
  loadTimerSession,
  reconcileTimerSession,
} from "./timerSession";
import {
  DEFAULT_BOXING_REST_SECONDS,
  DEFAULT_BOXING_WORK_SECONDS,
  getTimerPresetById,
  isMatchTimerPresetId,
} from "./timerPresets";

export const TIMER_DEFAULT_STATE = {
  selectedPresetId: "match3",
  curriculumSessionId: null,
  styleId: null,
  styleCategoryId: null,
  curriculumRoutineTitle: "",
  curriculumLogType: "",
  curriculumSessionTitle: "",
  curriculumGoal: "",
  curriculumSessionCode: "",
  curriculumWeekLabel: "",
  curriculumWeekTheme: "",
  curriculumDrills: [],
  strengthDayId: null,
  canSkipStrengthWarmup: false,
  strengthPlan: null,
  prepSecondsSetting: 10,
  cooldownSecondsSetting: 0,
  totalRounds: 3,
  workSecondsSetting: DEFAULT_BOXING_WORK_SECONDS,
  restSecondsSetting: DEFAULT_BOXING_REST_SECONDS,
  currentRound: 1,
  phase: "work",
  remainingTime: DEFAULT_BOXING_WORK_SECONDS,
  isRunning: false,
  hasStartedSession: false,
  hasSavedLog: false,
  soundMode: "basic",
  workoutDetails: "",
  sessionStartedAt: null,
};

/**
 * 경기식 프리셋(match3 등)은 코드 기본값에 맞춘다.
 * selectedPresetId === "custom" 인 사용자 조절값은 덮어쓰지 않는다.
 * 진행 중 세션도 건드리지 않는다.
 */
function alignMatchPresetDurations(saved) {
  if (!saved || typeof saved !== "object") return saved;
  if (saved.isRunning || saved.hasStartedSession) return saved;
  if (!isMatchTimerPresetId(saved.selectedPresetId)) return saved;

  const preset = getTimerPresetById(saved.selectedPresetId);
  if (!preset) return saved;

  const nextWork = preset.workSeconds;
  const nextRest = preset.restSeconds;
  const aligned = {
    ...saved,
    workSecondsSetting: nextWork,
    restSecondsSetting: nextRest,
    totalRounds: preset.rounds,
  };

  if (
    saved.phase === "work" &&
    Number(saved.remainingTime) === Number(saved.workSecondsSetting)
  ) {
    aligned.remainingTime = nextWork;
  }

  return aligned;
}

export function readInitialTimerState() {
  const saved = reconcileTimerSession(loadTimerSession());

  if (!saved) {
    return { ...TIMER_DEFAULT_STATE };
  }

  const aligned = alignMatchPresetDurations(saved);

  return {
    ...TIMER_DEFAULT_STATE,
    ...aligned,
    curriculumDrills: Array.isArray(aligned.curriculumDrills)
      ? aligned.curriculumDrills
      : [],
    styleId: aligned.styleId || null,
    styleCategoryId: aligned.styleCategoryId || null,
    strengthDayId: aligned.strengthDayId || null,
    canSkipStrengthWarmup: Boolean(aligned.canSkipStrengthWarmup),
    strengthPlan: aligned.strengthPlan || null,
  };
}

export function buildTimerSnapshot(state, now = Date.now()) {
  return {
    selectedPresetId: state.selectedPresetId,
    curriculumSessionId: state.curriculumSessionId,
    styleId: state.styleId || null,
    styleCategoryId: state.styleCategoryId || null,
    curriculumRoutineTitle: state.curriculumRoutineTitle,
    curriculumLogType: state.curriculumLogType,
    curriculumSessionTitle: state.curriculumSessionTitle,
    curriculumGoal: state.curriculumGoal,
    curriculumSessionCode: state.curriculumSessionCode,
    curriculumWeekLabel: state.curriculumWeekLabel,
    curriculumWeekTheme: state.curriculumWeekTheme,
    curriculumDrills: state.curriculumDrills,
    strengthDayId: state.strengthDayId || null,
    canSkipStrengthWarmup: Boolean(state.canSkipStrengthWarmup),
    strengthPlan: state.strengthPlan || null,
    prepSecondsSetting: state.prepSecondsSetting,
    cooldownSecondsSetting: state.cooldownSecondsSetting,
    totalRounds: state.totalRounds,
    workSecondsSetting: state.workSecondsSetting,
    restSecondsSetting: state.restSecondsSetting,
    currentRound: state.currentRound,
    phase: state.phase,
    remainingTime: state.remainingTime,
    isRunning: state.isRunning,
    hasStartedSession: state.hasStartedSession,
    hasSavedLog: state.hasSavedLog,
    soundMode: state.soundMode,
    routineTitle: state.routineTitle,
    workoutDetails: state.workoutDetails || "",
    sessionStartedAt: state.sessionStartedAt || null,
    updatedAt: now,
  };
}

/**
 * Running 중 시간 권한은 syncFromClock 전용.
 * persist는 설정/메타만 갱신하고 remaining·updatedAt·phase·round는 storage 값을 유지한다.
 * 일시정지→재개 시에는 updatedAt을 now로 재설정한다.
 */
export function mergeRunningTimerPersistSnapshot(
  snapshot,
  loaded,
  now = Date.now()
) {
  if (!snapshot?.isRunning) {
    return snapshot;
  }

  if (loaded?.isRunning) {
    return {
      ...snapshot,
      remainingTime: loaded.remainingTime,
      updatedAt: loaded.updatedAt,
      phase: loaded.phase,
      currentRound: loaded.currentRound,
    };
  }

  return {
    ...snapshot,
    updatedAt: now,
  };
}

/** 준비 건너뛰기: work 세션을 원자적으로 구성한다. */
export function buildSkipPrepSession(state, now = Date.now()) {
  const workSeconds = Number(state.workSecondsSetting) || DEFAULT_BOXING_WORK_SECONDS;
  return buildTimerSnapshot(
    {
      ...state,
      phase: "work",
      remainingTime: workSeconds,
      currentRound: 1,
      isRunning: true,
      hasStartedSession: true,
    },
    now
  );
}
