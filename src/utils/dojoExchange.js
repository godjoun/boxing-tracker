import { LOCAL_EXCHANGE_EVENTS } from "../data/localDojoData";

const EVENTS_KEY = "fitness-league-dojo-exchange-events";
const APPLIES_KEY = "fitness-league-dojo-exchange-applies";

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

export function formatExchangeFee(feeWon) {
  const n = Number(feeWon);
  if (!Number.isFinite(n) || n <= 0) return "무료";
  return `${n.toLocaleString("ko-KR")}원`;
}

export function formatExchangeSlots(appliedCount, capacity) {
  const applied = Math.max(0, Number(appliedCount) || 0);
  const cap = Math.max(0, Number(capacity) || 0);
  if (cap <= 0) return `${applied}명 신청`;
  return `${applied}/${cap}명`;
}

/** 다음 해당 요일의 시각 (이미 지났으면 다음 주) */
export function upcomingWeekdayIso(weekday, hour = 14, minute = 0) {
  const now = new Date();
  const d = new Date(now);
  d.setSeconds(0, 0);
  d.setMilliseconds(0);
  d.setHours(hour, minute, 0, 0);

  let add = (weekday - now.getDay() + 7) % 7;
  if (add === 0 && d.getTime() <= now.getTime()) add = 7;
  d.setDate(now.getDate() + add);
  return d.toISOString();
}

export function formatExchangeWhen(startsAt, fallbackLabel = "") {
  if (!startsAt) return fallbackLabel || "시간 미정";

  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) return fallbackLabel || "시간 미정";

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = WEEKDAY_KO[date.getDay()];
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours < 12 ? "오전" : "오후";
  const h12 = hours % 12 || 12;
  const time =
    minutes === 0
      ? `${ampm} ${h12}시`
      : `${ampm} ${h12}시 ${String(minutes).padStart(2, "0")}분`;

  return `${month}/${day}(${weekday}) ${time}`;
}

