import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import {
  hasInquiryChatRemote,
  listInquiryChatMessagesAsync,
  openInquiryChatAsync,
  peerLabelForInquiryThread,
  sendInquiryChatMessageAsync,
} from "../utils/gymInquiryChat";

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

/** 문의 대화 · 4초 폴링(가벼운 실시간) */
export default function GymInquiryChatModal({
  open,
  onClose,
  userId,
  nickname = "",
  inquiryId,
  gymName = "",
  inquiryLabel = "",
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
  const threadIdRef = useRef("");

  const peerName = peerLabelForInquiryThread(thread, myActorId);
  const remoteReady = hasInquiryChatRemote();

  const loadMessages = useCallback(async (threadId) => {
    if (!threadId) return;
    const result = await listInquiryChatMessagesAsync(threadId);
    setMessages(result.messages);
    setSynced(result.synced);
  }, []);

  useEffect(() => {
    if (!open || !inquiryId) return undefined;

    let cancelled = false;

    async function boot() {
      setLoading(true);
      setError("");
      setDraft("");
      try {
        const opened = await openInquiryChatAsync({
          userId,
          nickname,
          inquiryId,
        });

        if (cancelled) return;

        if (!opened.thread) {
          setError(
            "대화를 열 수 없습니다. 입점 관 문의인지, dojo_inquiry_chat.sql 실행 여부를 확인해 주세요."
          );
          setThread(null);
          threadIdRef.current = "";
          return;
        }

        setThread(opened.thread);
        setMyActorId(opened.myActorId);
        setSynced(opened.synced);
        threadIdRef.current = opened.thread.id;
        await loadMessages(opened.thread.id);
        track("gym_inquiry_chat_open", {
          inquiryId,
          synced: opened.synced,
        });
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
  }, [open, userId, nickname, inquiryId, loadMessages]);

  useEffect(() => {
    if (!open) return undefined;
    const timer = window.setInterval(() => {
      if (threadIdRef.current) {
        loadMessages(threadIdRef.current);
      }
    }, 4000);
    return () => window.clearInterval(timer);
  }, [open, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, loading]);

  async function handleSend(event) {
    event.preventDefault();
    if (sending || !thread?.id || !draft.trim()) return;

    setSending(true);
    setError("");
    try {
      const result = await sendInquiryChatMessageAsync({
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
      track("gym_inquiry_chat_send", { synced: result.synced });
      await loadMessages(thread.id);
      setSynced(result.synced || synced);
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
        aria-labelledby="inquiry-chat-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="exchange-chat-header">
          <div>
            <p className="gym-inquiry-kicker">INQUIRY CHAT</p>
            <h2 id="inquiry-chat-title">{peerName}</h2>
            <p className="exchange-chat-meta">
              {[gymName, inquiryLabel].filter(Boolean).join(" · ") ||
                "체육관 문의"}
            </p>
          </div>
          <button type="button" className="gym-inquiry-close" onClick={onClose}>
            닫기
          </button>
        </header>

        <p className="exchange-chat-note">
          {remoteReady
            ? synced
              ? "약 4초마다 새 메시지를 불러옵니다. (가벼운 실시간)"
              : "서버 미연결 — dojo_inquiry_chat.sql 실행이 필요할 수 있어요."
            : "Supabase 연결이 필요합니다."}
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
