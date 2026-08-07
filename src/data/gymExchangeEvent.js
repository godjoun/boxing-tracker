/**
 * 9월 체육관 교류 행사 — 코드 상수 레지스트리 (관리자 UI 없음).
 * 프로덕션 이벤트는 draft + 필수값 비움 유지 → UI 미노출.
 * DEV fixture는 import.meta.env.DEV 분기로 프로덕션 번들에서 DCE.
 */

/** @typedef {"draft" | "upcoming" | "active" | "ended"} GymExchangeEventStatus */

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

const PUBLISHABLE_STATUSES = new Set(["upcoming", "active", "ended"]);

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

/**
 * DEV-only. Production build replaces import.meta.env.DEV with false
 * and eliminates this object (no fake gym/date strings in prod bundle).
 * @type {GymExchangeEvent | null}
 */
export const GYM_EXCHANGE_DEV_FIXTURE = import.meta.env.DEV
  ? Object.freeze({
      id: "mantle-gym-exchange-dev-fixture",
      title: "[DEV] 체육관 교류 픽스처",
      gymA: "Dev Gym Alpha",
      gymB: "Dev Gym Beta",
      date: "2026-09-20",
      location: "Dev City Ring",
      status: "upcoming",
    })
  : null;

/** @returns {GymExchangeEvent[]} */
export function listRegisteredGymExchangeEvents() {
  const list = [GYM_EXCHANGE_EVENT_V1];
  if (GYM_EXCHANGE_DEV_FIXTURE) {
    list.push(GYM_EXCHANGE_DEV_FIXTURE);
  }
  return list;
}

/**
 * @param {GymExchangeEvent | null | undefined} event
 */
export function isPublishableGymExchangeEvent(event) {
  if (!event || typeof event !== "object") return false;
  if (!PUBLISHABLE_STATUSES.has(event.status)) return false;
  const required = [event.title, event.gymA, event.gymB, event.date, event.location];
  return required.every((value) => String(value || "").trim().length > 0);
}

/** @returns {GymExchangeEvent[]} */
export function listPublishableGymExchangeEvents() {
  return listRegisteredGymExchangeEvents().filter(isPublishableGymExchangeEvent);
}

/**
 * @param {string} eventId
 * @returns {GymExchangeEvent | null}
 */
export function getGymExchangeEventById(eventId) {
  const id = String(eventId || "");
  return listRegisteredGymExchangeEvents().find((event) => event.id === id) || null;
}

/**
 * @param {string} eventId
 * @returns {GymExchangeEvent | null}
 */
export function getPublishableGymExchangeEventById(eventId) {
  const event = getGymExchangeEventById(eventId);
  return isPublishableGymExchangeEvent(event) ? event : null;
}

/** @param {GymExchangeEventStatus | string} status */
export function getGymExchangeStatusLabel(status) {
  if (status === "upcoming") return "예정";
  if (status === "active") return "진행";
  if (status === "ended") return "완료";
  if (status === "draft") return "초안";
  return "";
}

/** @param {string} dateIso */
export function formatGymExchangeDate(dateIso) {
  const raw = String(dateIso || "").trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}.${match[2]}.${match[3]}`;
  return raw;
}
