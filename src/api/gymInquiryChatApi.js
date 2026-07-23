import { getSupabase, isSupabaseConfigured } from "../lib/supabaseClient";

export function hasInquiryChatRemote() {
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
    message.includes("dojo_inquiry")
  );
}

function mapThread(row) {
  if (!row?.id) return null;
  return {
    id: row.id,
    inquiryId: row.inquiry_id,
    ownerActorId: row.owner_actor_id,
    inquirerActorId: row.inquirer_actor_id,
    ownerNickname: row.owner_nickname || "",
    inquirerNickname: row.inquirer_nickname || "",
    gymName: row.gym_name || "",
    inquiryLabel: row.inquiry_label || "",
    lastMessageAt: row.last_message_at || null,
    lastMessagePreview: row.last_message_preview || "",
    lastSenderActorId: row.last_sender_actor_id || "",
    ownerLastReadAt: row.owner_last_read_at || null,
    inquirerLastReadAt: row.inquirer_last_read_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    source: "server",
  };
}

function mapMessage(row) {
  if (!row?.id) return null;
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

export async function openRemoteInquiryChat({
  inquiryId,
  actorId,
  nickname,
}) {
  const supabase = getSupabase();
  if (!supabase || !inquiryId || !actorId) return null;

  try {
    const { data, error } = await supabase.rpc("open_dojo_inquiry_chat", {
      p_inquiry_id: inquiryId,
      p_actor_id: actorId,
      p_nickname: nickname || "",
    });

    if (error) {
      if (isRemoteUnavailable(error)) return null;
      throw error;
    }
    if (!data) return null;

    const { data: threadRows, error: fetchError } = await supabase.rpc(
      "get_dojo_inquiry_thread",
      {
        p_thread_id: data,
        p_actor_id: actorId,
      }
    );

    if (fetchError) {
      if (isRemoteUnavailable(fetchError)) {
        return { id: data, inquiryId, source: "server" };
      }
      throw fetchError;
    }

    return (
      mapThread(Array.isArray(threadRows) ? threadRows[0] : threadRows) || {
        id: data,
        inquiryId,
        source: "server",
      }
    );
  } catch (error) {
    if (isRemoteUnavailable(error)) return null;
    throw error;
  }
}

export async function fetchRemoteInquiryMessages(threadId, actorId) {
  const supabase = getSupabase();
  if (!supabase || !threadId || !actorId) return null;

  try {
    const { data, error } = await supabase.rpc(
      "list_dojo_inquiry_messages",
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

export async function sendRemoteInquiryChatMessage({
  threadId,
  senderActorId,
  senderNickname,
  body,
}) {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.rpc(
      "send_dojo_inquiry_chat_message",
      {
        p_thread_id: threadId,
        p_sender_actor_id: senderActorId,
        p_sender_nickname: senderNickname || "나",
        p_body: body,
      }
    );

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

export async function fetchSentGymInquiries(actorId) {
  const supabase = getSupabase();
  if (!supabase || !actorId) return [];

  try {
    const { data, error } = await supabase.rpc(
      "list_dojo_gym_inquiries_for_sender",
      { p_actor_id: actorId }
    );

    if (error) {
      if (isRemoteUnavailable(error)) return [];
      throw error;
    }

    return data || [];
  } catch (error) {
    if (isRemoteUnavailable(error)) return [];
    throw error;
  }
}

export async function fetchRemoteInquiryThreads(actorId) {
  const supabase = getSupabase();
  if (!supabase || !actorId) return [];

  try {
    const { data, error } = await supabase.rpc(
      "list_dojo_inquiry_threads_for_actor",
      { p_actor_id: actorId }
    );

    if (error) {
      if (isRemoteUnavailable(error)) return [];
      throw error;
    }

    return (data || []).map(mapThread).filter(Boolean);
  } catch (error) {
    if (isRemoteUnavailable(error)) return [];
    throw error;
  }
}

export async function markRemoteInquiryThreadRead({ threadId, actorId }) {
  const supabase = getSupabase();
  if (!supabase || !threadId || !actorId) return false;

  try {
    const { data, error } = await supabase.rpc(
      "mark_dojo_inquiry_thread_read",
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
