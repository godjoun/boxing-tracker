const WORKOUT_DETAILS_RECENT_KEY = "fitness-league-workout-details-recent";

export const WORKOUT_DETAILS_MAX_LENGTH = 120;
export const WORKOUT_DETAILS_RECENT_LIMIT = 3;

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
