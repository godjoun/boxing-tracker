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
    workSeconds: 180,
    restSeconds: 30,
  },
  {
    id: "match6",
    title: "6R",
    description: "중간 강도",
    rounds: 6,
    workSeconds: 180,
    restSeconds: 30,
  },
  {
    id: "match9",
    title: "9R",
    description: "길게 버티기",
    rounds: 9,
    workSeconds: 180,
    restSeconds: 30,
  },
];

export function getTimerPresetById(id) {
  if (id === INTERVAL_TIMER_PRESET.id) {
    return INTERVAL_TIMER_PRESET;
  }

  return MATCH_TIMER_PRESETS.find((preset) => preset.id === id) || null;
}

export function buildPresetTimerLaunch(preset) {
  if (!preset) return null;

  return {
    presetId: preset.id,
    rounds: preset.rounds,
    workSeconds: preset.workSeconds,
    restSeconds: preset.restSeconds,
    prepSeconds: 10,
    cooldownSeconds: 0,
    routineTitle: `${preset.title} 라운드 훈련`,
    logType: preset.logType || `${preset.title} 라운드 훈련`,
  };
}
