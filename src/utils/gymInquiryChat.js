import { resolveDojoActorId } from "../api/dojoExchangeApi";
import {
  fetchRemoteInquiryMessages,
  fetchRemoteInquiryThreads,
  hasInquiryChatRemote,
  markRemoteInquiryThreadRead,
  openRemoteInquiryChat,
  sendRemoteInquiryChatMessage,
} from "../api/gymInquiryChatApi";

export { hasInquiryChatRemote };

export function peerLabelForInquiryThread(thread, myActorId) {
  if (!thread || !myActorId) return "상대";
  if (myActorId === thread.ownerActorId) {
    return thread.inquirerNickname || "문의자";
  }
  return thread.ownerNickname || "관장";
}

export function isInquiryThreadUnread(thread, myActorId) {
  if (!thread?.lastMessageAt || !myActorId) return false;
  if (thread.lastSenderActorId === myActorId) return false;

  const myReadAt =
    myActorId === thread.ownerActorId
      ? thread.ownerLastReadAt
      : thread.inquirerLastReadAt;

  if (!myReadAt) return true;
  return new Date(thread.lastMessageAt).getTime() > new Date(myReadAt).getTime();
}

export function attachInquiryThreadMeta(inquiries, threads, myActorId) {
  const byInquiry = new Map(
    (threads || []).map((thread) => [thread.inquiryId, thread])
  );

  return (inquiries || [])
    .map((item) => {
      const thread = byInquiry.get(item.id) || null;
      return {
        ...item,
        thread,
        lastPreview: thread?.lastMessagePreview || "",
        lastMessageAt: thread?.lastMessageAt || null,
        unread: isInquiryThreadUnread(thread, myActorId),
      };
    })
    .sort((a, b) => {
      if (a.unread !== b.unread) return a.unread ? -1 : 1;
      const aTime = new Date(a.lastMessageAt || a.createdAt || 0).getTime();
      const bTime = new Date(b.lastMessageAt || b.createdAt || 0).getTime();
      return bTime - aTime;
    });
}

export async function openInquiryChatAsync({
  userId,
  nickname,
  inquiryId,
}) {
  const myActorId = resolveDojoActorId(userId);
  if (!inquiryId || !hasInquiryChatRemote()) {
    return { thread: null, myActorId, synced: false };
  }

  const thread = await openRemoteInquiryChat({
    inquiryId,
    actorId: myActorId,
    nickname: nickname || "",
  });

  return {
    thread,
    myActorId,
    synced: Boolean(thread?.id),
  };
}

export async function listInquiryChatMessagesAsync(threadId, userId) {
  const myActorId = resolveDojoActorId(userId);
  if (!threadId || !myActorId || !hasInquiryChatRemote()) {
    return { messages: [], synced: false };
  }
  const messages = await fetchRemoteInquiryMessages(threadId, myActorId);
  if (!messages) return { messages: [], synced: false };
  return { messages, synced: true };
}

export async function sendInquiryChatMessageAsync({
  userId,
  nickname,
  threadId,
  body,
}) {
  const myActorId = resolveDojoActorId(userId);
  if (!threadId || !body?.trim()) {
    return { ok: false, synced: false };
  }
  if (!hasInquiryChatRemote()) {
    return { ok: false, synced: false };
  }

  const sent = await sendRemoteInquiryChatMessage({
    threadId,
    senderActorId: myActorId,
    senderNickname: nickname || "나",
    body: body.trim(),
  });

  return { ok: Boolean(sent), synced: Boolean(sent) };
}

export async function listInquiryThreadsAsync(userId) {
  const myActorId = resolveDojoActorId(userId);
  if (!myActorId || !hasInquiryChatRemote()) {
    return { threads: [], myActorId, synced: false };
  }

  const threads = await fetchRemoteInquiryThreads(myActorId);
  return {
    threads,
    myActorId,
    synced: true,
  };
}

export async function markInquiryThreadReadAsync({ userId, threadId }) {
  const myActorId = resolveDojoActorId(userId);
  if (!threadId || !myActorId || !hasInquiryChatRemote()) {
    return { ok: false };
  }

  const ok = await markRemoteInquiryThreadRead({
    threadId,
    actorId: myActorId,
  });
  return { ok };
}

export function countUnreadInquiryThreads(threads, myActorId, role) {
  return (threads || []).filter((thread) => {
    if (!isInquiryThreadUnread(thread, myActorId)) return false;
    if (role === "inquirer") return thread.inquirerActorId === myActorId;
    if (role === "owner") return thread.ownerActorId === myActorId;
    return true;
  }).length;
}
