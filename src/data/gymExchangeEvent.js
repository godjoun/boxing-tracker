/**
 * 9월 체육관 교류 행사 — 코드 상수 1건 (관리자 UI 없음).
 * 실제 체육관명·날짜가 확정되기 전에는 플레이스홀더만 둔다.
 * UI/QR은 Phase 1 범위 밖.
 */

/** @typedef {"draft" | "open" | "live" | "closed"} GymExchangeEventStatus */

/**
 * @typedef {object} GymExchangeEvent
 * @property {string} id
 * @property {string} title
 * @property {string} gymA
 * @property {string} gymB
 * @property {string} date  ISO date (YYYY-MM-DD) when known
 * @property {string} location
 * @property {GymExchangeEventStatus} status
 */

/** @type {GymExchangeEvent} */
export const GYM_EXCHANGE_EVENT_V1 = Object.freeze({
  id: "mantle-gym-exchange-2026-09",
  title: "",
  gymA: "",
  gymB: "",
  date: "",
  location: "",
  status: "draft",
});

export function getGymExchangeEventById(eventId) {
  if (String(eventId || "") === GYM_EXCHANGE_EVENT_V1.id) {
    return GYM_EXCHANGE_EVENT_V1;
  }
  return null;
}
