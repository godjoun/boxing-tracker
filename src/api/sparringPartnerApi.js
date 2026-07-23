import { getSupabase, isSupabaseConfigured } from "../lib/supabaseClient";

export function hasSparringPartnerRemote() {
  return isSupabaseConfigured && Boolean(getSupabase());
}

function isRemoteUnavailable(error) {
  const message = String(error?.message || error || "").toLowerCase();
  const code = String(error?.code || "");
  const status = Number(error?.status || error?.statusCode || 0);

  return (
    code === "PGRST202" ||
    code === "42883" ||
    code === "42P01" ||
    status === 0 ||
    status === 401 ||
    status === 403 ||
    status === 404 ||
    status >= 500 ||
    message.includes("does not exist") ||
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("dojo_sparring")
  );
}

function mapProfile(row, actorId) {
  if (!row?.id) return null;
  return {
    id: row.id,
    nickname: row.nickname || "복서",
    weightClass: row.weight_class || "",
    experience: row.experience || "",
    style: row.style || "",
    area: row.area || "",
    meetWhen: row.meet_when || "",
    note: row.note || "",
    active: Boolean(row.active),
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
    source: "server",
    isMine: Boolean(row.is_mine || (actorId && row.actor_id === actorId)),
    distanceLabel: row.is_mine ? "내 프로필" : "공개 프로필",
  };
}

export async function fetchSparringProfiles({
  actorId,
  weightClass = "전체",
  areaQuery = "",
  timeQuery = "",
}) {
  const supabase = getSupabase();
  if (!supabase || !actorId) return null;

  try {
    const { data, error } = await supabase.rpc("list_dojo_sparring_profiles", {
      p_actor_id: actorId,
      p_weight_class: weightClass === "전체" ? "" : weightClass,
      p_area_query: areaQuery.trim(),
      p_time_query: timeQuery.trim(),
    });

    if (error) {
      if (isRemoteUnavailable(error)) return null;
      throw error;
    }

    return (data || []).map((row) => mapProfile(row, actorId)).filter(Boolean);
  } catch (error) {
    if (isRemoteUnavailable(error)) return null;
    throw error;
  }
}

export async function fetchMySparringProfile(actorId) {
  const supabase = getSupabase();
  if (!supabase || !actorId) return null;

  try {
    const { data, error } = await supabase.rpc("get_my_dojo_sparring_profile", {
      p_actor_id: actorId,
    });
    if (error) {
      if (isRemoteUnavailable(error)) return null;
      throw error;
    }
    return mapProfile(Array.isArray(data) ? data[0] : data, actorId);
  } catch (error) {
    if (isRemoteUnavailable(error)) return null;
    throw error;
  }
}

export async function saveRemoteSparringProfile({ actorId, profile }) {
  const supabase = getSupabase();
  if (!supabase || !actorId || !profile) return false;

  try {
    const { data, error } = await supabase.rpc("upsert_my_dojo_sparring_profile", {
      p_actor_id: actorId,
      p_profile: {
        nickname: profile.nickname || "복서",
        weight_class: profile.weightClass || "",
        experience: profile.experience || "",
        style: profile.style || "",
        area: profile.area || "",
        meet_when: profile.meetWhen || "",
        note: profile.note || "",
        active: Boolean(profile.active),
      },
    });
    if (error) {
      if (isRemoteUnavailable(error)) return false;
      throw error;
    }
    return Boolean(data);
  } catch (error) {
    if (isRemoteUnavailable(error)) return false;
    throw error;
  }
}

export async function deleteRemoteSparringProfile(actorId) {
  const supabase = getSupabase();
  if (!supabase || !actorId) return false;

  try {
    const { data, error } = await supabase.rpc("delete_my_dojo_sparring_profile", {
      p_actor_id: actorId,
    });
    if (error) {
      if (isRemoteUnavailable(error)) return false;
      throw error;
    }
    return Boolean(data);
  } catch (error) {
    if (isRemoteUnavailable(error)) return false;
    throw error;
  }
}

export async function sendRemoteSparringInterest({ actorId, profileId }) {
  const supabase = getSupabase();
  if (!supabase || !actorId || !profileId) return false;

  try {
    const { data, error } = await supabase.rpc("send_dojo_sparring_interest", {
      p_sender_actor_id: actorId,
      p_recipient_profile_id: profileId,
    });
    if (error) {
      if (isRemoteUnavailable(error)) return false;
      throw error;
    }
    return Boolean(data);
  } catch (error) {
    if (isRemoteUnavailable(error)) return false;
    throw error;
  }
}

export async function cancelRemoteSparringInterest({ actorId, profileId }) {
  const supabase = getSupabase();
  if (!supabase || !actorId || !profileId) return false;

  try {
    const { data, error } = await supabase.rpc("cancel_dojo_sparring_interest", {
      p_sender_actor_id: actorId,
      p_recipient_profile_id: profileId,
    });
    if (error) {
      if (isRemoteUnavailable(error)) return false;
      throw error;
    }
    return Boolean(data);
  } catch (error) {
    if (isRemoteUnavailable(error)) return false;
    throw error;
  }
}

export async function fetchRemoteSparringInterests(actorId) {
  const supabase = getSupabase();
  if (!supabase || !actorId) return null;

  try {
    const { data, error } = await supabase.rpc("list_my_dojo_sparring_interests", {
      p_actor_id: actorId,
    });
    if (error) {
      if (isRemoteUnavailable(error)) return null;
      throw error;
    }
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (isRemoteUnavailable(error)) return null;
    throw error;
  }
}
