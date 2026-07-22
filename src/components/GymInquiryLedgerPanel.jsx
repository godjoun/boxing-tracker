import { useEffect, useState } from "react";
import {
  formatInquiryWhen,
  hasGymInquiryRemote,
  inquiryKindLabel,
  loadOwnerGymInquiries,
} from "../utils/gymInquiry";

export default function GymInquiryLedgerPanel({
  userId,
  onClose,
  onOpenManage,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const remoteReady = hasGymInquiryRemote();

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const list = await loadOwnerGymInquiries(userId);
      setItems(list);
    } catch {
      setError("문의를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [userId]);

  return (
    <section className="gym-listing-panel" aria-label="받은 문의">
      <button type="button" className="gym-listing-back" onClick={onClose}>
        ← 목록으로
      </button>

      <header className="gym-listing-hero">
        <p className="gym-listing-kicker">INQUIRY LEDGER</p>
        <h2>받은 문의</h2>
        <p>
          내가 등록한 체육관으로 온 체험·대여·예약 문의입니다.
          답장은 연락처로 직접 하면 됩니다.
        </p>
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

      {loading ? (
        <p className="gym-listing-block-note">불러오는 중…</p>
      ) : null}

      {error ? <p className="gym-inquiry-error">{error}</p> : null}

      {!loading && items.length === 0 ? (
        <div className="gym-listing-empty">
          <strong>아직 받은 문의가 없습니다</strong>
          <p>
            「입점」으로 올라간 내 체육관에 다른 사람이 문의하기를 보내면
            여기에 쌓입니다. 시드(예시) 체육관 문의는 여기에 안 옵니다.
          </p>
        </div>
      ) : null}

      <ul className="gym-inquiry-ledger-list">
        {items.map((item) => (
          <li key={item.id} className="gym-inquiry-ledger-card">
            <div className="gym-inquiry-ledger-top">
              <span className="gym-inquiry-ledger-kind">
                {inquiryKindLabel(item.kind)}
              </span>
              <time>{formatInquiryWhen(item.createdAt)}</time>
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
            {item.preferredDate ? (
              <p>희망일 {item.preferredDate}</p>
            ) : null}
            {item.timeSlot ? <p>시간 {item.timeSlot}</p> : null}
            {item.partySize ? <p>인원 {item.partySize}명</p> : null}
            {item.hours ? <p>대여 {item.hours}시간</p> : null}
            {item.experience ? <p>경험 {item.experience}</p> : null}
            {item.purpose ? <p>목적 {item.purpose}</p> : null}
            {item.memo ? <p className="gym-inquiry-ledger-memo">{item.memo}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
