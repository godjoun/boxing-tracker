export const CARD_MAKER_LOG_ID_KEY = "fitness-league-card-maker-log-id";

export function setCardMakerLogId(logId) {
  if (!logId || typeof localStorage === "undefined") return;
  localStorage.setItem(CARD_MAKER_LOG_ID_KEY, logId);
}

export function peekCardMakerLogId() {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(CARD_MAKER_LOG_ID_KEY);
}

export function consumeCardMakerLogId() {
  const logId = peekCardMakerLogId();
  if (logId) {
    localStorage.removeItem(CARD_MAKER_LOG_ID_KEY);
  }
  return logId;
}
