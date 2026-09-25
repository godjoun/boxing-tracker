import { isDevSurfaceLog } from "./devMode";
import { getLogSummary } from "./logCategories";
import { getLogMinutes, getLogRounds } from "./trainingStats";

const WEEKDAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

export function getDateKey(value) {
  if (!value) return "";

  const raw = String(value).trim();
  const dateOnlyMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return `${year}-${month}-${day}`;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return raw.slice(0, 10);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getRounds(log) {
  return (
    getLogRounds(log) ||
    Number(log?.sets || log?.count || 0) ||
    0
  );
}

export function getTodayKey(now = new Date()) {
  return getDateKey(now);
}

function startOfWeekMonday(date = new Date()) {
  const current = new Date(date);
  current.setHours(0, 0, 0, 0);
  const day = current.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  current.setDate(current.getDate() + diff);
  return current;
}

function buildWeekStrip(trainingByDate, now = new Date()) {
  const monday = startOfWeekMonday(now);
  const todayKey = getDateKey(now);

  return WEEKDAY_LABELS.map((label, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const key = getDateKey(date);
    const training = trainingByDate[key];

    return {
      key,
      label,
      trained: Boolean(training),
      rounds: training?.rounds || 0,
      isToday: key === todayKey,
    };
  });
}

export function getGreeting(now = new Date()) {
  const hour = now.getHours();
  if (hour < 11) return "좋은 아침입니다";
  if (hour < 18) return "좋은 오후입니다";
  return "좋은 저녁입니다";
}

export function formatLogWhen(log, todayKey, now = new Date()) {
  const logKey = getDateKey(log?.date || log?.createdAt);
  if (logKey === todayKey) return "오늘";

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (logKey === getDateKey(yesterday)) return "어제";

  return logKey ? logKey.replaceAll("-", ".") : "";
}

function getLatestLogMetric(log) {
  if (!log) return "";

  const rounds = getRounds(log);
  const minutes = getLogMinutes(log);

  if (rounds > 0) return `${rounds}R`;
  if (minutes > 0) return `${minutes}분`;
  return getLogSummary(log) || "저장됨";
}

export function buildHomeDashboard(logs = [], now = new Date()) {
  const surfaceLogs = logs.filter((log) => !isDevSurfaceLog(log));
  const todayKey = getTodayKey(now);

  const trainingByDate = surfaceLogs.reduce((dates, log) => {
    const key = getDateKey(log.date || log.createdAt);
    if (!key) return dates;

    if (!dates[key]) {
      dates[key] = { count: 0, rounds: 0 };
    }

    dates[key].count += 1;
    dates[key].rounds += getRounds(log);
    return dates;
  }, {});

  const weekStrip = buildWeekStrip(trainingByDate, now);
  const todayLogs = surfaceLogs.filter(
    (log) => getDateKey(log.date || log.createdAt) === todayKey
  );
  const recentLogs = surfaceLogs.slice(0, 2);
  const latestLog = recentLogs[0] || null;

  return {
    surfaceLogs,
    todayKey,
    todayLogs,
    recentLogs,
    latestLog,
    latestLogMetric: getLatestLogMetric(latestLog),
    trainedToday: Boolean(trainingByDate[todayKey]),
    hasAnyRecords: surfaceLogs.length > 0,
    todayMinutes: todayLogs.reduce((sum, log) => sum + getLogMinutes(log), 0),
    totalRounds: surfaceLogs.reduce((sum, log) => sum + getRounds(log), 0),
    trainedDaysThisWeek: weekStrip.filter((day) => day.trained).length,
    trainingDayCount: Object.keys(trainingByDate).length,
    trainingByDate,
    weekStrip,
  };
}
