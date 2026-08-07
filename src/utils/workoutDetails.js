const WORKOUT_DETAILS_RECENT_KEY = "fitness-league-workout-details-recent";
const WORKOUT_DETAIL_PRESETS_KEY = "fitness-league-workout-detail-presets";
/** TrainingContext GUEST_USER_ID와 동일 — 레거시(접미사 없음) 키 */
const GUEST_USER_ID = "local-user";

export const WORKOUT_DETAILS_MAX_LENGTH = 120;
export const WORKOUT_DETAILS_RECENT_LIMIT = 3;
export const WORKOUT_DETAIL_PRESETS_LIMIT = 3;
export const WORKOUT_DETAIL_PRESET_NAME_MAX = 12;

/** 복싱 빠른 종목 — 모드 칩과 별개 */
export const QUICK_WORKOUT_KINDS = [
  "줄넘기",
  "쉐도우",
  "샌드백",
  "미트",
  "스파링",
];

export function normalizeWorkoutDetails(value) {
  if (value == null) return "";
  return String(value)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, WORKOUT_DETAILS_MAX_LENGTH);
}

export function normalizeWorkoutPresetName(value) {
  if (value == null) return "";
  return String(value)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, WORKOUT_DETAIL_PRESET_NAME_MAX);
}

/**
 * 로그 키와 동일한 사용자 접미사 규칙.
 * guest/local-user → 접미사 없음, 그 외 → `-${userId}`
 */
export function getWorkoutDetailPresetsStorageKey(userId) {
  const id = String(userId || "").trim();
  if (!id || id === GUEST_USER_ID) {
    return WORKOUT_DETAIL_PRESETS_KEY;
  }
  return `${WORKOUT_DETAIL_PRESETS_KEY}-${id}`;
}

