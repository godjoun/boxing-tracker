import { getSupabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { resolveDojoActorId } from "./dojoExchangeApi";

export { resolveDojoActorId };

export function hasDojoChatRemote() {
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
    message.includes("dojo_chat")
  );
}

function mapThread(row) {
  return {
    id: row.id,
    eventId: row.event_id,
    hostActorId: row.host_actor_id,
    applicantActorId: row.applicant_actor_id,
    hostNickname: row.host_nickname || "",
    applicantNickname: row.applicant_nickname || "",
    gymName: row.gym_name || "",
    eventLabel: row.event_label || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    source: "server",
  };
}

function mapMessage(row) {
  return {
    id: row.id,
    threadId: row.thread_id,
    senderActorId: row.sender_actor_id,
    senderNickname: row.sender_nickname || "나",
    body: row.body || "",
    createdAt: row.created_at,
    source: "server",
  };
}

export async function openRemoteChatThread(params) {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.rpc("open_dojo_chat_thread", {
      p_event_id: params.eventId,
      p_host_actor_id: params.hostActorId,
      p_applicant_actor_id: params.applicantActorId,
      p_host_nickname: params.hostNickname || "",
      p_applicant_nickname: params.applicantNickname || "",
      p_gym_name: params.gymName || "",
      p_event_label: params.eventLabel || "",
    });

    if (error) {
      if (isRemoteUnavailable(error)) return null;
      throw error;
    }

    if (!data) return null;

    const { data: thread, error: fetchError } = await supabase
      .from("dojo_chat_threads")
      .select("*")
      .eq("id", data)
      .maybeSingle();

    if (fetchError) {
      if (isRemoteUnavailable(fetchError)) {
        return {
          id: data,
          eventId: params.eventId,
          hostActorId: params.hostActorId,
          applicantActorId: params.applicantActorId,
          hostNickname: params.hostNickname || "",
          applicantNickname: params.applicantNickname || "",
          gymName: params.gymName || "",
          eventLabel: params.eventLabel || "",
          source: "server",
        };
      }
      throw fetchError;
    }

    return thread ? mapThread(thread) : { id: data, source: "server", ...params };
  } catch (error) {
    if (isRemoteUnavailable(error)) return null;
    throw error;
  }
}

export async function fetchRemoteThreadsForActor(actorId) {
  const supabase = getSupabase();
  if (!supabase || !actorId) return null;

  try {
    const { data, error } = await supabase
      .from("dojo_chat_threads")
      .select("*")
      .or(`host_actor_id.eq.${actorId},applicant_actor_id.eq.${actorId}`)
      .order("updated_at", { ascending: false })
      .limit(40);

    if (error) {
      if (isRemoteUnavailable(error)) return null;
      throw error;
    }

    return (data || []).map(mapThread);
  } catch (error) {
    if (isRemoteUnavailable(error)) return null;
    throw error;
  }
}

export async function fetchRemoteMessages(threadId) {
  const supabase = getSupabase();
  if (!supabase || !threadId) return null;

  try {
    const { data, error } = await supabase
      .from("dojo_chat_messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true })
      .limit(120);

    if (error) {
      if (isRemoteUnavailable(error)) return null;
      throw error;
    }

    return (data || []).map(mapMessage);
  } catch (error) {
    if (isRemoteUnavailable(error)) return null;
    throw error;
  }
}

export async function sendRemoteChatMessage({
  threadId,
  senderActorId,
  senderNickname,
  body,
}) {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.rpc("send_dojo_chat_message", {
      p_thread_id: threadId,
      p_sender_actor_id: senderActorId,
      p_sender_nickname: senderNickname || "나",
      p_body: body,
    });

    if (error) {
      if (isRemoteUnavailable(error)) return null;
      throw error;
    }

    return data || true;
  } catch (error) {
    if (isRemoteUnavailable(error)) return null;
    throw error;
  }
}
