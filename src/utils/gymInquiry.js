import {
  fetchOwnerGymInquiries,
  hasGymInquiryRemote,
  insertRemoteGymInquiry,
} from "../api/gymInquiryApi";
import { resolveDojoActorId } from "../api/dojoExchangeApi";

const INQUIRIES_KEY = "fitness-league-gym-inquiries";

export { hasGymInquiryRemote };

export function inquiryKindLabel(kind) {
  if (kind === "rental") return "대여";
  if (kind === "reservation") return "예약";
  return "체험";
}

export function formatInquiryWhen(value) {
  if (!value) return "";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString("ko-KR", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(value);
  }
}

export function saveGymInquiry(inquiry) {
  if (typeof localStorage === "undefined") return null;

  const entry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    synced: false,
    ...inquiry,
  };

  try {
    const current = JSON.parse(localStorage.getItem(INQUIRIES_KEY) || "[]");
    const next = [entry, ...(Array.isArray(current) ? current : [])].slice(
      0,
      30
    );
    localStorage.setItem(INQUIRIES_KEY, JSON.stringify(next));
  } catch {
    localStorage.setItem(INQUIRIES_KEY, JSON.stringify([entry]));
  }

  return entry;
}

function markInquirySynced(id) {
  if (typeof localStorage === "undefined" || !id) return;

  try {
    const current = JSON.parse(localStorage.getItem(INQUIRIES_KEY) || "[]");
    if (!Array.isArray(current)) return;
    const next = current.map((item) =>
      item.id === id ? { ...item, synced: true, source: "server" } : item
    );
    localStorage.setItem(INQUIRIES_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

/** 로컬 저장 + 가능하면 서버(리드함)로 전송 */
export async function saveGymInquiryAsync(inquiry) {
  const entry = saveGymInquiry(inquiry);
  if (!entry) {
    return { inquiry: null, synced: false };
  }

  if (!hasGymInquiryRemote()) {
    return { inquiry: entry, synced: false };
  }

  const remoteId = await insertRemoteGymInquiry(entry);
  if (!remoteId) {
    return { inquiry: entry, synced: false };
  }

  markInquirySynced(entry.id);
  return {
    inquiry: { ...entry, synced: true, source: "server" },
    synced: true,
  };
}

export function readGymInquiries() {
  if (typeof localStorage === "undefined") return [];

  try {
    const parsed = JSON.parse(localStorage.getItem(INQUIRIES_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** 관장: 내 입점관으로 온 문의 */
export async function loadOwnerGymInquiries(userId) {
  if (!hasGymInquiryRemote()) return [];
  const actorId = resolveDojoActorId(userId);
  return fetchOwnerGymInquiries(actorId);
}