function createPresetId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `wdp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function namesEqual(a, b) {
  return a.toLocaleLowerCase("ko") === b.toLocaleLowerCase("ko");
}

function sanitizePreset(raw) {
  if (!raw || typeof raw !== "object") return null;
  const name = normalizeWorkoutPresetName(raw.name);
  const details = normalizeWorkoutDetails(raw.details);
  if (!name || !details) return null;
  const id = String(raw.id || "").trim() || createPresetId();
  const createdAt =
    typeof raw.createdAt === "string" && raw.createdAt
      ? raw.createdAt
      : new Date().toISOString();
  const updatedAt =
    typeof raw.updatedAt === "string" && raw.updatedAt ? raw.updatedAt : createdAt;
  return { id, name, details, createdAt, updatedAt };
}

function writePresets(userId, presets) {
  const key = getWorkoutDetailPresetsStorageKey(userId);
  try {
    localStorage.setItem(key, JSON.stringify(presets));
  } catch {
    // ignore quota / private mode
  }
  return presets;
}

export function loadWorkoutDetailPresets(userId) {
  try {
    const raw = localStorage.getItem(getWorkoutDetailPresetsStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => sanitizePreset(item))
      .filter(Boolean)
      .slice(0, WORKOUT_DETAIL_PRESETS_LIMIT);
  } catch {
    return [];
  }
}

/**
 * @returns {{ ok: true, presets: object[] } | { ok: false, error: string, presets: object[] }}
 */
export function saveWorkoutDetailPreset(userId, { name, details }) {
  const presets = loadWorkoutDetailPresets(userId);
  const nextName = normalizeWorkoutPresetName(name);
  const nextDetails = normalizeWorkoutDetails(details);

  if (!nextName || !nextDetails) {
    return { ok: false, error: "empty", presets };
  }
  if (presets.length >= WORKOUT_DETAIL_PRESETS_LIMIT) {
    return { ok: false, error: "full", presets };
  }
  if (presets.some((item) => namesEqual(item.name, nextName))) {
    return { ok: false, error: "duplicate", presets };
  }

  const now = new Date().toISOString();
  const next = [
    ...presets,
    {
      id: createPresetId(),
      name: nextName,
      details: nextDetails,
      createdAt: now,
      updatedAt: now,
    },
  ];
  return { ok: true, presets: writePresets(userId, next) };
}

/**
 * @returns {{ ok: true, presets: object[] } | { ok: false, error: string, presets: object[] }}
 */
export function renameWorkoutDetailPreset(userId, presetId, nextNameRaw) {
  const presets = loadWorkoutDetailPresets(userId);
  const id = String(presetId || "").trim();
  const nextName = normalizeWorkoutPresetName(nextNameRaw);
  if (!nextName) {
    return { ok: false, error: "empty", presets };
  }
  const index = presets.findIndex((item) => item.id === id);
  if (index < 0) {
    return { ok: false, error: "missing", presets };
  }
  if (
    presets.some((item, i) => i !== index && namesEqual(item.name, nextName))
  ) {
    return { ok: false, error: "duplicate", presets };
  }

  const next = presets.map((item, i) =>
    i === index
      ? { ...item, name: nextName, updatedAt: new Date().toISOString() }
      : item
  );
  return { ok: true, presets: writePresets(userId, next) };
}

export function deleteWorkoutDetailPreset(userId, presetId) {
  const presets = loadWorkoutDetailPresets(userId);
  const id = String(presetId || "").trim();
  const next = presets.filter((item) => item.id !== id);
  return { ok: true, presets: writePresets(userId, next) };
}

/**
 * "줄넘기 2R · 쉐도우 3R" → segments.
 * 알려진 `종목 N R` 패턴은 kind, 그 외는 text로 보존.
 */
export function parseWorkoutDetailSegments(value) {
  const raw = String(value || "").trim();
  if (!raw) return [];

  return raw
    .split(/\s*·\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const match = part.match(/^(.+?)\s+(\d+)\s*R$/i);
      if (!match) {
        return { type: "text", value: part };
      }
      return {
        type: "kind",
        name: match[1].trim(),
        rounds: Math.max(1, Number(match[2]) || 1),
      };
    })
    .filter((segment) =>
      segment.type === "text" ? Boolean(segment.value) : Boolean(segment.name)
    );
}

export function formatWorkoutDetailSegments(segments) {
  return normalizeWorkoutDetails(
    (segments || [])
      .map((segment) => {
        if (segment.type === "kind") {
          return `${segment.name} ${Math.max(1, Number(segment.rounds) || 1)}R`;
        }
        return String(segment.value || "").trim();
      })
      .filter(Boolean)
      .join(" · ")
  );
}

/** 같은 종목이 있으면 라운드 +1, 없으면 끝에 `종목 1R` 추가. 순서·기타 문장 보존. */
export function bumpQuickWorkoutKind(value, kindName) {
  const kind = String(kindName || "").trim();
  if (!kind) return normalizeWorkoutDetails(value);

  const segments = parseWorkoutDetailSegments(value);
  const index = segments.findIndex(
    (segment) => segment.type === "kind" && segment.name === kind
  );

  if (index >= 0) {
    const current = segments[index];
    segments[index] = {
      ...current,
      rounds: Math.max(1, Number(current.rounds) || 1) + 1,
    };
  } else {
    segments.push({ type: "kind", name: kind, rounds: 1 });
  }

  return formatWorkoutDetailSegments(segments);
}

/** 해당 종목 kind 세그먼트만 제거. 나머지·자유 문장 유지. */
export function removeQuickWorkoutKind(value, kindName) {
  const kind = String(kindName || "").trim();
  if (!kind) return normalizeWorkoutDetails(value);

  return formatWorkoutDetailSegments(
    parseWorkoutDetailSegments(value).filter(
      (segment) => !(segment.type === "kind" && segment.name === kind)
    )
  );
}

export function getSelectedQuickWorkoutKinds(value) {
  return parseWorkoutDetailSegments(value).filter(
    (segment) =>
      segment.type === "kind" && QUICK_WORKOUT_KINDS.includes(segment.name)
  );
}

export function loadRecentWorkoutDetails() {
  try {
    const raw = localStorage.getItem(WORKOUT_DETAILS_RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => normalizeWorkoutDetails(item))
      .filter(Boolean)
      .slice(0, WORKOUT_DETAILS_RECENT_LIMIT);
  } catch {
    return [];
  }
}

/** 비어 있지 않은 값을 최근 목록 맨 앞에 쌓는다 (중복 제거). */
export function rememberWorkoutDetails(value) {
  const next = normalizeWorkoutDetails(value);
  if (!next) return loadRecentWorkoutDetails();

  const recent = [
    next,
    ...loadRecentWorkoutDetails().filter((item) => item !== next),
  ].slice(0, WORKOUT_DETAILS_RECENT_LIMIT);

  try {
    localStorage.setItem(WORKOUT_DETAILS_RECENT_KEY, JSON.stringify(recent));
  } catch {
    // ignore quota / private mode
  }

  return recent;
}
