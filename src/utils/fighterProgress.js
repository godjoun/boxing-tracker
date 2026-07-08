import {
  buildWeeklyReport,
  calculateLogScore,
  getLogMinutes,
  getLogRounds,
} from "./trainingStats";
import {
  getFighterTitleKo,
  getLevelTitle,
  getTitleAwardedAtLevel,
  isTitleMilestoneLevel,
  MAX_FIGHTER_LEVEL,
} from "./fighterTitles";

export { MAX_FIGHTER_LEVEL };

/** 10레벨 구간마다 필요 EXP가 배율만큼 증가 — 열심 훈련 기준 LV.100 약 3년 */
export const LEVEL_TIER_SIZE = 10;
export const LEVEL_TIER_MULTIPLIER = 1.54;
/** 구간 내 첫 레벨업(LV.1→2) 기본값 — 구간마다 2배 */
export const BASE_LEVEL_EXP = 20;
/** 같은 구간 안에서 레벨이 오를 때마다 +10 */
export const LEVEL_EXP_GROWTH = 10;

/** @deprecated Use getExpRequiredForNextLevel(level) */
export const EXP_PER_LEVEL = BASE_LEVEL_EXP;

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

export function getExpRequiredForNextLevel(level) {
  const safeLevel = Math.min(
    Math.max(1, Math.floor(Number(level) || 1)),
    MAX_FIGHTER_LEVEL - 1
  );

  const tier = Math.floor(safeLevel / LEVEL_TIER_SIZE);
  const stepInTier = (safeLevel - 1) % LEVEL_TIER_SIZE;
  const tierMultiplier = Math.pow(LEVEL_TIER_MULTIPLIER, tier);

  return Math.round(
    (BASE_LEVEL_EXP + stepInTier * LEVEL_EXP_GROWTH) * tierMultiplier
  );
}

export function getCumulativeExpForLevel(level) {
  const targetLevel = Math.min(
    Math.max(1, Math.floor(Number(level) || 1)),
    MAX_FIGHTER_LEVEL
  );

  if (targetLevel <= 1) {
    return 0;
  }

  let total = 0;

  for (let currentLevel = 1; currentLevel < targetLevel; currentLevel += 1) {
    total += getExpRequiredForNextLevel(currentLevel);
  }

  return total;
}

export function getFighterLevel(totalExp) {
  const safeExp = Math.max(0, Number(totalExp || 0));
  let level = 1;

  while (
    level < MAX_FIGHTER_LEVEL &&
    safeExp >= getCumulativeExpForLevel(level + 1)
  ) {
    level += 1;
  }

  return level;
}

export function getFighterTitle(level) {
  return getFighterTitleKo(level);
}

export function getLevelProgress(totalExp) {
  const safeExp = Math.max(0, Number(totalExp || 0));
  const level = getFighterLevel(safeExp);
  const expAtLevelStart = getCumulativeExpForLevel(level);
  const currentLevelExp = safeExp - expAtLevelStart;

  if (level >= MAX_FIGHTER_LEVEL) {
    return {
      level,
      currentLevelExp,
      xpToNextLevel: 0,
      progressPercent: 100,
      nextLevelExp: 0,
      isMaxLevel: true,
    };
  }

  const nextLevelExp = getExpRequiredForNextLevel(level);
  const xpToNextLevel = Math.max(0, nextLevelExp - currentLevelExp);

  return {
    level,
    currentLevelExp,
    xpToNextLevel,
    progressPercent: Math.min(
      100,
      Math.round((currentLevelExp / nextLevelExp) * 100) || 0
    ),
    nextLevelExp,
    isMaxLevel: false,
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
  const titleInfo = getLevelTitle(levelProgress.level);

  return {
    ...levelProgress,
    totalExp,
    totalRounds,
    totalMinutes,
    totalLogs,
    weeklyRounds: weekly.totalRounds,
    weeklyExp: weekly.totalScore,
    levelLabel: `LV. ${levelProgress.level}`,
    fighterTitle: titleInfo.ko,
    fighterTitleEn: titleInfo.en,
    fighterTitleFlavor: titleInfo.flavor,
    careerStageKo: titleInfo.stageKo,
    careerStageEn: titleInfo.stageEn,
    maxLevel: MAX_FIGHTER_LEVEL,
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
  const didLevelUp = levelAfter.level > levelBefore.level;
  const newTitle =
    didLevelUp && isTitleMilestoneLevel(levelAfter.level)
      ? getTitleAwardedAtLevel(levelAfter.level)
      : null;
  const titleInfo = getLevelTitle(levelAfter.level);

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
    nextLevelExp: levelAfter.nextLevelExp,
    isMaxLevel: levelAfter.isMaxLevel,
    didLevelUp,
    levelLabel: `LV. ${levelAfter.level}`,
    fighterTitle: titleInfo.ko,
    fighterTitleEn: titleInfo.en,
    newTitle,
  };
}
