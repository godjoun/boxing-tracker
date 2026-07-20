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

  const payload = {
    id: inquiry.id,
    gym_id: inquiry.gymId || "general",
    gym_name: inquiry.gymName || "일반 문의",
    kind: inquiry.kind === "rental" ? "rental" : "trial",
    contact: inquiry.contact,
    preferred_date: inquiry.preferredDate || "",
    memo: inquiry.memo || "",
    party_size: inquiry.partySize ?? null,
    hours: inquiry.hours ?? null,
    user_id: inquiry.userId || null,
    nickname: inquiry.nickname || "",
    source: "app",
  };

  try {
    const { data, error } = await supabase
      .from("dojo_gym_inquiries")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      if (isRemoteUnavailable(error)) return null;
      throw error;
    }

    return data?.id || inquiry.id;
  } catch (error) {
    if (isRemoteUnavailable(error)) return null;
    throw error;
  }
}
