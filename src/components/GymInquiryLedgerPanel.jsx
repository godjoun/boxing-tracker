import { useEffect, useState } from "react";
import { resolveDojoActorId } from "../api/dojoExchangeApi";
import {
  formatInquiryWhen,
  hasGymInquiryRemote,
  inquiryKindLabel,
  loadOwnerGymInquiries,
} from "../utils/gymInquiry";
import {
  attachInquiryThreadMeta,
  listInquiryThreadsAsync,
} from "../utils/gymInquiryChat";
import GymInquiryChatModal from "./GymInquiryChatModal";

export default function GymInquiryLedgerPanel({
  userId,
  nickname = "",
  onClose,
  onOpenManage,
  embedded = false,
  refreshKey = 0,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chatItem, setChatItem] = useState(null);
  const remoteReady = hasGymInquiryRemote();

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const myActorId = resolveDojoActorId(userId);
      const [list, threadResult] = await Promise.all([
        loadOwnerGymInquiries(userId),
        listInquiryThreadsAsync(userId),
      ]);
      setItems(
        attachInquiryThreadMeta(list, threadResult.threads, myActorId)
      );
    } catch {
      setError("문의를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [userId, refreshKey]);

  return (
    <section className="gym-listing-panel" aria-label="받은 문의">
      {!embedded ? (
        <button type="button" className="gym-listing-back" onClick={onClose}>
          ← 목록으로
        </button>
      ) : onClose ? (
        <button type="button" className="gym-listing-back" onClick={onClose}>
          ← 내 등록
        </button>
      ) : null}

      <header className="gym-listing-hero">
        <p className="gym-listing-kicker">INQUIRY LEDGER</p>
        <h2>받은 문의</h2>
        <p>안 읽은 대화가 위로 올라옵니다. 「대화하기」로 답장하세요.</p>
      </header>

      <div className="gym-listing-cta-actions">
        <button
          type="button"
          className="gym-listing-manage-button"
          onClick={refresh}
          disabled={loading}
        >
          새로고침
        </button>
        {onOpenManage ? (
          <button
            type="button"
            className="gym-listing-manage-button"
            onClick={onOpenManage}
          >
            내 등록 관리
          </button>
        ) : null}
      </div>

      {!remoteReady ? (
        <p className="gym-listing-sync-hint">
          서버 연결이 필요합니다. Supabase 설정을 확인해 주세요.
        </p>
      ) : null}

      {!loading && remoteReady && items.length === 0 && !error ? (
        <p className="gym-listing-sync-hint">
          대화·안 읽음까지 쓰려면 <code>dojo_inquiry_chat.sql</code> 과{" "}
          <code>dojo_inquiry_chat_inbox.sql</code> 을 실행해 주세요.
        </p>
      ) : null}

      {loading ? (
        <p className="gym-listing-block-note">불러오는 중…</p>
      ) : null}

      {error ? <p className="gym-inquiry-error">{error}</p> : null}

      {!loading && items.length === 0 ? (
        <div className="gym-listing-empty">
          <strong>아직 받은 문의가 없습니다</strong>
          <p>
            입점한 내 체육관에 다른 사람이 문의하면 여기에 쌓입니다.
          </p>
        </div>
      ) : null}

      <ul className="gym-inquiry-ledger-list">
        {items.map((item) => (
          <li
            key={item.id}
            className={`gym-inquiry-ledger-card${item.unread ? " is-unread" : ""}`}
          >
            <div className="gym-inquiry-ledger-top">
              <span className="gym-inquiry-ledger-kind">
                {inquiryKindLabel(item.kind)}
                {item.unread ? (
                  <span className="gym-inquiry-unread-dot" aria-label="안 읽음" />
                ) : null}
              </span>
              <time>
                {formatInquiryWhen(item.lastMessageAt || item.createdAt)}
              </time>
            </div>
            <strong>{item.gymName || "체육관"}</strong>
            <p className="gym-inquiry-ledger-contact">
              연락{" "}
              {item.contact ? (
                <a href={`tel:${item.contact}`}>{item.contact}</a>
              ) : (
                "없음"
              )}
              {item.nickname ? ` · ${item.nickname}` : ""}
            </p>
            {item.lastPreview ? (
              <p className="gym-inquiry-ledger-preview">{item.lastPreview}</p>
            ) : item.memo ? (
              <p className="gym-inquiry-ledger-memo">{item.memo}</p>
            ) : null}
            {item.preferredDate ? (
              <p>희망일 {item.preferredDate}</p>
            ) : null}
            <button
              type="button"
              className="gym-inquiry-button"
              onClick={() => setChatItem(item)}
            >
              {item.unread ? "안 읽은 대화" : "대화하기"}
            </button>
          </li>
        ))}
      </ul>

      <GymInquiryChatModal
        open={Boolean(chatItem)}
        onClose={() => {
          setChatItem(null);
          refresh();
        }}
        userId={userId}
        nickname={nickname}
        inquiryId={chatItem?.id}
        gymName={chatItem?.gymName || ""}
        inquiryLabel={inquiryKindLabel(chatItem?.kind)}
        acquisitionSource={chatItem?.acquisitionSource || "organic"}
      />
    </section>
  );
}
