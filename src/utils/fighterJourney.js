import { getFighterProgress } from "./fighterProgress";
import { getTrainingStreak } from "../pages/profilePage/profileCardUtils";
import { getLogRounds } from "./trainingStats";

export function buildJourneyAchievements(logs) {
  const fighter = getFighterProgress(logs);
  const streakDays = getTrainingStreak(logs);
  const totalLogs = logs.length;
  const totalRounds = fighter.totalRounds;

  return [
    {
      id: "first-training",
      title: "첫 훈련 완료",
      description: "첫 번째 운동 기록을 남겼다.",
      unlocked: totalLogs >= 1,
    },
    {
      id: "rounds-10",
      title: "10라운드 돌파",
      description: "누적 10라운드를 버텼다.",
      unlocked: totalRounds >= 10,
    },
    {
      id: "rounds-30",
      title: "30라운드 돌파",
      description: "복싱 체력이 쌓이기 시작했다.",
      unlocked: totalRounds >= 30,
    },
    {
      id: "logs-10",
      title: "훈련 10회 기록",
      description: "꾸준함이 기록으로 남았다.",
      unlocked: totalLogs >= 10,
    },
    {
      id: "rounds-100",
      title: "100라운드 파이터",
      description: "누적 100라운드를 완주했다.",
      unlocked: totalRounds >= 100,
    },
    {
      id: "streak-7",
      title: "7일 연속 훈련",
      description: "일주일 동안 링에 올라갔다.",
      unlocked: streakDays >= 7,
    },
  ];
}

function sortLogsOldestFirst(logs) {
  return [...logs].sort((a, b) => {
    const aTime = new Date(a.date || a.createdAt || 0).getTime();
    const bTime = new Date(b.date || b.createdAt || 0).getTime();
    return aTime - bTime;
  });
}

function findRoundMilestoneDate(logs, targetRounds) {
  let cumulative = 0;

  for (const log of sortLogsOldestFirst(logs)) {
    cumulative += getLogRounds(log);

    if (cumulative >= targetRounds) {
      return log.date || log.createdAt?.slice(0, 10) || null;
    }
  }

  return null;
}

export function buildJourneyTimeline(logs) {
  const milestones = [];
  const sorted = sortLogsOldestFirst(logs);

  if (sorted.length > 0) {
    const first = sorted[0];
    milestones.push({
      id: "journey-start",
      date: first.date || first.createdAt?.slice(0, 10) || "",
      title: "여정 시작",
      description: `첫 훈련 · ${first.type || "복싱 훈련"}`,
    });
  }

  const roundTargets = [
    { rounds: 10, title: "10R 돌파", description: "누적 10라운드를 버텼다." },
    { rounds: 30, title: "30R 돌파", description: "체력이 쌓이기 시작했다." },
    { rounds: 100, title: "100R 완주", description: "백 라운드 파이터." },
  ];

  for (const target of roundTargets) {
    const date = findRoundMilestoneDate(logs, target.rounds);

    if (date) {
      milestones.push({
        id: `rounds-${target.rounds}`,
        date,
        title: target.title,
        description: target.description,
      });
    }
  }

  const fighter = getFighterProgress(logs);

  if (fighter.level >= 3) {
    milestones.push({
      id: `level-${fighter.level}`,
      date: sorted[sorted.length - 1]?.date || "",
      title: `${fighter.levelLabel} 달성`,
      description: fighter.fighterTitle,
    });
  }

  return milestones.sort((a, b) => {
    const aTime = new Date(a.date || 0).getTime();
    const bTime = new Date(b.date || 0).getTime();
    return bTime - aTime;
  });
}

export function buildMemoryLogs(logs, limit = 8) {
  return logs.filter((log) => log.publicComment || log.memo).slice(0, limit);
}

export function buildJourneySummary({
  logs,
  profile,
  weeklyScore,
  currentTier,
}) {
  const fighter = getFighterProgress(logs);
  const streakDays = getTrainingStreak(logs);
  const nickname = profile?.nickname || "나";

  const storyLine =
    logs.length === 0
      ? "첫 훈련을 완료하면 여기에 주인공의 이야기가 쌓입니다."
      : `${nickname}는 지금까지 ${fighter.totalRounds}R · ${fighter.totalLogs}회 훈련을 버텼고, ${fighter.levelLabel} ${fighter.fighterTitle}입니다.`;

  return {
    nickname,
    fighterTitle: fighter.fighterTitle,
    levelLabel: fighter.levelLabel,
    totalRounds: fighter.totalRounds,
    totalLogs: fighter.totalLogs,
    totalExp: fighter.totalExp,
    streakDays,
    weeklyScore,
    tierName: currentTier?.name || "시즌",
    storyLine,
  };
}

export function buildJourneyData({ logs, profile, weeklyScore, currentTier }) {
  return {
    summary: buildJourneySummary({ logs, profile, weeklyScore, currentTier }),
    timeline: buildJourneyTimeline(logs),
    memories: buildMemoryLogs(logs),
    achievements: buildJourneyAchievements(logs),
  };
}
