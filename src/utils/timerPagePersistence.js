import {
  loadTimerSession,
  reconcileTimerSession,
} from "./timerSession";

export const TIMER_DEFAULT_STATE = {
  selectedPresetId: "match3",
  curriculumSessionId: null,
  curriculumRoutineTitle: "",
  curriculumLogType: "",
  curriculumSessionTitle: "",
  curriculumGoal: "",
  curriculumSessionCode: "",
  curriculumWeekLabel: "",
  curriculumWeekTheme: "",
  curriculumDrills: [],
  prepSecondsSetting: 10,
  cooldownSecondsSetting: 0,
  totalRounds: 3,
  workSecondsSetting: 180,
  restSecondsSetting: 30,
  currentRound: 1,
  phase: "work",
  remainingTime: 180,
  isRunning: false,
  hasStartedSession: false,
  hasSavedLog: false,
  soundMode: "basic",
};

export function readInitialTimerState() {
  const saved = reconcileTimerSession(loadTimerSession());

  if (!saved) {
    return { ...TIMER_DEFAULT_STATE };
  }

  return {
    ...TIMER_DEFAULT_STATE,
    ...saved,
    curriculumDrills: Array.isArray(saved.curriculumDrills)
      ? saved.curriculumDrills
      : [],
  };
}

export function buildTimerSnapshot(state) {
  return {
    selectedPresetId: state.selectedPresetId,
    curriculumSessionId: state.curriculumSessionId,
    curriculumRoutineTitle: state.curriculumRoutineTitle,
    curriculumLogType: state.curriculumLogType,
    curriculumSessionTitle: state.curriculumSessionTitle,
    curriculumGoal: state.curriculumGoal,
    curriculumSessionCode: state.curriculumSessionCode,
    curriculumWeekLabel: state.curriculumWeekLabel,
    curriculumWeekTheme: state.curriculumWeekTheme,
    curriculumDrills: state.curriculumDrills,
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
    updatedAt: Date.now(),
  };
}
