import {
  CAREER_STAGE_RANGES,
  getCareerStage,
  MAX_FIGHTER_LEVEL,
} from "./fighterTitles";
import { VETERAN_PERKS } from "./veteranPerks";

const STORAGE_KEY = "mantle-monthly-level-awards-v1";

const MONTHLY_LEVEL_BONUSES = {
  일반인: 1,
  아마추어: 1,
  세미프로: 2,
  프로: 2,
  챔피언: 3,
  레전드: 3,
};

/**
 * One shared table for career tiers, season rewards, and real unlocks.
 * Tier boundaries come from fighterTitles; unlocks come from veteranPerks.
 */
export const MONTHLY_TIER_REWARDS = CAREER_STAGE_RANGES.map((stage) => ({
  stage: stage.stageKo,
  stageEn: stage.stageEn,
  from: stage.from,
  to: stage.to,
  levels: MONTHLY_LEVEL_BONUSES[stage.stageKo] || 0,
  perks: VETERAN_PERKS.filter((perk) => perk.level === stage.from),
}));

function getMonthKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getPreviousMonthKey(date = new Date()) {
  return getMonthKey(new Date(date.getFullYear(), date.getMonth() - 1, 1));
}

function getMonthsBetween(startMonth, endMonth) {
  const [startYear, startValue] = startMonth.split("-").map(Number);
  const [endYear, endValue] = endMonth.split("-").map(Number);
  const months = [];

  for (
    let cursor = new Date(startYear, startValue - 1, 1);
    cursor <= new Date(endYear, endValue - 1, 1);
    cursor.setMonth(cursor.getMonth() + 1)
  ) {
    months.push(getMonthKey(cursor));
  }

  return months;
}

function readSeasonState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      startedMonth:
        typeof parsed.startedMonth === "string" ? parsed.startedMonth : null,
      awards: Array.isArray(parsed.awards) ? parsed.awards : [],
    };
  } catch {
    return { startedMonth: null, awards: [] };
  }
}

function writeSeasonState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Keep growth usable when local storage is unavailable.
  }
}

function hasTrainingInMonth(logs, month) {
  return logs.some((log) => String(log?.date || "").startsWith(month));
}

function getRewardForLevel(level) {
  const stage = getCareerStage(level);
  return (
    MONTHLY_TIER_REWARDS.find((item) => item.stage === stage.stageKo) ||
    MONTHLY_TIER_REWARDS[0]
  );
}

export function getCareerTierState(level) {
  const safeLevel = Math.min(
    MAX_FIGHTER_LEVEL,
    Math.max(1, Math.floor(Number(level) || 1))
  );
  const current = getRewardForLevel(safeLevel);
  const currentIndex = MONTHLY_TIER_REWARDS.findIndex(
    (tier) => tier.stage === current.stage
  );
  const next = MONTHLY_TIER_REWARDS[currentIndex + 1] || null;
  const levelsToNextTier = next ? Math.max(0, next.from - safeLevel) : 0;
  const progressPercent = next
    ? Math.round(
        ((safeLevel - current.from) / (next.from - current.from)) * 100
      )
    : 100;

  return {
    current,
    next,
    level: safeLevel,
    levelsToNextTier,
    progressPercent: Math.min(100, Math.max(0, progressPercent)),
    isMaxTier: !next,
    tiers: MONTHLY_TIER_REWARDS.map((tier, index) => ({
      ...tier,
      status:
        index < currentIndex
          ? "complete"
          : index === currentIndex
            ? "current"
            : "locked",
    })),
  };
}

export function getAccumulatedSeasonLevels() {
  return readSeasonState().awards.reduce(
    (total, award) => total + Math.max(0, Number(award?.levels) || 0),
    0
  );
}

/**
 * Closes every completed month since this system was introduced.
 * `getBaseLevelAtMonth` must return the XP-only level for the supplied logs.
 */
export function settleMonthlyLevelAwards(
  logs = [],
  getBaseLevelAtMonth,
  referenceDate = new Date()
) {
  const state = readSeasonState();
  const currentMonth = getMonthKey(referenceDate);

  // Existing users begin participating from the month this feature is enabled.
  if (!state.startedMonth) {
    const nextState = { ...state, startedMonth: currentMonth };
    writeSeasonState(nextState);
    return { ...nextState, newlyAwarded: [] };
  }

  const lastCompletedMonth = getPreviousMonthKey(referenceDate);
  if (state.startedMonth > lastCompletedMonth) {
    return { ...state, newlyAwarded: [] };
  }

  const awardedMonths = new Set(state.awards.map((award) => award.month));
  const newlyAwarded = [];
  const awards = [...state.awards];

  getMonthsBetween(state.startedMonth, lastCompletedMonth).forEach((month) => {
    if (awardedMonths.has(month) || !hasTrainingInMonth(logs, month)) return;

    const logsThroughMonth = logs.filter(
      (log) => String(log?.date || "").slice(0, 7) <= month
    );
    const levelsBeforeThisAward = awards.reduce(
      (total, award) => total + (Number(award.levels) || 0),
      0
    );
    const levelAtClose = Math.min(
      MAX_FIGHTER_LEVEL,
      getBaseLevelAtMonth(logsThroughMonth) + levelsBeforeThisAward
    );
    const reward = getRewardForLevel(levelAtClose);
    const levels = Math.min(reward.levels, MAX_FIGHTER_LEVEL - levelAtClose);

    if (levels <= 0) return;

    const award = {
      month,
      stage: reward.stage,
      levelAtClose,
      levels,
      awardedAt: referenceDate.toISOString(),
    };
    awards.push(award);
    newlyAwarded.push(award);
  });

  const nextState = { ...state, awards };
  if (newlyAwarded.length > 0) writeSeasonState(nextState);
  return { ...nextState, newlyAwarded };
}

export function getMonthlySeasonSummary(level) {
  const reward = getCareerTierState(level).current;
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    ...reward,
    currentMonth: getMonthKey(now),
    endsOn: `${endOfMonth.getMonth() + 1}월 ${endOfMonth.getDate()}일`,
  };
}
