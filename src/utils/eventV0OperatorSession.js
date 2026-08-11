const SECRET_KEY_PREFIX = "event-v0-op-secret:";

function secretKey(eventId) {
  return `${SECRET_KEY_PREFIX}${String(eventId || "").trim()}`;
}

/** sessionStorage only — never URL / localStorage. */
export function getEventV0OperatorSecret(eventId) {
  if (typeof sessionStorage === "undefined") return "";
  try {
    return String(sessionStorage.getItem(secretKey(eventId)) || "");
  } catch {
    return "";
  }
}

export function setEventV0OperatorSecret(eventId, secret) {
  if (typeof sessionStorage === "undefined") return;
  const value = String(secret || "").trim();
  if (!value) {
    clearEventV0OperatorSecret(eventId);
    return;
  }
  sessionStorage.setItem(secretKey(eventId), value);
}

export function clearEventV0OperatorSecret(eventId) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(secretKey(eventId));
  } catch {
    /* ignore */
  }
}

export function isInvalidOperatorSecretError(error) {
  const msg = String(error?.message || "").toLowerCase();
  return (
    msg.includes("invalid operator secret") ||
    msg.includes("operator secret is not configured")
  );
}
