import { getFighterProgress } from "./fighterProgress";
import { getTrainingStreak } from "../pages/profilePage/profileCardUtils";

export function buildJourneyAchievements(logs) {
  const totalRounds = logs.reduce(
    (sum, log) =>
      sum +
      Number(
        log.rounds ||
          log.round ||
          log.totalRounds ||
          log.completedRounds ||
          0
      ),
    0
  );
  const totalLogs = logs.length;
  const streakDays = getTrainingStreak(logs);

  const targets = [
    {
      id: "first-training",
      title: "첫 훈련 완료",
      description: "첫 기록을 남겼다.",
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
      description: "체력이 쌓이기 시작했다.",
      unlocked: totalRounds >= 30,
    },
    {
      id: "logs-10",
      title: "훈련 10회 기록",
      description: "꾸준히 링에 섰다.",
      unlocked: totalLogs >= 10,
    },
    {
      id: "rounds-100",
      title: "100라운드 파이터",
      description: "백 라운드를 넘겼다.",
      unlocked: totalRounds >= 100,
    },
    {
      id: "streak-7",
      title: "7일 연속 훈련",
      description: "일주일 연속 기록.",
      unlocked: streakDays >= 7,
    },
  ];

  return targets;
}

export function buildJourneyTimeline(logs) {
  const sorted = [...logs].sort((a, b) =>
    String(a.date || "").localeCompare(String(b.date || ""))
  );

  const milestones = [];

  if (sorted.length > 0) {
    milestones.push({
      id: "journey-start",
      date: sorted[0].date,
      title: "여정 시작",
      description: "첫 훈련 기록이 남았다.",
    });
  }

  const roundTargets = [
    { rounds: 10, title: "10R 돌파", description: "누적 10라운드를 버텼다." },
    { rounds: 30, title: "30R 돌파", description: "체력이 쌓이기 시작했다." },
    { rounds: 100, title: "100R 완주", description: "백 라운드 파이터." },
  ];

  let runningRounds = 0;

  sorted.forEach((log) => {
    runningRounds += Number(
      log.rounds ||
        log.round ||
        log.totalRounds ||
        log.completedRounds ||
        0
    );

    roundTargets.forEach((target) => {
      const milestoneId = `rounds-${target.rounds}`;

      if (
        runningRounds >= target.rounds &&
        !milestones.some((item) => item.id === milestoneId)
      ) {
        milestones.push({
          id: milestoneId,
          date: log.date,
          title: target.title,
          description: target.description,
        });
      }
    });
  });

  const fighter = getFighterProgress(logs);

  if (fighter.level >= 3) {
    milestones.push({
      id: `level-${fighter.level}`,
      date: sorted[sorted.length - 1]?.date || "",
      title: `${fighter.levelLabel} 달성`,
      description: `${fighter.fighterTitle} · ${fighter.fighterTitleEn}`,
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

export function buildJourneySummary({ logs, profile, weeklyScore }) {
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
    fighterTitleEn: fighter.fighterTitleEn,
    levelLabel: fighter.levelLabel,
    totalRounds: fighter.totalRounds,
    totalLogs: fighter.totalLogs,
    totalExp: fighter.totalExp,
    streakDays,
    weeklyScore,
    careerStageKo: fighter.careerStageKo,
    storyLine,
  };
}

export function buildJourneyData({ logs, profile, weeklyScore }) {
  return {
    summary: buildJourneySummary({ logs, profile, weeklyScore }),
    timeline: buildJourneyTimeline(logs),
    memories: buildMemoryLogs(logs),
    achievements: buildJourneyAchievements(logs),
  };
}
