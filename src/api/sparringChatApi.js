import { getSupabase, isSupabaseConfigured } from "../lib/supabaseClient";

export function hasSparringChatRemote() {
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
    message.includes("dojo_sparring")
  );
}

function mapThread(row) {
  if (!row?.id) return null;
  return {
    id: row.id,
    peerProfileId: row.peer_profile_id,
    peerNickname: row.peer_nickname || "라이벌",
    peerWeightClass: row.peer_weight_class || "",
    peerArea: row.peer_area || "",
    peerMeetWhen: row.peer_meet_when || "",
    lastMessageAt: row.last_message_at || null,
    lastMessagePreview: row.last_message_preview || "",
    lastSenderActorId: row.last_sender_actor_id || "",
    myLastReadAt: row.my_last_read_at || null,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

function mapMessage(row) {
  if (!row?.id) return null;
  return {
    id: row.id,
    threadId: row.thread_id,
    senderActorId: row.sender_actor_id,
    senderNickname: row.sender_nickname || "복서",
    body: row.body || "",
    createdAt: row.created_at,
  };
}

export async function openRemoteSparringChat({ actorId, peerProfileId }) {
  const supabase = getSupabase();
  if (!supabase || !actorId || !peerProfileId) return null;

  try {
    const { data: threadId, error: openError } = await supabase.rpc(
      "open_dojo_sparring_chat",
      {
        p_actor_id: actorId,
        p_peer_profile_id: peerProfileId,
      }
    );

    if (openError) {
      if (isRemoteUnavailable(openError)) return null;
      throw openError;
    }
    if (!threadId) return null;

    const { data, error } = await supabase.rpc("get_dojo_sparring_thread", {
      p_thread_id: threadId,
      p_actor_id: actorId,
    });
    if (error) {
      if (isRemoteUnavailable(error)) return null;
      throw error;
    }

    return mapThread(Array.isArray(data) ? data[0] : data);
  } catch (error) {
    if (isRemoteUnavailable(error)) return null;
    throw error;
  }
}

export async function fetchRemoteSparringMessages(threadId, actorId) {
  const supabase = getSupabase();
  if (!supabase || !threadId || !actorId) return null;

  try {
    const { data, error } = await supabase.rpc(
      "list_dojo_sparring_messages",
      {
        p_thread_id: threadId,
        p_actor_id: actorId,
      }
    );
    if (error) {
      if (isRemoteUnavailable(error)) return null;
      throw error;
    }
    return (data || []).map(mapMessage).filter(Boolean);
  } catch (error) {
    if (isRemoteUnavailable(error)) return null;
    throw error;
  }
}

export async function sendRemoteSparringChatMessage({
  threadId,
  actorId,
  nickname,
  body,
}) {
  const supabase = getSupabase();
  if (!supabase || !threadId || !actorId || !body?.trim()) return false;

  try {
    const { data, error } = await supabase.rpc(
      "send_dojo_sparring_chat_message",
      {
        p_thread_id: threadId,
        p_sender_actor_id: actorId,
        p_sender_nickname: nickname || "복서",
        p_body: body.trim(),
      }
    );
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

export async function markRemoteSparringThreadRead({ threadId, actorId }) {
  const supabase = getSupabase();
  if (!supabase || !threadId || !actorId) return false;

  try {
    const { data, error } = await supabase.rpc(
      "mark_dojo_sparring_thread_read",
      {
        p_thread_id: threadId,
        p_actor_id: actorId,
      }
    );
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
