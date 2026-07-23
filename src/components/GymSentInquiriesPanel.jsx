import { useEffect, useState } from "react";
import { resolveDojoActorId } from "../api/dojoExchangeApi";
import {
  formatInquiryWhen,
  hasGymInquiryRemote,
  inquiryKindLabel,
  loadSentGymInquiries,
} from "../utils/gymInquiry";
import {
  attachInquiryThreadMeta,
  listInquiryThreadsAsync,
} from "../utils/gymInquiryChat";

export default function GymSentInquiriesPanel({
  userId,
  onClose,
  onOpenChat,
  embedded = false,
  refreshKey = 0,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const remoteReady = hasGymInquiryRemote();

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const myActorId = resolveDojoActorId(userId);
      const [list, threadResult] = await Promise.all([
        loadSentGymInquiries(userId),
        listInquiryThreadsAsync(userId),
      ]);
      setItems(
        attachInquiryThreadMeta(list, threadResult.threads, myActorId)
      );
    } catch {
      setError("보낸 문의를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [userId, refreshKey]);

  return (
    <section className="gym-listing-panel" aria-label="보낸 문의">
      {!embedded && onClose ? (
        <button type="button" className="gym-listing-back" onClick={onClose}>
          ← 목록으로
        </button>
      ) : null}

      <header className="gym-listing-hero">
        <p className="gym-listing-kicker">MY INQUIRIES</p>
        <h2>보낸 문의</h2>
        <p>마지막 메시지와 안 읽은 대화를 확인하세요.</p>
      </header>

      <button
        type="button"
        className="gym-listing-manage-button"
        onClick={refresh}
        disabled={loading}
      >
        새로고침
      </button>

      {!remoteReady ? (
        <p className="gym-listing-sync-hint">서버 연결이 필요합니다.</p>
      ) : null}

      {loading ? (
        <p className="gym-listing-block-note">불러오는 중…</p>
      ) : null}

      {error ? <p className="gym-inquiry-error">{error}</p> : null}

      {!loading && items.length === 0 ? (
        <div className="gym-listing-empty">
          <strong>보낸 문의가 없습니다</strong>
          <p>관 상세에서 「문의하기」를 보내 보세요.</p>
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
            {item.lastPreview ? (
              <p className="gym-inquiry-ledger-preview">{item.lastPreview}</p>
            ) : item.memo ? (
              <p className="gym-inquiry-ledger-memo">{item.memo}</p>
            ) : (
              <p className="gym-inquiry-ledger-preview is-empty">
                아직 대화가 없습니다
              </p>
            )}
            <button
              type="button"
              className="gym-inquiry-button"
              onClick={() => onOpenChat?.(item)}
            >
              {item.unread ? "안 읽은 대화" : "대화하기"}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
