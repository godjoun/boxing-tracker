import {
  fetchRemoteMessages,
  fetchRemoteThreadsForActor,
  hasDojoChatRemote,
  openRemoteChatThread,
  resolveDojoActorId,
  sendRemoteChatMessage,
} from "../api/dojoChatApi";

const THREADS_KEY = "fitness-league-dojo-chat-threads";
const MESSAGES_KEY = "fitness-league-dojo-chat-messages";

export { hasDojoChatRemote, resolveDojoActorId };

function readJson(key, fallback = []) {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "null");
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function localThreadKey(eventId, hostActorId, applicantActorId) {
  return `${eventId}:${hostActorId}:${applicantActorId}`;
}

function upsertLocalThread(thread) {
  const next = [
    thread,
    ...readJson(THREADS_KEY).filter((item) => item.id !== thread.id),
  ].slice(0, 40);
  writeJson(THREADS_KEY, next);
  return thread;
}

function appendLocalMessage(message) {
  const next = [...readJson(MESSAGES_KEY), message].slice(-200);
  writeJson(MESSAGES_KEY, next);
  return message;
}

export function peerLabelForThread(thread, myActorId) {
  if (!thread) return "상대";
  if (thread.hostActorId === myActorId) {
    return thread.applicantNickname || "신청자";
  }
  return thread.hostNickname || "주최자";
}

export async function openExchangeChatAsync({
  userId,
  eventId,
  hostActorId,
  applicantActorId,
  hostNickname = "",
  applicantNickname = "",
  gymName = "",
  eventLabel = "",
}) {
  const myActorId = resolveDojoActorId(userId);
  if (!eventId || !hostActorId || !applicantActorId) {
    return { thread: null, synced: false, myActorId };
  }

  if (hasDojoChatRemote()) {
    const remote = await openRemoteChatThread({
      eventId,
      hostActorId,
      applicantActorId,
      hostNickname,
      applicantNickname,
      gymName,
      eventLabel,
    });

    if (remote?.id) {
      upsertLocalThread(remote);
      return { thread: remote, synced: true, myActorId };
    }
  }

  const localId = localThreadKey(eventId, hostActorId, applicantActorId);
  const existing = readJson(THREADS_KEY).find(
    (item) =>
      item.eventId === eventId &&
      item.hostActorId === hostActorId &&
      item.applicantActorId === applicantActorId
  );

  const thread =
    existing ||
    upsertLocalThread({
      id: localId,
      eventId,
      hostActorId,
      applicantActorId,
      hostNickname,
      applicantNickname,
      gymName,
      eventLabel,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: "local",
    });

  return { thread, synced: false, myActorId };
}

export async function listChatMessagesAsync(threadId) {
  if (!threadId) return { messages: [], synced: false };

  if (hasDojoChatRemote() && !String(threadId).includes(":")) {
    const remote = await fetchRemoteMessages(threadId);
    if (remote) {
      const locals = readJson(MESSAGES_KEY).filter(
        (item) => item.threadId !== threadId
      );
      writeJson(MESSAGES_KEY, [
        ...locals,
        ...remote.map((item) => ({ ...item, source: "server" })),
      ]);
      return { messages: remote, synced: true };
    }
  }

  return {
    messages: readJson(MESSAGES_KEY)
      .filter((item) => item.threadId === threadId)
      .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt))),
    synced: false,
  };
}

export async function sendChatMessageAsync({
  threadId,
  userId,
  nickname,
  body,
}) {
  const trimmed = String(body || "").trim();
  if (!threadId || !trimmed) {
    return { ok: false, synced: false };
  }

  const senderActorId = resolveDojoActorId(userId);
  const message = {
    id: crypto.randomUUID(),
    threadId,
    senderActorId,
    senderNickname: nickname || "나",
    body: trimmed.slice(0, 500),
    createdAt: new Date().toISOString(),
    source: "local",
  };

  if (hasDojoChatRemote() && !String(threadId).includes(":")) {
    const remoteId = await sendRemoteChatMessage({
      threadId,
      senderActorId,
      senderNickname: nickname || "나",
      body: trimmed,
    });

    if (remoteId) {
      appendLocalMessage({
        ...message,
        id: typeof remoteId === "string" ? remoteId : message.id,
        source: "server",
      });
      return { ok: true, synced: true, message };
    }
  }

  appendLocalMessage(message);
  const threads = readJson(THREADS_KEY).map((item) =>
    item.id === threadId
      ? { ...item, updatedAt: new Date().toISOString() }
      : item
  );
  writeJson(THREADS_KEY, threads);
  return { ok: true, synced: false, message };
}

export async function listMyChatThreadsAsync(userId) {
  const myActorId = resolveDojoActorId(userId);

  if (hasDojoChatRemote()) {
    const remote = await fetchRemoteThreadsForActor(myActorId);
    if (remote) {
      writeJson(THREADS_KEY, remote);
      return { threads: remote, synced: true, myActorId };
    }
  }

  return {
    threads: readJson(THREADS_KEY)
      .filter(
        (item) =>
          item.hostActorId === myActorId ||
          item.applicantActorId === myActorId
      )
      .sort((a, b) =>
        String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""))
      ),
    synced: false,
    myActorId,
  };
}
