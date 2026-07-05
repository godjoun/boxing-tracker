const DIFFICULTY_MULTIPLIER = {
  easy: 0.8,
  normal: 1,
  hard: 1.2,
  crazy: 1.5,
};

const SPARRING_BONUS = 20;
const ROUND_SCORE = 10;
const MINUTE_SCORE = 0.5;

export const CONDITION_OPTIONS = [
  { id: "fresh", label: "컨디션 좋음" },
  { id: "normal", label: "보통" },
  { id: "tired", label: "피곤함" },
  { id: "heavy", label: "몸 무거움" },
  { id: "sore", label: "근육통" },
];

const CONDITION_LABEL = Object.fromEntries(
  CONDITION_OPTIONS.map((item) => [item.id, item.label])
);

export function getConditionLabel(condition) {
  return CONDITION_LABEL[condition] || CONDITION_LABEL.normal;
}

export function getLogMinutes(log) {
  return Number(log?.minutes || log?.duration || 0) || 0;
}

export function getLogRounds(log) {
  return (
    Number(
      log?.rounds ||
        log?.totalRounds ||
        log?.completedRounds ||
        log?.round ||
        0
    ) || 0
  );
}

export function isSparringLog(log) {
  return /스파링|sparring/i.test(log?.type || "");
}

export function calculateLogScore(logOrMinutes, difficulty = "normal", rounds = 0, type = "") {
  let minutes;
  let finalDifficulty;
  let finalRounds;
  let finalType;

  if (typeof logOrMinutes === "object" && logOrMinutes !== null) {
    const log = logOrMinutes;
    minutes = getLogMinutes(log);
    finalDifficulty = log.difficulty || "normal";
    finalRounds = getLogRounds(log);
    finalType = log.type || "";
  } else {
    minutes = Number(logOrMinutes || 0);
    finalDifficulty = difficulty;
    finalRounds = Number(rounds || 0);
    finalType = type;
  }

  const multiplier = DIFFICULTY_MULTIPLIER[finalDifficulty] || 1;
  let base = finalRounds * ROUND_SCORE + minutes * MINUTE_SCORE;

  if (isSparringLog({ type: finalType })) {
    base += SPARRING_BONUS;
  }

  return Math.round(base * multiplier);
}

export function getWeekStart(date = new Date()) {
  const target = new Date(date);
  const day = target.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  target.setDate(target.getDate() + diff);
  target.setHours(0, 0, 0, 0);

  return target;
}

export function getWeekEnd(date = new Date()) {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);

  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return weekEnd;
}

export function isThisWeek(dateString, referenceDate = new Date()) {
  const date = new Date(`${dateString}T00:00:00`);
  const weekStart = getWeekStart(referenceDate);
  const nextWeekStart = new Date(weekStart);

  nextWeekStart.setDate(weekStart.getDate() + 7);

  return date >= weekStart && date < nextWeekStart;
}

function formatShortDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}.${day}`;
}

function buildTypeBreakdown(logs) {
  const totals = {};

  logs.forEach((log) => {
    const type = (log.type || "기타").trim() || "기타";

    if (!totals[type]) {
      totals[type] = { type, count: 0, minutes: 0, rounds: 0 };
    }

    totals[type].count += 1;
    totals[type].minutes += getLogMinutes(log);
    totals[type].rounds += getLogRounds(log);
  });

  return Object.values(totals).sort((a, b) => {
    if (b.rounds !== a.rounds) return b.rounds - a.rounds;
    if (b.count !== a.count) return b.count - a.count;
    return b.minutes - a.minutes;
  });
}

function buildDailyActivity(logs) {
  const byDate = {};

  logs.forEach((log) => {
    const date = log.date;
    if (!byDate[date]) {
      byDate[date] = { date, sessions: 0, rounds: 0, minutes: 0 };
    }

    byDate[date].sessions += 1;
    byDate[date].rounds += getLogRounds(log);
    byDate[date].minutes += getLogMinutes(log);
  });

  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
}

function buildConditionBreakdown(logs) {
  const totals = {};

  logs.forEach((log) => {
    const condition = log.condition || "normal";
    const label = log.conditionLabel || getConditionLabel(condition);

    if (!totals[condition]) {
      totals[condition] = { id: condition, label, count: 0, rounds: 0 };
    }

    totals[condition].count += 1;
    totals[condition].rounds += getLogRounds(log);
  });

  return Object.values(totals).sort((a, b) => b.count - a.count);
}

function buildHighlights({
  totalRounds,
  sparringCount,
  breakdown,
  totalSessions,
  conditionBreakdown,
}) {
  const highlights = [];

  if (totalSessions === 0) {
    return ["이번 주 아직 훈련 기록이 없습니다. 첫 라운드를 시작해 보세요."];
  }

  highlights.push(`이번 주 총 ${totalRounds}라운드 완료`);

  if (sparringCount > 0) {
    highlights.push(`스파링 ${sparringCount}회 — 실전 감각 유지 중`);
  }

  const topType = breakdown[0];
  if (topType) {
    highlights.push(
      `가장 많이 한 훈련: ${topType.type} (${topType.count}회 · ${topType.rounds}R)`
    );
  }

  const topCondition = conditionBreakdown[0];
  if (topCondition && topCondition.id !== "normal") {
    highlights.push(
      `이번 주 컨디션: ${topCondition.label} ${topCondition.count}회`
    );
  } else if (topCondition) {
    highlights.push(`컨디션 ${topCondition.label} ${topCondition.count}회`);
  }

  if (totalRounds >= 36) {
    highlights.push("주간 36R 이상 — 프로처럼 볼륨을 쌓고 있습니다");
  } else if (totalRounds >= 18) {
    highlights.push("꾸준한 주간 볼륨. 다음 주는 +6R 목표");
  }

  return highlights.slice(0, 5);
}

export function buildWeeklyReport(logs, referenceDate = new Date()) {
  const weekLogs = logs.filter((log) => isThisWeek(log.date, referenceDate));
  const weekStart = getWeekStart(referenceDate);
  const weekEnd = getWeekEnd(referenceDate);

  const totalSessions = weekLogs.length;
  const totalRounds = weekLogs.reduce((sum, log) => sum + getLogRounds(log), 0);
  const totalMinutes = weekLogs.reduce((sum, log) => sum + getLogMinutes(log), 0);
  const totalScore = weekLogs.reduce(
    (sum, log) => sum + calculateLogScore(log),
    0
  );
  const sparringCount = weekLogs.filter(isSparringLog).length;
  const sparringRounds = weekLogs
    .filter(isSparringLog)
    .reduce((sum, log) => sum + getLogRounds(log), 0);
  const breakdown = buildTypeBreakdown(weekLogs);
  const conditionBreakdown = buildConditionBreakdown(weekLogs);
  const dailyActivity = buildDailyActivity(weekLogs);
  const highlights = buildHighlights({
    totalRounds,
    sparringCount,
    breakdown,
    totalSessions,
    conditionBreakdown,
  });

  const todayMidnight = new Date(referenceDate);
  todayMidnight.setHours(0, 0, 0, 0);
  const endMidnight = new Date(weekEnd);
  endMidnight.setHours(0, 0, 0, 0);
  const daysLeft = Math.max(
    0,
    Math.ceil((endMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24))
  );

  return {
    weekLabel: `${formatShortDate(weekStart)} – ${formatShortDate(weekEnd)}`,
    daysLeft,
    totalSessions,
    totalRounds,
    totalMinutes,
    totalScore,
    sparringCount,
    sparringRounds,
    breakdown,
    conditionBreakdown,
    dailyActivity,
    highlights,
    weekLogs,
  };
}

export function buildAllTimeStats(logs) {
  const totalSessions = logs.length;
  const totalRounds = logs.reduce((sum, log) => sum + getLogRounds(log), 0);
  const totalMinutes = logs.reduce((sum, log) => sum + getLogMinutes(log), 0);
  const totalScore = logs.reduce((sum, log) => sum + calculateLogScore(log), 0);
  const sparringCount = logs.filter(isSparringLog).length;
  const breakdown = buildTypeBreakdown(logs);
  const weeklyReport = buildWeeklyReport(logs);
  const timerLogs = logs.filter((log) => log.source === "timer").length;
  const topRoundDay = buildDailyActivity(logs).sort((a, b) => b.rounds - a.rounds)[0];

  return {
    totalSessions,
    totalRounds,
    totalMinutes,
    totalScore,
    sparringCount,
    breakdown,
    weeklyReport,
    timerLogs,
    topRoundDay,
    averageRoundsPerSession:
      totalSessions > 0 ? Math.round((totalRounds / totalSessions) * 10) / 10 : 0,
  };
}

function formatWeekKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isLogInWeek(log, weekStart, weekEnd) {
  if (!log?.date) return false;

  const logDate = new Date(`${log.date}T12:00:00`);

  if (Number.isNaN(logDate.getTime())) return false;

  return logDate >= weekStart && logDate <= weekEnd;
}

export function buildWeeklyRoundTrend(logs, weekCount = 8, referenceDate = new Date()) {
  const safeWeekCount = Math.max(4, Math.min(8, Number(weekCount) || 8));
  const weeks = [];

  for (let index = 0; index < safeWeekCount; index += 1) {
    const weeksAgo = safeWeekCount - 1 - index;
    const ref = new Date(referenceDate);
    ref.setDate(ref.getDate() - weeksAgo * 7);

    const weekStart = getWeekStart(ref);
    const weekEnd = getWeekEnd(ref);
    const weekLogs = logs.filter((log) => isLogInWeek(log, weekStart, weekEnd));
    const rounds = weekLogs.reduce((sum, log) => sum + getLogRounds(log), 0);
    const minutes = weekLogs.reduce((sum, log) => sum + getLogMinutes(log), 0);

    weeks.push({
      weekKey: formatWeekKey(weekStart),
      shortLabel: formatShortDate(weekStart),
      weekLabel: `${formatShortDate(weekStart)} – ${formatShortDate(weekEnd)}`,
      rounds,
      sessions: weekLogs.length,
      minutes,
      isCurrentWeek: weeksAgo === 0,
      changeFromPrevious: null,
    });
  }

  weeks.forEach((week, index) => {
    if (index === 0) return;
    week.changeFromPrevious = week.rounds - weeks[index - 1].rounds;
  });

  const maxRounds = Math.max(...weeks.map((week) => week.rounds), 1);

  return weeks.map((week) => ({
    ...week,
    barHeightPercent: Math.round((week.rounds / maxRounds) * 100),
  }));
}

export function getWeeklyTrendSummary(weeks) {
  if (!weeks.length) {
    return { label: "아직 비교할 주간 데이터가 없습니다.", tone: "neutral" };
  }

  const currentWeek = weeks[weeks.length - 1];
  const previousWeek = weeks.length > 1 ? weeks[weeks.length - 2] : null;

  if (!previousWeek) {
    return {
      label: `이번 주 ${currentWeek.rounds}R`,
      tone: "neutral",
    };
  }

  const change = currentWeek.changeFromPrevious ?? 0;

  if (change > 0) {
    return {
      label: `전주 대비 +${change}R · 이번 주 ${currentWeek.rounds}R`,
      tone: "up",
    };
  }

  if (change < 0) {
    return {
      label: `전주 대비 ${change}R · 이번 주 ${currentWeek.rounds}R`,
      tone: "down",
    };
  }

  return {
    label: `전주와 동일 · 이번 주 ${currentWeek.rounds}R`,
    tone: "neutral",
  };
}

export function normalizeLogScores(logs) {
  return logs.map((log) => ({
    ...log,
    score: calculateLogScore(log),
  }));
}
