import { buildJourneyAchievements } from "./fighterJourney";
import { getFighterProgress } from "./fighterProgress";
import { getNextTitleMilestone } from "./fighterTitles";
import { getTrainingStreak } from "../pages/profilePage/profileCardUtils";
import { buildWeeklyReport } from "./trainingStats";

export const WEEKLY_ROUND_GOAL_OPTIONS = [9, 12, 15, 21];
const WEEKLY_GOAL_STORAGE_KEY = "fitness-league-weekly-round-goal";
const DEFAULT_WEEKLY_ROUND_GOAL = 12;

export function readWeeklyRoundGoal() {
  try {
    const parsed = Number(localStorage.getItem(WEEKLY_GOAL_STORAGE_KEY));
    return WEEKLY_ROUND_GOAL_OPTIONS.includes(parsed)
      ? parsed
      : DEFAULT_WEEKLY_ROUND_GOAL;
  } catch {
    return DEFAULT_WEEKLY_ROUND_GOAL;
  }
}

export function writeWeeklyRoundGoal(rounds) {
  if (!WEEKLY_ROUND_GOAL_OPTIONS.includes(rounds)) return;
  localStorage.setItem(WEEKLY_GOAL_STORAGE_KEY, String(rounds));
}

export function getNextWeeklyRoundGoal(currentGoal) {
  const index = WEEKLY_ROUND_GOAL_OPTIONS.indexOf(currentGoal);
  const safeIndex = index >= 0 ? index : 1;
  return WEEKLY_ROUND_GOAL_OPTIONS[
    (safeIndex + 1) % WEEKLY_ROUND_GOAL_OPTIONS.length
  ];
}

export function getWeeklyGoalStatus(logs, targetRounds = readWeeklyRoundGoal()) {
  const weekly = buildWeeklyReport(logs);
  const currentRounds = weekly.totalRounds;
  const progressPercent =
    targetRounds > 0
      ? Math.min(100, Math.round((currentRounds / targetRounds) * 100))
      : 0;

  return {
    targetRounds,
    currentRounds,
    remainingRounds: Math.max(targetRounds - currentRounds, 0),
    progressPercent,
    isComplete: currentRounds >= targetRounds,
  };
}

function getAchievementProgress(achievementId, stats) {
  switch (achievementId) {
    case "first-training":
      return { current: stats.totalLogs, target: 1, unit: "회" };
    case "rounds-10":
      return { current: stats.totalRounds, target: 10, unit: "R" };
    case "rounds-30":
      return { current: stats.totalRounds, target: 30, unit: "R" };
    case "logs-10":
      return { current: stats.totalLogs, target: 10, unit: "회" };
    case "rounds-100":
      return { current: stats.totalRounds, target: 100, unit: "R" };
    case "streak-7":
      return { current: stats.streakDays, target: 7, unit: "일" };
    default:
      return { current: 0, target: 1, unit: "" };
  }
}

export function getNextGrowthMilestone(logs) {
  const fighter = getFighterProgress(logs);
  const achievements = buildJourneyAchievements(logs);
  const streakDays = getTrainingStreak(logs);
  const stats = {
    totalRounds: fighter.totalRounds,
    totalLogs: fighter.totalLogs,
    streakDays,
  };

  const candidates = [];

  if (!fighter.isMaxLevel) {
    candidates.push({
      id: "level",
      kicker: "NEXT LEVEL",
      title: `LV.${fighter.level + 1} 달성`,
      description: `${fighter.xpToNextLevel} EXP 남음`,
      progressPercent: fighter.progressPercent,
      remainingLabel: `${fighter.xpToNextLevel} EXP`,
      priority: 3,
    });
  }

  const nextAchievement = achievements.find((item) => !item.unlocked);
  if (nextAchievement) {
    const progress = getAchievementProgress(nextAchievement.id, stats);
    const progressPercent =
      progress.target > 0
        ? Math.min(100, Math.round((progress.current / progress.target) * 100))
        : 0;
    const remaining = Math.max(progress.target - progress.current, 0);

    candidates.push({
      id: nextAchievement.id,
      kicker: "ACHIEVEMENT",
      title: nextAchievement.title,
      description: nextAchievement.description,
      progressPercent,
      remainingLabel:
        remaining > 0 ? `${remaining}${progress.unit} 남음` : "달성 직전",
      priority: 2,
    });
  }

  const nextTitle = getNextTitleMilestone(fighter.level);
  if (nextTitle) {
    const progressPercent =
      nextTitle.level > 0
        ? Math.min(100, Math.round((fighter.level / nextTitle.level) * 100))
        : 0;

    candidates.push({
      id: "title",
      kicker: "NEXT TITLE",
      title: nextTitle.ko,
      description: `LV.${nextTitle.level} · ${nextTitle.en}`,
      progressPercent,
      remainingLabel: `${nextTitle.level - fighter.level}레벨 남음`,
      priority: 1,
    });
  }

  const incomplete = candidates.filter((item) => item.progressPercent < 100);

  if (incomplete.length === 0) {
    return {
      id: "complete",
      kicker: "MILESTONE",
      title: "다음 목표를 모두 달성했어요",
      description: "아래에서 칭호·업적을 펼쳐 확인하세요.",
      progressPercent: 100,
      remainingLabel: "완료",
      priority: 0,
    };
  }

  return incomplete.sort((a, b) => {
    if (b.progressPercent !== a.progressPercent) {
      return b.progressPercent - a.progressPercent;
    }

    return b.priority - a.priority;
  })[0];
}
