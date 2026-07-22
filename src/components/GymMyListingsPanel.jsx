import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";
import {
  deleteGymListingAsync,
  listingStatusLabel,
  loadMyGymListings,
} from "../utils/gymListing";

export default function GymMyListingsPanel({
  userId,
  nickname = "",
  onClose,
  onCreate,
  onEdit,
  onOpenLedger,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const list = await loadMyGymListings(userId);
      setItems(list);
    } catch {
      setError("목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [userId]);

  async function handleDelete(listing) {
    if (!listing?.id || busyId) return;
    const ok = window.confirm(
      `「${listing.gymName}」 등록을 삭제할까요?\n검색에서도 사라집니다.`
    );
    if (!ok) return;

    setBusyId(listing.id);
    setError("");
    try {
      const result = await deleteGymListingAsync(listing.id, { userId });
      track("gym_listing_delete", { synced: result.synced });
      await refresh();
    } catch {
      setError("삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <section className="gym-listing-panel" aria-label="내 등록 관리">
      <button type="button" className="gym-listing-back" onClick={onClose}>
        ← 목록으로
      </button>

      <header className="gym-listing-hero">
        <p className="gym-listing-kicker">MY LISTINGS</p>
        <h2>내 등록 관리</h2>
        <p>
          이 기기에서 신청한 체육관을 수정·삭제합니다.
          {nickname ? ` (${nickname})` : ""}
        </p>
      </header>

      <button type="button" className="gym-listing-submit" onClick={onCreate}>
        새 체육관 등록
      </button>

      {onOpenLedger ? (
        <button
          type="button"
          className="gym-listing-manage-button"
          onClick={onOpenLedger}
        >
          받은 문의 보기
        </button>
      ) : null}

      {loading ? (
        <p className="gym-listing-block-note">불러오는 중…</p>
      ) : null}

      {error ? <p className="gym-inquiry-error">{error}</p> : null}

      {!loading && items.length === 0 ? (
        <div className="gym-listing-empty">
          <strong>아직 등록한 체육관이 없습니다</strong>
          <p>「새 체육관 등록」으로 입점 신청을 남겨 보세요.</p>
        </div>
      ) : null}

      <ul className="gym-my-listing-list">
        {items.map((item) => (
          <li key={item.id} className="gym-my-listing-card">
            {item.photoUrl ? (
              <img
                className="gym-my-listing-thumb"
                src={item.photoUrl}
                alt=""
              />
            ) : (
              <div className="gym-my-listing-thumb is-empty" aria-hidden="true">
                사진 없음
              </div>
            )}
            <div className="gym-my-listing-body">
              <div className="gym-my-listing-top">
                <strong>{item.gymName}</strong>
                <span
                  className={`gym-my-listing-status is-${item.status || "pending"}`}
                >
                  {listingStatusLabel(item.status)}
                </span>
              </div>
              <p>{item.address}</p>
              <div className="gym-my-listing-actions">
                <button
                  type="button"
                  className="gym-inquiry-button"
                  onClick={() => onEdit?.(item)}
                  disabled={Boolean(busyId)}
                >
                  수정
                </button>
                <button
                  type="button"
                  className="gym-inquiry-button gym-inquiry-button-secondary"
                  onClick={() => handleDelete(item)}
                  disabled={busyId === item.id}
                >
                  {busyId === item.id ? "삭제 중…" : "삭제"}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
