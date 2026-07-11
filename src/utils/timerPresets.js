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
    logType: `${preset.title} 라운드 훈련`,
  };
}
