import { getSupabase, isSupabaseConfigured } from "../lib/supabaseClient";

export function hasGymInquiryRemote() {
  return isSupabaseConfigured && Boolean(getSupabase());
}

function isRemoteUnavailable(error) {
  const message = String(error?.message || error || "").toLowerCase();
  const code = String(error?.code || "");
  const status = Number(error?.status || error?.statusCode || 0);

  return (
    code === "PGRST205" ||
    code === "PGRST202" ||
    code === "42P01" ||
    code === "42883" ||
    status === 0 ||
    status === 401 ||
    status === 403 ||
    status === 404 ||
    status >= 500 ||
    message.includes("does not exist") ||
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("dojo_gym_inquiries") ||
    message.includes("list_dojo_gym_inquiries_for_owner")
  );
}

export async function insertRemoteGymInquiry(inquiry) {
  const supabase = getSupabase();
  if (!supabase) {
    return { id: null, errorMessage: "서버 연결이 없습니다." };
  }

  const kind =
    inquiry.kind === "rental"
      ? "rental"
      : inquiry.kind === "reservation"
        ? "reservation"
        : "trial";

  const base = {
    id: inquiry.id,
    gym_id: inquiry.gymId || "general",
    gym_name: inquiry.gymName || "일반 문의",
    kind,
    contact: inquiry.contact,
    preferred_date: inquiry.preferredDate || "",
    party_size: inquiry.partySize ?? null,
    hours: inquiry.hours ?? null,
    user_id: inquiry.userId || null,
    nickname: inquiry.nickname || "",
    source: "app",
  };

  const richMemoParts = [
    inquiry.experience ? `경험: ${inquiry.experience}` : "",
    inquiry.purpose ? `목적: ${inquiry.purpose}` : "",
    inquiry.timeSlot ? `시간: ${inquiry.timeSlot}` : "",
    inquiry.memo || "",
  ].filter(Boolean);

  const fullPayload = {
    ...base,
    memo: inquiry.memo || "",
    experience: inquiry.experience || "",
    purpose: inquiry.purpose || "",
    time_slot: inquiry.timeSlot || "",
    acquisition_source: inquiry.acquisitionSource || "organic",
  };
  const compatiblePayload = { ...fullPayload };
  delete compatiblePayload.acquisition_source;

  const legacyPayload = {
    ...base,
    kind: kind === "reservation" ? "trial" : kind,
    memo: richMemoParts.join(" · "),
  };

  const attempts = [fullPayload, compatiblePayload, legacyPayload];

  try {
    let lastError = null;
    for (const payload of attempts) {
      const { error } = await supabase
        .from("dojo_gym_inquiries")
        .insert(payload);
      if (!error) {
        return { id: inquiry.id, errorMessage: "" };
      }
      lastError = error;
      console.warn("[gymInquiry] insert failed", error.message || error);
    }

    return {
      id: null,
      errorMessage: formatInquiryInsertError(lastError),
    };
  } catch (error) {
    if (isRemoteUnavailable(error)) {
      return {
        id: null,
        errorMessage: formatInquiryInsertError(error),
      };
    }
    throw error;
  }
}

function formatInquiryInsertError(error) {
  const message = String(error?.message || error || "");
  const lower = message.toLowerCase();
  if (
    lower.includes("row-level security") ||
    lower.includes("42501") ||
    String(error?.code || "") === "42501"
  ) {
    return "서버 권한(RLS) 때문에 문의가 막혔습니다. Supabase에서 dojo_inquiries.sql을 실행해 주세요.";
  }
  if (lower.includes("does not exist") || String(error?.code || "") === "42P01") {
    return "문의 테이블이 없습니다. dojo_inquiries.sql을 먼저 실행해 주세요.";
  }
  return message || "서버 저장에 실패했습니다.";
}

function mapInquiryRow(row) {
  if (!row?.id) return null;
  return {
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
  };
}

/** 내 입점관으로 온 문의 (RPC) */
export async function fetchOwnerGymInquiries(actorId) {
  const supabase = getSupabase();
  if (!supabase || !actorId) return [];

  try {
    const { data, error } = await supabase.rpc(
      "list_dojo_gym_inquiries_for_owner",
      { p_actor_id: actorId }
    );

    if (error) {
      if (isRemoteUnavailable(error)) return [];
      throw error;
    }

    return (data || []).map(mapInquiryRow).filter(Boolean);
  } catch (error) {
    if (isRemoteUnavailable(error)) return [];
    throw error;
  }
}
