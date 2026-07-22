import { resolveDojoActorId } from "../api/dojoExchangeApi";
import {
  fetchRemoteInquiryMessages,
  hasInquiryChatRemote,
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

export async function listInquiryChatMessagesAsync(threadId) {
  if (!threadId || !hasInquiryChatRemote()) {
    return { messages: [], synced: false };
  }
  const messages = await fetchRemoteInquiryMessages(threadId);
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
