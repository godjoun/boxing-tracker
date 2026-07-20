import { getSupabase, isSupabaseConfigured } from "../lib/supabaseClient";

const ACTOR_KEY = "fitness-league-dojo-actor-id";

function isGuestUserId(userId) {
  return (
    !userId ||
    userId === "local-user" ||
    userId === "dev-local-user"
  );
}

/** 게스트는 기기마다 다른 actor id — 신청·내 일정 구분용 */
export function resolveDojoActorId(userId) {
  if (!isGuestUserId(userId)) {
    return String(userId);
  }

  if (typeof localStorage === "undefined") {
    return userId || "local-user";
  }

  try {
    const existing = localStorage.getItem(ACTOR_KEY);
    if (existing) return existing;

    const next = crypto.randomUUID();
    localStorage.setItem(ACTOR_KEY, next);
    return next;
  } catch {
    return userId || "local-user";
  }
}

export function hasDojoExchangeRemote() {
  return isSupabaseConfigured && Boolean(getSupabase());
}

function mapRemoteEvent(row, actorId) {
  return {
    id: row.id,
    userId: row.user_id,
    hostNickname: row.host_nickname || "",
    title: row.title || "",
    gymName: row.gym_name,
    address: row.address,
    startsAt: row.starts_at,
    capacity: row.capacity,
    feeWon: row.fee_won,
    note: row.note || "",
    appliedCount: row.applied_count || 0,
    createdAt: row.created_at,
    source: "server",
    isSample: false,
    isMine: Boolean(actorId && row.user_id === actorId),
  };
}

function mapRemoteApply(row) {
  return {
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id,
    nickname: row.nickname || "나",
    createdAt: row.created_at,
    source: "server",
  };
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
    message.includes("dojo_exchange")
  );
}

export async function fetchRemoteExchangeEvents(actorId) {
  const supabase = getSupabase();
  if (!supabase) return null;

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  try {
    const { data, error } = await supabase
      .from("dojo_exchange_events")
      .select("*")
      .gte("starts_at", since)
      .order("starts_at", { ascending: true })
      .limit(60);

    if (error) {
      if (isRemoteUnavailable(error)) return null;
      throw error;
    }

    return (data || []).map((row) => mapRemoteEvent(row, actorId));
  } catch (error) {
    if (isRemoteUnavailable(error)) return null;
    throw error;
  }
}

export async function fetchRemotePastExchangeEvents(actorId) {
  const supabase = getSupabase();
  if (!supabase) return null;

  const now = new Date().toISOString();

  try {
    const { data, error } = await supabase
      .from("dojo_exchange_events")
      .select("*")
      .lt("starts_at", now)
      .order("starts_at", { ascending: false })
      .limit(40);

    if (error) {
      if (isRemoteUnavailable(error)) return null;
      throw error;
    }

    return (data || []).map((row) => mapRemoteEvent(row, actorId));
  } catch (error) {
    if (isRemoteUnavailable(error)) return null;
    throw error;
  }
}

export async function fetchRemoteAppliesForActor(actorId) {
  const supabase = getSupabase();
  if (!supabase || !actorId) return null;

  try {
    const { data, error } = await supabase
      .from("dojo_exchange_applies")
      .select("*")
      .eq("user_id", actorId)
      .order("created_at", { ascending: false })
      .limit(80);

    if (error) {
      if (isRemoteUnavailable(error)) return null;
      throw error;
    }

    return (data || []).map(mapRemoteApply);
  } catch (error) {
    if (isRemoteUnavailable(error)) return null;
    throw error;
  }
}

export async function fetchRemoteAppliesForEvent(eventId) {
  const supabase = getSupabase();
  if (!supabase || !eventId) return null;

  try {
    const { data, error } = await supabase
      .from("dojo_exchange_applies")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false })
      .limit(40);

    if (error) {
      if (isRemoteUnavailable(error)) return null;
      throw error;
    }

    return (data || []).map(mapRemoteApply);
  } catch (error) {
    if (isRemoteUnavailable(error)) return null;
    throw error;
  }
}

export async function insertRemoteExchangeEvent(event, actorId) {
  const supabase = getSupabase();
  if (!supabase || !actorId) return null;

  const payload = {
    id: event.id,
    user_id: actorId,
    host_nickname: event.hostNickname || "",
    title: event.title || "",
    gym_name: event.gymName,
    address: event.address,
    starts_at: event.startsAt,
    capacity: event.capacity,
    fee_won: event.feeWon,
    note: event.note || "",
    applied_count: 0,
  };

  try {
    const { data, error } = await supabase
      .from("dojo_exchange_events")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      if (isRemoteUnavailable(error)) return null;
      throw error;
    }

    return mapRemoteEvent(data, actorId);
  } catch (error) {
    if (isRemoteUnavailable(error)) return null;
    throw error;
  }
}

export async function deleteRemoteExchangeEvent(eventId, actorId) {
  const supabase = getSupabase();
  if (!supabase || !eventId || !actorId) return false;

  try {
    const { error, count } = await supabase
      .from("dojo_exchange_events")
      .delete({ count: "exact" })
      .eq("id", eventId)
      .eq("user_id", actorId);

    if (error) {
      if (isRemoteUnavailable(error)) return false;
      throw error;
    }

    return (count ?? 1) > 0;
  } catch (error) {
    if (isRemoteUnavailable(error)) return false;
    throw error;
  }
}

export async function applyRemoteExchange(eventId, actorId, nickname) {
  const supabase = getSupabase();
  if (!supabase || !eventId || !actorId) return null;

  try {
    const { data, error } = await supabase.rpc("apply_dojo_exchange", {
      p_event_id: eventId,
      p_user_id: actorId,
      p_nickname: nickname || "나",
    });

    if (error) {
      if (isRemoteUnavailable(error)) return null;
      throw error;
    }

    return Boolean(data);
  } catch (error) {
    if (isRemoteUnavailable(error)) return null;
    throw error;
  }
}

export async function cancelRemoteExchangeApply(eventId, actorId) {
  const supabase = getSupabase();
  if (!supabase || !eventId || !actorId) return null;

  try {
    const { data, error } = await supabase.rpc("cancel_dojo_exchange_apply", {
      p_event_id: eventId,
      p_user_id: actorId,
    });

    if (error) {
      if (isRemoteUnavailable(error)) return null;
      throw error;
    }

    return Boolean(data);
  } catch (error) {
    if (isRemoteUnavailable(error)) return null;
    throw error;
  }
}
