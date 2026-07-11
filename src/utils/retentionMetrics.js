const FIRST_OPEN_KEY = "fitness-league-first-open-at";
const OPEN_DAYS_KEY = "fitness-league-open-days";

function getTodayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function readOpenDays() {
  try {
    const parsed = JSON.parse(localStorage.getItem(OPEN_DAYS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordAppOpen(now = new Date()) {
  if (typeof localStorage === "undefined") return;

  const today = getTodayKey(now);

  if (!localStorage.getItem(FIRST_OPEN_KEY)) {
    localStorage.setItem(FIRST_OPEN_KEY, now.toISOString());
  }

  const openDays = readOpenDays();

  if (!openDays.includes(today)) {
    localStorage.setItem(OPEN_DAYS_KEY, JSON.stringify([...openDays, today]));
  }
}

function getLogTimestamp(log) {
  const raw = log?.createdAt || log?.date;
  if (!raw) return null;

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getFirstWeekChallengeStatus(logs = [], now = new Date()) {
  if (typeof localStorage === "undefined") return null;

  const firstOpenRaw = localStorage.getItem(FIRST_OPEN_KEY);
  if (!firstOpenRaw) return null;

  const firstOpenAt = new Date(firstOpenRaw);
  if (Number.isNaN(firstOpenAt.getTime())) return null;

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysSinceFirstOpen = Math.floor((now - firstOpenAt) / msPerDay);

  if (daysSinceFirstOpen > 7) {
    return null;
  }

  const windowEnd = new Date(firstOpenAt.getTime() + 7 * msPerDay);
  const timerCompletes = logs.filter((log) => {
    if (log?.source !== "timer") return false;

    const timestamp = getLogTimestamp(log);
    if (!timestamp) return false;

    return timestamp >= firstOpenAt && timestamp < windowEnd;
  }).length;

  const openDaysInWindow = readOpenDays().filter((dayKey) => {
    const dayStart = new Date(`${dayKey}T00:00:00`);
    if (Number.isNaN(dayStart.getTime())) return false;

    return dayStart >= firstOpenAt && dayStart < windowEnd;
  }).length;

  return {
    timerCompletes,
    timerTarget: 3,
    openDays: openDaysInWindow,
    openTarget: 5,
    daysLeft: Math.max(0, 7 - daysSinceFirstOpen),
    isTimerComplete: timerCompletes >= 3,
    isOpenComplete: openDaysInWindow >= 5,
  };
}
