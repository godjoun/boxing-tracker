import { useCallback, useEffect, useState } from "react";
import { track } from "@vercel/analytics";
import {
  deleteGymListingAsync,
  coverGymPhoto,
  hasGymListingRemote,
  listingStatusLabel,
  loadMyGymListings,
  normalizeGymPhotoUrls,
  syncGymListingToServer,
} from "../utils/gymListing";

function statusHint(item, isLocalOnly) {
  if (isLocalOnly) {
    return "아직 서버에 안 올라갔습니다. 「서버로 보내기」를 눌러 주세요.";
  }
  if (item.status === "approved") {
    return "찾기 검색에 노출 중입니다.";
  }
  if (item.status === "rejected") {
    return "반려되었습니다. 수정 후 다시 신청해 주세요.";
  }
  return "승인 대기 중 · 본인 찾기에는 미리 보입니다.";
}

export default function GymMyListingsPanel({
  userId,
  nickname = "",
  onClose,
  onCreate,
  onEdit,
  onOpenLedger,
  embedded = false,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
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
  }, [userId]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      refresh();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [refresh]);

  const remoteReady = hasGymListingRemote();

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

  async function handleResync(listing) {
    if (!listing?.id || busyId) return;
    setBusyId(listing.id);
    setError("");
    try {
      const result = await syncGymListingToServer(listing);
      track("gym_listing_resync", { synced: result.synced });
      if (!result.ok) {
        setError(result.message || "서버로 보내지 못했습니다.");
      }
      await refresh();
    } catch {
      setError("서버 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <section className="gym-listing-panel gym-owner-panel" aria-label="체육관 등록 관리">
      {!embedded && onClose ? (
        <button type="button" className="gym-listing-back" onClick={onClose}>
          ← 목록으로
        </button>
      ) : null}

      <header className="gym-owner-hero">
        <p className="gym-listing-kicker">GYM LISTINGS</p>
        <h2>체육관 등록·관리</h2>
        <p>
          장소 제보와 관장 입점 신청을 확인합니다.
          {nickname ? ` · ${nickname}` : ""}
        </p>
        {!remoteReady ? (
          <p className="gym-listing-sync-hint">
            서버 연결이 없어 지금은 이 기기에만 저장됩니다.
          </p>
        ) : null}
      </header>

      <div className="gym-owner-actions">
        {onOpenLedger ? (
          <button
            type="button"
            className="gym-listing-submit"
            onClick={onOpenLedger}
          >
            받은 문의
          </button>
        ) : null}
        <button
          type="button"
          className={`gym-listing-manage-button${onOpenLedger ? "" : " is-primary"}`}
          onClick={onCreate}
        >
          관장 입점 신청
        </button>
      </div>

      {loading ? (
        <p className="gym-listing-block-note">불러오는 중…</p>
      ) : null}

      {error ? <p className="gym-inquiry-error">{error}</p> : null}

      {!loading && items.length === 0 ? (
        <div className="gym-listing-empty">
          <strong>등록한 체육관이 없습니다</strong>
          <p>지도에 없는 장소는 체육관 화면에서 제보할 수 있습니다.</p>
        </div>
      ) : null}

      {!loading && items.length > 0 ? (
        <p className="gym-owner-list-label">내 등록 {items.length}</p>
      ) : null}

      <ul className="gym-my-listing-list">
        {items.map((item) => {
          const isLocalOnly = item.synced !== true;
          const cover = coverGymPhoto(item);
          const photoCount = normalizeGymPhotoUrls(item).length;
          const statusClass = isLocalOnly
            ? "is-local"
            : `is-${item.status || "pending"}`;

          return (
            <li key={item.id} className="gym-my-listing-card">
              <button
                type="button"
                className="gym-my-listing-banner is-tappable"
                onClick={() => onEdit?.(item)}
                disabled={Boolean(busyId)}
                aria-label={`${item.gymName} 수정`}
              >
                {cover ? (
                  <img
                    className="gym-my-listing-banner-photo"
                    src={cover}
                    alt=""
                  />
                ) : (
                  <div
                    className="gym-my-listing-banner-photo is-empty"
                    aria-hidden="true"
                  />
                )}
                <span className="gym-my-listing-banner-fade" aria-hidden="true" />
                <span className={`gym-my-listing-status ${statusClass}`}>
                  {isLocalOnly
                    ? "이 기기에만"
                    : listingStatusLabel(item.status)}
                </span>
                {photoCount > 0 ? (
                  <span className="gym-my-listing-photo-count">
                    {photoCount}장
                  </span>
                ) : (
                  <span className="gym-my-listing-photo-count is-warn">
                    간판 없음
                  </span>
                )}
                <span className="gym-my-listing-banner-copy">
                  <strong>{item.gymName}</strong>
                  {item.address ? <span>{item.address}</span> : null}
                </span>
              </button>

              <div className="gym-my-listing-body">
                <p className="gym-my-listing-hint">
                  {statusHint(item, isLocalOnly)}
                </p>
                {isLocalOnly && item.lastSyncError ? (
                  <p className="gym-listing-sync-hint">{item.lastSyncError}</p>
                ) : null}
                <div className="gym-my-listing-actions">
                  {isLocalOnly && remoteReady ? (
                    <button
                      type="button"
                      className="gym-inquiry-button"
                      onClick={() => handleResync(item)}
                      disabled={busyId === item.id}
                    >
                      {busyId === item.id ? "전송 중…" : "서버로 보내기"}
                    </button>
                  ) : null}
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
          );
        })}
      </ul>
    </section>
  );
}
