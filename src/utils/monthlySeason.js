import { getCareerStage, MAX_FIGHTER_LEVEL } from "./fighterTitles";

const STORAGE_KEY = "mantle-monthly-level-awards-v1";

export const MONTHLY_TIER_REWARDS = [
  { stage: "일반인", from: 1, to: 15, levels: 1, unlock: "기록 시작" },
  {
    stage: "아마추어",
    from: 16,
    to: 35,
    levels: 1,
    unlock: "아마추어 인증",
  },
  {
    stage: "세미프로",
    from: 36,
    to: 50,
    levels: 2,
    unlock: "세미프로 카드",
  },
  {
    stage: "프로",
    from: 51,
    to: 75,
    levels: 2,
    unlock: "프로 인증 · 우선 노출",
  },
  {
    stage: "챔피언",
    from: 76,
    to: 95,
    levels: 3,
    unlock: "챔피언 카드 · 명패",
  },
  {
    stage: "레전드",
    from: 96,
    to: 100,
    levels: 3,
    unlock: "GOAT 카드 · 명예의 전당",
  },
];

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
  const reward = getRewardForLevel(level);
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    ...reward,
    currentMonth: getMonthKey(now),
    endsOn: `${endOfMonth.getMonth() + 1}월 ${endOfMonth.getDate()}일`,
  };
}
