/** 복싱 라운드(경기식) 기본 운동·휴식 — 새 세션·프리셋·fallback */
export const DEFAULT_BOXING_WORK_SECONDS = 180;
export const DEFAULT_BOXING_REST_SECONDS = 30;

export const INTERVAL_TIMER_PRESET = {
  id: "interval30",
  title: "인터벌",
  description: "30초 치고 15초 쉬기 · 짧은 폭발력 훈련",
  rounds: 12,
  workSeconds: 30,
  restSeconds: 15,
  logType: "인터벌 훈련",
};

export const MATCH_TIMER_PRESETS = [
  {
    id: "match3",
    title: "3R",
    description: "가볍게 실전 감각",
    rounds: 3,
    workSeconds: DEFAULT_BOXING_WORK_SECONDS,
    restSeconds: DEFAULT_BOXING_REST_SECONDS,
  },
  {
    id: "match6",
    title: "6R",
    description: "중간 강도",
    rounds: 6,
    workSeconds: DEFAULT_BOXING_WORK_SECONDS,
    restSeconds: DEFAULT_BOXING_REST_SECONDS,
  },
  {
    id: "match9",
    title: "9R",
    description: "길게 버티기",
    rounds: 9,
    workSeconds: DEFAULT_BOXING_WORK_SECONDS,
    restSeconds: DEFAULT_BOXING_REST_SECONDS,
  },
  {
    id: "match12",
    title: "12R",
    description: "챔피언 라운드",
    rounds: 12,
    workSeconds: DEFAULT_BOXING_WORK_SECONDS,
    restSeconds: DEFAULT_BOXING_REST_SECONDS,
  },
];

export function getTimerPresetById(id) {
  if (id === INTERVAL_TIMER_PRESET.id) {
    return INTERVAL_TIMER_PRESET;
  }

  return MATCH_TIMER_PRESETS.find((preset) => preset.id === id) || null;
}

export function isMatchTimerPresetId(id) {
  return MATCH_TIMER_PRESETS.some((preset) => preset.id === id);
}

export function buildPresetTimerLaunch(preset, { autoStart = false } = {}) {
  if (!preset) return null;

  const defaultTitle = preset.logType || `${preset.title} 라운드 훈련`;

  return {
    presetId: preset.id,
    rounds: preset.rounds,
    workSeconds: preset.workSeconds,
    restSeconds: preset.restSeconds,
    prepSeconds: 10,
    cooldownSeconds: 0,
    routineTitle: preset.routineTitle || defaultTitle,
    logType: preset.logType || defaultTitle,
    workoutDetails: preset.workoutDetails || "",
    autoStart,
  };
}
