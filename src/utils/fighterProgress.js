import {
  buildWeeklyReport,
  calculateLogScore,
  getLogMinutes,
  getLogRounds,
} from "./trainingStats";

export const EXP_PER_LEVEL = 100;

export function getLogExp(log) {
  const savedScore = Number(log?.score);

  if (Number.isFinite(savedScore) && savedScore > 0) {
    return savedScore;
  }

  return calculateLogScore(log);
}

export function getTotalExp(logs = []) {
  return logs.reduce((sum, log) => sum + getLogExp(log), 0);
}

export function getTotalRoundsFromLogs(logs = []) {
  return logs.reduce((sum, log) => sum + getLogRounds(log), 0);
}

export function getTotalMinutesFromLogs(logs = []) {
  return logs.reduce((sum, log) => sum + getLogMinutes(log), 0);
}

export function getFighterLevel(totalExp) {
  return Math.floor(Number(totalExp || 0) / EXP_PER_LEVEL) + 1;
}

export function getFighterTitle(level) {
  if (level >= 20) return "CHAMPION FIGHTER";
  if (level >= 12) return "ELITE FIGHTER";
  if (level >= 7) return "CONTENDER";
  if (level >= 3) return "AMATEUR FIGHTER";
  return "ROOKIE FIGHTER";
}

export function getLevelProgress(totalExp) {
  const safeExp = Math.max(0, Number(totalExp || 0));
  const currentLevelExp = safeExp % EXP_PER_LEVEL;
  const xpToNextLevel =
    currentLevelExp === 0 && safeExp > 0
      ? EXP_PER_LEVEL
      : EXP_PER_LEVEL - currentLevelExp;

  return {
    level: getFighterLevel(safeExp),
    currentLevelExp,
    xpToNextLevel,
    progressPercent: Math.min(
      100,
      Math.round((currentLevelExp / EXP_PER_LEVEL) * 100) || 0
    ),
  };
}

export function getFighterProgress(logs = []) {
  const safeLogs = Array.isArray(logs) ? logs : [];
  const totalExp = getTotalExp(safeLogs);
  const totalRounds = getTotalRoundsFromLogs(safeLogs);
  const totalMinutes = getTotalMinutesFromLogs(safeLogs);
  const totalLogs = safeLogs.length;
  const levelProgress = getLevelProgress(totalExp);
  const weekly = buildWeeklyReport(safeLogs);

  return {
    ...levelProgress,
    totalExp,
    totalRounds,
    totalMinutes,
    totalLogs,
    weeklyRounds: weekly.totalRounds,
    weeklyExp: weekly.totalScore,
    levelLabel: `LV. ${levelProgress.level}`,
    fighterTitle: getFighterTitle(levelProgress.level),
    nextLevelExp: EXP_PER_LEVEL,
  };
}

export function getCompletionDelta(logsBefore = [], newLog) {
  const expBefore = getTotalExp(logsBefore);
  const weeklyBefore = buildWeeklyReport(logsBefore).totalRounds;
  const logsAfter = [...logsBefore, newLog];
  const expAfter = getTotalExp(logsAfter);
  const weeklyAfter = buildWeeklyReport(logsAfter).totalRounds;
  const levelBefore = getLevelProgress(expBefore);
  const levelAfter = getLevelProgress(expAfter);

  return {
    gainedExp: getLogExp(newLog),
    gainedRounds: getLogRounds(newLog),
    weeklyRounds: weeklyAfter,
    weeklyRoundsAdded: weeklyAfter - weeklyBefore,
    totalExp: expAfter,
    totalRounds: getTotalRoundsFromLogs(logsAfter),
    previousLevel: levelBefore.level,
    currentLevel: levelAfter.level,
    currentLevelExp: levelAfter.currentLevelExp,
    expToNextLevel: levelAfter.xpToNextLevel,
    progressPercent: levelAfter.progressPercent,
    didLevelUp: levelAfter.level > levelBefore.level,
    levelLabel: `LV. ${levelAfter.level}`,
  };
}
