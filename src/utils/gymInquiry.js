import {
  fetchOwnerGymInquiries,
  hasGymInquiryRemote,
  insertRemoteGymInquiry,
} from "../api/gymInquiryApi";
import { fetchSentGymInquiries } from "../api/gymInquiryChatApi";
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
  const actorId = resolveDojoActorId(inquiry.userId);
  const entry = saveGymInquiry({
    ...inquiry,
    userId: actorId,
  });
  if (!entry) {
    return { inquiry: null, synced: false, syncMessage: "저장에 실패했습니다." };
  }

  if (!hasGymInquiryRemote()) {
    return {
      inquiry: entry,
      synced: false,
      syncMessage: "서버 설정이 없어 이 기기에만 저장했습니다.",
    };
  }

  const remote = await insertRemoteGymInquiry(entry);
  if (!remote.id) {
    return {
      inquiry: entry,
      synced: false,
      syncMessage: remote.errorMessage || "서버 저장에 실패했습니다.",
    };
  }

  markInquirySynced(entry.id);
  return {
    inquiry: { ...entry, synced: true, source: "server" },
    synced: true,
    syncMessage: "",
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

/** 문의자: 내가 보낸 문의 */
export async function loadSentGymInquiries(userId) {
  if (!hasGymInquiryRemote()) return [];
  const actorId = resolveDojoActorId(userId);
  const rows = await fetchSentGymInquiries(actorId);
  return rows
    .map((row) => ({
      id: row.id,
      gymId: row.gym_id || "general",
      gymName: row.gym_name || "",
      kind: row.kind || "trial",
      contact: row.contact || "",
      preferredDate: row.preferred_date || "",
      memo: row.memo || "",
      partySize: row.party_size ?? null,
      hours: row.hours ?? null,
      experience: row.experience || "",
      purpose: row.purpose || "",
      timeSlot: row.time_slot || "",
      userId: row.user_id || null,
      nickname: row.nickname || "",
      acquisitionSource: row.acquisition_source || "organic",
      source: row.source || "server",
      createdAt: row.created_at || null,
      synced: true,
    }))
    .filter((item) => item.id);
}
