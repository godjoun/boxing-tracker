export const RUNNING_LOG_TYPE = "러닝";

export function isRunningLogType(logType) {
  return logType === RUNNING_LOG_TYPE;
}

export function getCompletedRoundsSoFar({
  hasStartedSession,
  phase,
  currentRound,
  totalRounds,
} = {}) {
  if (!hasStartedSession) return 0;
  if (phase === "prep") return 0;
  if (phase === "work") return Math.max(0, currentRound - 1);
  if (phase === "rest") return currentRound;
  if (phase === "cooldown" || phase === "done") return totalRounds;
  return 0;
}

export function getRunningElapsedWorkSeconds({
  hasStartedSession,
  phase,
  remainingTime,
  workSecondsSetting,
} = {}) {
  if (!hasStartedSession) return 0;
  if (phase !== "work") return 0;

  const work = Number(workSecondsSetting);
  const remaining = Number(remainingTime);
  if (!Number.isFinite(work) || work <= 0) return 0;
  if (!Number.isFinite(remaining)) return 0;

  return Math.max(0, work - remaining);
}

export function getRunningPartialMinutes(elapsedSeconds) {
  const elapsed = Number(elapsedSeconds);
  if (!Number.isFinite(elapsed) || elapsed <= 0) return 0;
  return Math.max(0, Math.round(elapsed / 60));
}

/**
 * Early-end save plan from existing timer state.
 * Running uses elapsed work time. Boxing/style/4-week keep completed-round rules.
 */
export function getEarlyEndSavePlan(state = {}) {
  if (isRunningLogType(state.curriculumLogType)) {
    const elapsedSeconds = getRunningElapsedWorkSeconds(state);
    const minutes = getRunningPartialMinutes(elapsedSeconds);
    if (minutes < 1) return null;

    return {
      kind: "running",
      minutes,
      rounds: 1,
      elapsedSeconds,
    };
  }

  const completedRounds = getCompletedRoundsSoFar(state);
  if (completedRounds < 1) return null;

  return {
    kind: "rounds",
    completedRounds,
  };
}

export function canWriteTimerSessionLog({
  hasSavedLog = false,
  savedLogFlag = false,
} = {}) {
  return !hasSavedLog && !savedLogFlag;
}
