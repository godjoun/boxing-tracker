export const RUNNING_GOAL_PRESETS = [30, 45, 60];
export const RUNNING_GOAL_MIN = 5;
export const RUNNING_GOAL_MAX = 180;
export const RUNNING_GOAL_DEFAULT = 30;
export const RUNNING_GOAL_MIN_MESSAGE =
  "러닝은 최소 5분부터 설정할 수 있어요.";

function toWholeMinutes(value) {
  if (value === "" || value == null) return null;

  if (typeof value === "number") {
    if (!Number.isInteger(value)) return null;
    return value;
  }

  const text = String(value).trim();
  if (!/^\d+$/.test(text)) return null;

  const number = Number(text);
  if (!Number.isInteger(number)) return null;
  return number;
}

/**
 * Planned running minutes. Returns null when the value cannot start a session.
 * Integers above the existing max are clamped to RUNNING_GOAL_MAX.
 */
export function parseRunningGoalMinutes(value) {
  const minutes = toWholeMinutes(value);
  if (minutes == null) return null;
  if (minutes < RUNNING_GOAL_MIN) return null;
  if (minutes > RUNNING_GOAL_MAX) return RUNNING_GOAL_MAX;
  return minutes;
}

export function buildRunningLaunchConfig(minutes, workoutDetails = "") {
  return {
    id: `running-time-${minutes}`,
    title: "러닝",
    description: "시간 목표 러닝",
    rounds: 1,
    workSeconds: minutes * 60,
    restSeconds: 0,
    logType: "러닝",
    routineTitle: `러닝 · ${minutes}분`,
    workoutDetails,
  };
}
