import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import {
  hasDojoChatRemote,
  listChatMessagesAsync,
  openExchangeChatAsync,
  peerLabelForThread,
  sendChatMessageAsync,
} from "../utils/dojoChat";

function formatChatTime(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours < 12 ? "오전" : "오후";
  const h12 = hours % 12 || 12;
  return `${ampm} ${h12}:${minutes}`;
}

export default function ExchangeChatModal({
  open,
  onClose,
  userId,
  nickname = "",
  eventId,
  hostActorId,
  applicantActorId,
  hostNickname = "",
  applicantNickname = "",
  gymName = "",
  eventLabel = "",
}) {
  const [thread, setThread] = useState(null);
  const [myActorId, setMyActorId] = useState("");
  const [messages, setMessages] = useState([]);
  const [synced, setSynced] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  const peerName = peerLabelForThread(thread, myActorId);
  const remoteReady = hasDojoChatRemote();

  const loadMessages = useCallback(async (threadId) => {
    if (!threadId) return;
    const result = await listChatMessagesAsync(threadId);
    setMessages(result.messages);
    setSynced(result.synced);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    let cancelled = false;

    async function boot() {
      setLoading(true);
      setError("");
      setDraft("");
      try {
        const opened = await openExchangeChatAsync({
          userId,
          eventId,
          hostActorId,
          applicantActorId,
          hostNickname,
          applicantNickname,
          gymName,
          eventLabel,
        });

        if (cancelled) return;

        if (!opened.thread) {
          setError("대화를 열 수 없습니다.");
          setThread(null);
          return;
        }

        setThread(opened.thread);
        setMyActorId(opened.myActorId);
        setSynced(opened.synced);
        await loadMessages(opened.thread.id);
        track("dojo_chat_open", { eventId, synced: opened.synced });
      } catch {
        if (!cancelled) setError("대화를 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    boot();
    return () => {
      cancelled = true;
    };
  }, [
    open,
    userId,
    eventId,
    hostActorId,
    applicantActorId,
    hostNickname,
    applicantNickname,
    gymName,
    eventLabel,
    loadMessages,
  ]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, loading]);

  async function handleSend(event) {
    event.preventDefault();
    if (sending || !thread?.id || !draft.trim()) return;

    setSending(true);
    setError("");
    try {
      const result = await sendChatMessageAsync({
        threadId: thread.id,
        userId,
        nickname,
        body: draft,
      });

      if (!result.ok) {
        setError("메시지를 보내지 못했습니다.");
        return;
      }

      setDraft("");
      track("dojo_chat_send", { synced: result.synced });
      await loadMessages(thread.id);
      setSynced(result.synced || synced);
    } catch {
      setError("메시지를 보내지 못했습니다.");
    } finally {
      setSending(false);
    }
  }

  async function handleRefresh() {
    if (!thread?.id || loading) return;
    setLoading(true);
    try {
      await loadMessages(thread.id);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="gym-inquiry-overlay" role="presentation" onClick={onClose}>
      <div
        className="exchange-chat-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exchange-chat-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="exchange-chat-header">
          <div>
            <p className="gym-inquiry-kicker">MEETUP CHAT</p>
            <h2 id="exchange-chat-title">{peerName}</h2>
            <p className="exchange-chat-meta">
              {[gymName, eventLabel].filter(Boolean).join(" · ") || "모임 대화"}
            </p>
          </div>
          <div className="exchange-chat-header-actions">
            <button
              type="button"
              className="exchange-chat-refresh"
              onClick={handleRefresh}
              disabled={loading}
            >
              새로고침
            </button>
            <button type="button" className="gym-inquiry-close" onClick={onClose}>
              닫기
            </button>
          </div>
        </header>

        <p className="exchange-chat-note">
          {remoteReady
            ? synced
              ? "메시지는 서버에 저장됩니다. 상대는 새로고침하면 볼 수 있어요."
              : "서버 미연결 — 이 기기에만 저장됩니다. (SQL 실행 필요할 수 있음)"
            : "Supabase 연결 후 다른 폰에서도 보입니다."}
        </p>

        <div className="exchange-chat-body">
          {loading ? (
            <p className="exchange-chat-empty">불러오는 중…</p>
          ) : messages.length === 0 ? (
            <p className="exchange-chat-empty">
              첫 메시지를 남겨 일정을 맞춰 보세요.
            </p>
          ) : (
            messages.map((item) => {
              const mine = item.senderActorId === myActorId;
              return (
                <div
                  key={item.id}
                  className={`exchange-chat-bubble${mine ? " is-mine" : ""}`}
                >
                  {!mine ? (
                    <span className="exchange-chat-sender">
                      {item.senderNickname || "상대"}
                    </span>
                  ) : null}
                  <p>{item.body}</p>
                  <time>{formatChatTime(item.createdAt)}</time>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form className="exchange-chat-composer" onSubmit={handleSend}>
          {error ? <p className="gym-inquiry-error">{error}</p> : null}
          <div className="exchange-chat-composer-row">
            <input
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="메시지 입력"
              maxLength={500}
              disabled={sending || !thread}
              enterKeyHint="send"
            />
            <button type="submit" disabled={sending || !draft.trim() || !thread}>
              {sending ? "…" : "보내기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
