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
    message.includes("dojo_gym_inquiries")
  );
}

export async function insertRemoteGymInquiry(inquiry) {
  const supabase = getSupabase();
  if (!supabase) return null;

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
  };

  const legacyPayload = {
    ...base,
    kind: kind === "reservation" ? "trial" : kind,
    memo: richMemoParts.join(" · "),
  };

  try {
    let { error } = await supabase.from("dojo_gym_inquiries").insert(fullPayload);

    if (error) {
      const message = String(error.message || "").toLowerCase();
      const needsLegacy =
        message.includes("experience") ||
        message.includes("purpose") ||
        message.includes("time_slot") ||
        message.includes("reservation") ||
        message.includes("check");

      if (needsLegacy) {
        ({ error } = await supabase
          .from("dojo_gym_inquiries")
          .insert(legacyPayload));
      }
    }

    if (error) {
      if (isRemoteUnavailable(error)) return null;
      throw error;
    }

    return inquiry.id;
  } catch (error) {
    if (isRemoteUnavailable(error)) return null;
    throw error;
  }
}
