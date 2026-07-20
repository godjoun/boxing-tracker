import { LOCAL_EXCHANGE_EVENTS } from "../data/localDojoData";
import {
  applyRemoteExchange,
  cancelRemoteExchangeApply,
  deleteRemoteExchangeEvent,
  fetchRemoteAppliesForActor,
  fetchRemoteAppliesForEvent,
  fetchRemoteExchangeEvents,
  fetchRemotePastExchangeEvents,
  hasDojoExchangeRemote,
  insertRemoteExchangeEvent,
  resolveDojoActorId,
} from "../api/dojoExchangeApi";

const EVENTS_KEY = "fitness-league-dojo-exchange-events";
const APPLIES_KEY = "fitness-league-dojo-exchange-applies";

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

export { hasDojoExchangeRemote, resolveDojoActorId };

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

/** 체육관·주소·제목·안내 텍스트 검색 */
export function filterExchangeEventsByQuery(events, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return events;

  return events.filter((event) => {
    const haystack = [
      event.gymName,
      event.address,
      event.title,
      event.note,
      event.hostNickname,
      event.whenLabel,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });
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

function matchesActor(itemUserId, userId) {
  if (!userId) return true;
  const actorId = resolveDojoActorId(userId);
  return itemUserId === actorId || itemUserId === userId;
}

function upsertLocalEvent(entry) {
  const next = [
    entry,
    ...readStoredEvents().filter((item) => item.id !== entry.id),
  ];
  writeStoredEvents(next);
}

function mergeRemoteAppliesIntoLocal(remoteApplies, actorId) {
  if (!Array.isArray(remoteApplies) || !actorId) return;

  const others = readApplies().filter((item) => item.userId !== actorId);
  const merged = [
    ...remoteApplies.map((item) => ({
      id: item.id,
      eventId: item.eventId,
      userId: item.userId,
      nickname: item.nickname,
      createdAt: item.createdAt,
      source: "server",
    })),
    ...others,
  ];
  writeApplies(merged);
}

function isMineEvent(event, userId, actorId) {
  if (!event?.userId) return false;
  if (actorId && event.userId === actorId) return true;
  if (userId && event.userId === userId) return true;
  // 예전 로컬 저장(게스트 id) → 같은 기기에서는 내 일정으로 본다
  const legacyGuest =
    event.userId === "local-user" || event.userId === "dev-local-user";
  const usingGuest =
    !userId || userId === "local-user" || userId === "dev-local-user";
  return Boolean(legacyGuest && usingGuest && event.source !== "server");
}

function decorateEvent(event, userId, actorId, now) {
  return {
    ...event,
    isMine: isMineEvent(event, userId, actorId),
    whenLabel:
      event.whenLabel ||
      formatExchangeWhen(event.startsAt, event.whenLabel || ""),
    isPast: isExchangePast(event, now),
  };
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

function buildMergedList({
  remoteEvents,
  userId,
  actorId,
  includePast,
  pastOnly = false,
}) {
  const now = Date.now();
  const remoteIds = new Set((remoteEvents || []).map((item) => item.id));

  const local = readStoredEvents()
    .filter((event) => !remoteIds.has(event.id))
    .map((event) => ({
      ...event,
      source: event.source || "local",
      isSample: false,
    }));

  const seed = pastOnly ? [] : LOCAL_EXCHANGE_EVENTS.map(normalizeSeedEvent);
  const remote = (remoteEvents || []).map((event) => ({
    ...event,
    isSample: false,
  }));

  return [...remote, ...local, ...seed]
    .map((event) => decorateEvent(event, userId, actorId, now))
    .map((event) => withApplyBoost(event, userId))
    .filter((event) => {
      if (pastOnly) return event.isPast;
      return includePast || !event.isPast;
    })
    .sort((a, b) =>
      pastOnly
        ? eventSortKey(b).localeCompare(eventSortKey(a))
        : eventSortKey(a).localeCompare(eventSortKey(b))
    );
}

export function hasAppliedExchange(eventId, userId = null) {
  if (!eventId) return false;
  return readApplies().some(
    (item) => item.eventId === eventId && matchesActor(item.userId, userId)
  );
}

export function listAppliesForEvent(eventId) {
  if (!eventId) return [];
  return readApplies()
    .filter((item) => item.eventId === eventId)
    .sort((a, b) => String(b.createdAt || "").localeCompare(a.createdAt || ""));
}

export function applyExchangeEvent(eventId, fromUser = {}) {
  const actorId = resolveDojoActorId(fromUser.userId || null);
  if (!eventId || hasAppliedExchange(eventId, fromUser.userId)) return null;

  writeApplies([
    {
      id: crypto.randomUUID(),
      eventId,
      userId: actorId,
      nickname: fromUser.nickname || "나",
      createdAt: new Date().toISOString(),
      source: "local",
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
  const actorId = resolveDojoActorId(userId);
  if (!eventId || !hasAppliedExchange(eventId, userId)) return false;

  writeApplies(
    readApplies().filter(
      (item) =>
        !(
          item.eventId === eventId &&
          (item.userId === actorId || item.userId === userId)
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

/** 로컬만 (오프라인·시드용). 화면은 listExchangeEventsAsync 사용 */
export function listExchangeEvents(userId = null, options = {}) {
  const actorId = resolveDojoActorId(userId);
  return buildMergedList({
    remoteEvents: [],
    userId,
    actorId,
    includePast: Boolean(options.includePast),
  });
}

export function listPastExchangeEvents(userId = null) {
  const actorId = resolveDojoActorId(userId);
  return buildMergedList({
    remoteEvents: [],
    userId,
    actorId,
    includePast: true,
    pastOnly: true,
  });
}

export function saveExchangeEvent(event, userId = null) {
  const actorId = resolveDojoActorId(userId);
  const startsAt = event.startsAt || null;
  const entry = {
    id: event.id || crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    source: event.source || "local",
    appliedCount: 0,
    isSample: false,
    ...event,
    userId: actorId,
    startsAt,
    whenSort: startsAt || new Date().toISOString(),
    whenLabel: formatExchangeWhen(startsAt, event.whenLabel || ""),
  };

  upsertLocalEvent(entry);
  return entry;
}

export function removeExchangeEvent(eventId, userId = null) {
  const actorId = resolveDojoActorId(userId);
  const next = readStoredEvents().filter((event) => {
    if (event.id !== eventId) return true;
    if (!userId) return false;
    return event.userId !== actorId && event.userId !== userId;
  });
  writeStoredEvents(next);
  writeApplies(readApplies().filter((item) => item.eventId !== eventId));
}

function claimLegacyLocalEvents(actorId, userId) {
  if (!actorId) return;
  const next = readStoredEvents().map((event) => {
    if (event.source === "server") return event;
    const legacy =
      event.userId === "local-user" ||
      event.userId === "dev-local-user" ||
      !event.userId;
    const usingGuest =
      !userId || userId === "local-user" || userId === "dev-local-user";
    if (!legacy || !usingGuest) return event;
    return { ...event, userId: actorId };
  });
  writeStoredEvents(next);
}

async function pushLocalOwnedEventsToRemote(actorId, remoteEvents) {
  if (!actorId || !Array.isArray(remoteEvents)) return remoteEvents;

  const remoteIds = new Set(remoteEvents.map((item) => item.id));
  const ownedLocal = readStoredEvents().filter(
    (event) =>
      event.userId === actorId &&
      event.source !== "server" &&
      event.startsAt &&
      !remoteIds.has(event.id) &&
      !isExchangePast(event)
  );

  if (ownedLocal.length === 0) return remoteEvents;

  const uploaded = [];
  for (const event of ownedLocal) {
    const remote = await insertRemoteExchangeEvent(event, actorId);
    if (!remote) continue;
    const syncedEntry = { ...event, ...remote, source: "server", userId: actorId };
    upsertLocalEvent(syncedEntry);
    uploaded.push(syncedEntry);
  }

  return [...remoteEvents, ...uploaded];
}

export async function listExchangeEventsAsync(userId = null, options = {}) {
  const actorId = resolveDojoActorId(userId);
  claimLegacyLocalEvents(actorId, userId);

  let remoteEvents = null;
  let synced = false;

  if (hasDojoExchangeRemote()) {
    remoteEvents = await fetchRemoteExchangeEvents(actorId);
    if (Array.isArray(remoteEvents)) {
      remoteEvents = await pushLocalOwnedEventsToRemote(actorId, remoteEvents);
      synced = true;
    }
    const remoteApplies = await fetchRemoteAppliesForActor(actorId);
    if (remoteApplies) {
      mergeRemoteAppliesIntoLocal(remoteApplies, actorId);
    }
  }

  return {
    events: buildMergedList({
      remoteEvents: remoteEvents || [],
      userId,
      actorId,
      includePast: Boolean(options.includePast),
    }),
    synced,
  };
}

export async function listPastExchangeEventsAsync(userId = null) {
  const actorId = resolveDojoActorId(userId);
  let remoteEvents = null;
  let synced = false;

  if (hasDojoExchangeRemote()) {
    remoteEvents = await fetchRemotePastExchangeEvents(actorId);
    synced = Array.isArray(remoteEvents);
  }

  return {
    events: buildMergedList({
      remoteEvents: remoteEvents || [],
      userId,
      actorId,
      includePast: true,
      pastOnly: true,
    }),
    synced,
  };
}

export async function saveExchangeEventAsync(event, userId = null) {
  const id = crypto.randomUUID();
  const localEntry = saveExchangeEvent(
    { ...event, id, source: "local" },
    userId
  );

  if (!hasDojoExchangeRemote()) {
    return { event: localEntry, synced: false };
  }

  const remote = await insertRemoteExchangeEvent(
    localEntry,
    resolveDojoActorId(userId)
  );

  if (!remote) {
    return { event: localEntry, synced: false };
  }

  const syncedEntry = {
    ...localEntry,
    ...remote,
    source: "server",
  };
  upsertLocalEvent(syncedEntry);
  return { event: syncedEntry, synced: true };
}

export async function removeExchangeEventAsync(eventId, userId = null) {
  const actorId = resolveDojoActorId(userId);
  const target = readStoredEvents().find((item) => item.id === eventId);
  const isServer = target?.source === "server" || hasDojoExchangeRemote();

  removeExchangeEvent(eventId, userId);

  if (isServer && hasDojoExchangeRemote()) {
    await deleteRemoteExchangeEvent(eventId, actorId);
  }

  return true;
}

export async function applyExchangeEventAsync(eventId, fromUser = {}, meta = {}) {
  if (!eventId) return { ok: false, synced: false };

  if (meta.source === "seed" || meta.isSample) {
    const ok = Boolean(applyExchangeEvent(eventId, fromUser));
    return { ok, synced: false };
  }

  if (hasDojoExchangeRemote() && meta.source === "server") {
    const result = await applyRemoteExchange(
      eventId,
      resolveDojoActorId(fromUser.userId),
      fromUser.nickname || "나"
    );

    if (result === true) {
      applyExchangeEvent(eventId, fromUser);
      return { ok: true, synced: true };
    }

    if (result === false) {
      return { ok: false, synced: true };
    }
  }

  const ok = Boolean(applyExchangeEvent(eventId, fromUser));
  return { ok, synced: false };
}

export async function cancelExchangeApplyAsync(eventId, userId = null, meta = {}) {
  if (!eventId) return { ok: false, synced: false };

  if (meta.source === "seed" || meta.isSample) {
    return { ok: cancelExchangeApply(eventId, userId), synced: false };
  }

  if (hasDojoExchangeRemote() && meta.source === "server") {
    const result = await cancelRemoteExchangeApply(
      eventId,
      resolveDojoActorId(userId)
    );

    if (result === true) {
      cancelExchangeApply(eventId, userId);
      return { ok: true, synced: true };
    }

    if (result === false) {
      return { ok: false, synced: true };
    }
  }

  return { ok: cancelExchangeApply(eventId, userId), synced: false };
}

export async function listAppliesForEventAsync(eventId, meta = {}) {
  if (!eventId) return [];

  if (hasDojoExchangeRemote() && meta.source === "server") {
    const remote = await fetchRemoteAppliesForEvent(eventId);
    if (remote) {
      const others = readApplies().filter((item) => item.eventId !== eventId);
      writeApplies([
        ...remote.map((item) => ({
          id: item.id,
          eventId: item.eventId,
          userId: item.userId,
          nickname: item.nickname,
          createdAt: item.createdAt,
          source: "server",
        })),
        ...others,
      ]);
      return listAppliesForEvent(eventId);
    }
  }

  return listAppliesForEvent(eventId);
}

export function defaultComposeDateTime() {
  const iso = upcomingWeekdayIso(6, 14, 0);
  return {
    date: toDateInputValue(iso),
    time: toTimeInputValue(iso),
  };
}
