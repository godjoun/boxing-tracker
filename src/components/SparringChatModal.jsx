import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import {
  fetchRemoteSparringMessages,
  hasSparringChatRemote,
  markRemoteSparringThreadRead,
  openRemoteSparringChat,
  sendRemoteSparringChatMessage,
} from "../api/sparringChatApi";

function formatChatTime(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours < 12 ? "오전" : "오후"} ${hours % 12 || 12}:${minutes}`;
}

/** 상호 관심이 성립한 라이벌 대화 · 4초 폴링 */
export default function SparringChatModal({
  open,
  onClose,
  actorId,
  nickname = "",
  peerProfileId,
  peerName = "라이벌",
  peerMeta = "",
}) {
  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [synced, setSynced] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const threadIdRef = useRef("");
  const remoteReady = hasSparringChatRemote();

  const loadMessages = useCallback(
    async (threadId, options = {}) => {
      if (!threadId) return;
      const next = await fetchRemoteSparringMessages(threadId, actorId);
      setMessages(next || []);
      setSynced(Boolean(next));
      if (options.markRead) {
        await markRemoteSparringThreadRead({ threadId, actorId });
      }
    },
    [actorId]
  );

  useEffect(() => {
    if (!open || !peerProfileId || !actorId) return undefined;
    let cancelled = false;

    async function boot() {
      setLoading(true);
      setError("");
      setDraft("");
      try {
        const opened = await openRemoteSparringChat({
          actorId,
          peerProfileId,
        });
        if (cancelled) return;

        if (!opened) {
          setThread(null);
          setSynced(false);
          threadIdRef.current = "";
          setError(
            "대화를 열 수 없습니다. 서로 관심이 유지 중인지, dojo_sparring_chat.sql 실행 여부를 확인해 주세요."
          );
          return;
        }

        setThread(opened);
        setSynced(true);
        threadIdRef.current = opened.id;
        await loadMessages(opened.id, { markRead: true });
        track("sparring_chat_open", { peerProfileId });
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
  }, [actorId, loadMessages, open, peerProfileId]);

  useEffect(() => {
    if (!open) return undefined;
    const timer = window.setInterval(() => {
      if (threadIdRef.current) {
        loadMessages(threadIdRef.current, { markRead: true });
      }
    }, 4000);
    return () => window.clearInterval(timer);
  }, [loadMessages, open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [loading, messages.length]);

  async function handleSend(event) {
    event.preventDefault();
    if (sending || !thread?.id || !draft.trim()) return;

    setSending(true);
    setError("");
    try {
      const sent = await sendRemoteSparringChatMessage({
        threadId: thread.id,
        actorId,
        nickname,
        body: draft,
      });
      if (!sent) {
        setError("메시지를 보내지 못했습니다. 서로의 관심 상태를 확인해 주세요.");
        return;
      }

      setDraft("");
      track("sparring_chat_send", { peerProfileId });
      await loadMessages(thread.id);
      setSynced(true);
    } catch {
      setError("메시지를 보내지 못했습니다.");
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  return (
    <div className="gym-inquiry-overlay" role="presentation" onClick={onClose}>
      <div
        className="exchange-chat-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sparring-chat-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="exchange-chat-header">
          <div>
            <p className="gym-inquiry-kicker">RIVAL CHAT</p>
            <h2 id="sparring-chat-title">
              {thread?.peerNickname || peerName}
            </h2>
            <p className="exchange-chat-meta">
              {peerMeta || "서로 관심이 확인된 라이벌"}
            </p>
          </div>
          <button type="button" className="gym-inquiry-close" onClick={onClose}>
            닫기
          </button>
        </header>

        <p className="exchange-chat-note">
          {remoteReady
            ? synced
              ? "서로 관심이 확인됐습니다. 약 4초마다 새 메시지를 불러옵니다."
              : "서버 미연결 — dojo_sparring_chat.sql 실행이 필요할 수 있어요."
            : "Supabase 연결이 필요합니다."}
        </p>

        <div className="exchange-chat-body">
          {loading ? (
            <p className="exchange-chat-empty">불러오는 중…</p>
          ) : messages.length === 0 ? (
            <p className="exchange-chat-empty">
              첫 메시지를 남겨 스파링 일정을 맞춰 보세요.
            </p>
          ) : (
            messages.map((message) => {
              const mine = message.senderActorId === actorId;
              return (
                <div
                  key={message.id}
                  className={`exchange-chat-bubble${mine ? " is-mine" : ""}`}
                >
                  {!mine ? (
                    <span className="exchange-chat-sender">
                      {message.senderNickname}
                    </span>
                  ) : null}
                  <p>{message.body}</p>
                  <time>{formatChatTime(message.createdAt)}</time>
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
