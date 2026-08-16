export const RECORD_SOURCE = Object.freeze({
  MANTLE_SESSION: "mantle_session",
  MANUAL: "manual",
});

/**
 * Internal origin of a training log. Not a boxing-verification mark.
 *
 * mantle_session — created by completing a MANTLE timer/session.
 * manual — not created through a MANTLE timer session in this version
 *   (typed logs, GPS auto, and any other non-timer path). Extra source
 *   values may be split later; this pair is not a closed taxonomy.
 */
export function resolveRecordSource(logOrSource = {}) {
  const recordSource =
    typeof logOrSource === "string"
      ? logOrSource
      : logOrSource?.recordSource;
  if (
    recordSource === RECORD_SOURCE.MANTLE_SESSION ||
    recordSource === RECORD_SOURCE.MANUAL
  ) {
    return recordSource;
  }

  const source =
    typeof logOrSource === "string" ? "" : logOrSource?.source;
  // Legacy writer of source:"timer" is TimerPage addLog only.
  if (source === "timer") return RECORD_SOURCE.MANTLE_SESSION;
  return RECORD_SOURCE.MANUAL;
}

function toIsoOrNull(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  const text = String(value).trim();
  if (!text) return null;
  const parsed = Date.parse(text);
  if (!Number.isFinite(parsed)) return text;
  return new Date(parsed).toISOString();
}

/**
 * Attach proof-loop fields without renaming or dropping existing keys.
 * Does not invent startedAt/endedAt from createdAt.
 */
export function normalizeProofLog(log = {}) {
  const type = log.trainingType || log.type || "";
  const details = String(log.workoutDetails || log.activities || "").trim();

  const next = {
    ...log,
    recordSource: resolveRecordSource(log),
    trainingType: type || log.type,
  };

  if (Object.prototype.hasOwnProperty.call(log, "startedAt")) {
    next.startedAt = toIsoOrNull(log.startedAt);
  }
  if (Object.prototype.hasOwnProperty.call(log, "endedAt")) {
    next.endedAt = toIsoOrNull(log.endedAt);
  }

  if (details) {
    next.workoutDetails = details;
    next.activities = log.activities || details;
  }

  return next;
}