export function toDateInputValue(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** YYYY-MM-DD 와 같은 날인지 */
export function isSameExchangeDay(startsAt, dateStr) {
  if (!startsAt || !dateStr) return false;
  return toDateInputValue(startsAt) === dateStr;
}

export function filterExchangeEventsByDate(events, dateStr) {
  if (!dateStr) return events;
  return events.filter((event) => isSameExchangeDay(event.startsAt, dateStr));
}

export function toTimeInputValue(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

export function combineDateAndTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const date = new Date(`${dateStr}T${timeStr}:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function isExchangePast(event, now = Date.now()) {
  const startsAt = event?.startsAt;
  if (!startsAt) return true;
  const t = new Date(startsAt).getTime();
  if (Number.isNaN(t)) return true;
  return t < now;
}

function eventSortKey(event) {
  return event.startsAt || event.whenSort || event.createdAt || "";
}

function readStoredEvents() {
  if (typeof localStorage === "undefined") return [];

  try {
    const parsed = JSON.parse(localStorage.getItem(EVENTS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredEvents(events) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events.slice(0, 40)));
}

function readApplies() {
  if (typeof localStorage === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(APPLIES_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeApplies(items) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(APPLIES_KEY, JSON.stringify(items.slice(0, 80)));
}

export function hasAppliedExchange(eventId, userId = null) {
  if (!eventId) return false;
  return readApplies().some(
    (item) =>
      item.eventId === eventId && (!userId || item.userId === userId)
  );
}

export function listAppliesForEvent(eventId) {
  if (!eventId) return [];
  return readApplies()
    .filter((item) => item.eventId === eventId)
    .sort((a, b) => String(b.createdAt || "").localeCompare(a.createdAt || ""));
}

export function applyExchangeEvent(eventId, fromUser = {}) {
  const userId = fromUser.userId || null;
  if (!eventId || hasAppliedExchange(eventId, userId)) return null;

  writeApplies([
    {
      id: crypto.randomUUID(),
      eventId,
      userId,
      nickname: fromUser.nickname || "나",
      createdAt: new Date().toISOString(),
    },
    ...readApplies(),
  ]);

  const stored = readStoredEvents();
  const idx = stored.findIndex((item) => item.id === eventId);
  if (idx >= 0) {
    const current = stored[idx];
    stored[idx] = {
      ...current,
      appliedCount: Math.max(0, Number(current.appliedCount) || 0) + 1,
    };
    writeStoredEvents(stored);
  }

  return true;
}

export function cancelExchangeApply(eventId, userId = null) {
  if (!eventId || !hasAppliedExchange(eventId, userId)) return false;

  writeApplies(
    readApplies().filter(
      (item) =>
        !(
          item.eventId === eventId &&
          (!userId || item.userId === userId)
        )
    )
  );

  const stored = readStoredEvents();
  const idx = stored.findIndex((item) => item.id === eventId);
  if (idx >= 0) {
    const current = stored[idx];
    stored[idx] = {
      ...current,
      appliedCount: Math.max(0, (Number(current.appliedCount) || 0) - 1),
    };
    writeStoredEvents(stored);
  }

  return true;
}

function withApplyBoost(event, userId) {
  const appliedExtra =
    event.source === "seed" && hasAppliedExchange(event.id, userId) ? 1 : 0;
  return {
    ...event,
    appliedCount: Math.max(0, Number(event.appliedCount) || 0) + appliedExtra,
  };
}

function normalizeSeedEvent(seed) {
  const startsAt = upcomingWeekdayIso(
    seed.weekday,
    seed.hour ?? 14,
    seed.minute ?? 0
  );

  return {
    ...seed,
    startsAt,
    whenLabel: formatExchangeWhen(startsAt),
    whenSort: startsAt,
    isSample: true,
    source: "seed",
    isMine: false,
  };
}

export function listExchangeEvents(userId = null, options = {}) {
  const { includePast = false } = options;
  const now = Date.now();

  const mine = readStoredEvents().map((event) => ({
    ...event,
    isMine: Boolean(userId && event.userId === userId),
    source: event.source || "local",
    isSample: false,
    whenLabel:
      event.whenLabel ||
      formatExchangeWhen(event.startsAt, event.whenLabel || ""),
  }));

  const seed = LOCAL_EXCHANGE_EVENTS.map(normalizeSeedEvent);

  const all = [...mine, ...seed]
    .map((event) => withApplyBoost(event, userId))
    .map((event) => ({
      ...event,
      isPast: isExchangePast(event, now),
    }))
    .filter((event) => includePast || !event.isPast)
    .sort((a, b) => eventSortKey(a).localeCompare(eventSortKey(b)));

  return all;
}

export function listPastExchangeEvents(userId = null) {
  const now = Date.now();

  return readStoredEvents()
    .map((event) => ({
      ...event,
      isMine: Boolean(userId && event.userId === userId),
      source: event.source || "local",
      isSample: false,
      isPast: true,
      whenLabel:
        event.whenLabel ||
        formatExchangeWhen(event.startsAt, event.whenLabel || ""),
    }))
    .filter((event) => isExchangePast(event, now))
    .map((event) => withApplyBoost(event, userId))
    .sort((a, b) => eventSortKey(b).localeCompare(eventSortKey(a)));
}

export function saveExchangeEvent(event, userId = null) {
  const startsAt = event.startsAt || null;
  const entry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    userId: userId || null,
    source: "local",
    appliedCount: 0,
    isSample: false,
    ...event,
    startsAt,
    whenSort: startsAt || new Date().toISOString(),
    whenLabel: formatExchangeWhen(startsAt, event.whenLabel || ""),
  };

  const next = [entry, ...readStoredEvents()];
  writeStoredEvents(next);
  return entry;
}

export function removeExchangeEvent(eventId, userId = null) {
  const next = readStoredEvents().filter((event) => {
    if (event.id !== eventId) return true;
    if (!userId) return false;
    return event.userId !== userId;
  });
  writeStoredEvents(next);

  writeApplies(readApplies().filter((item) => item.eventId !== eventId));
}

export function defaultComposeDateTime() {
  const iso = upcomingWeekdayIso(6, 14, 0);
  return {
    date: toDateInputValue(iso),
    time: toTimeInputValue(iso),
  };
}
