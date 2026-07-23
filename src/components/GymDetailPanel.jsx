import { useState } from "react";
import { getGymPassLines } from "../utils/gymPricing";
import { normalizeGymPhotoUrls } from "../utils/gymListing";

/**
 * 관 상세 — 목록 → 한 장면 (커버 · 소개 · 가격 · 문의).
 * 커뮤니티는 자리만 아주 작게. 복제 X.
 */
export default function GymDetailPanel({
  gym,
  onClose,
  onInquire,
  onOpenLedger,
  isOwn = false,
}) {
  const photos = normalizeGymPhotoUrls(gym?.photoUrls, gym?.photoUrl);
  const [activePhoto, setActivePhoto] = useState(0);

  if (!gym) return null;

  const passes = getGymPassLines(gym);
  const safeIndex = Math.min(activePhoto, Math.max(photos.length - 1, 0));
  const hero = photos[safeIndex] || "";
  const isFeatured = Boolean(gym.featured);
  const isListing = gym.source === "listing";
  const statusLabel = isOwn
    ? "내 관"
    : isFeatured
      ? "추천"
      : isListing
        ? "입점"
        : "근처";

  return (
    <section className="gym-detail-panel" aria-label={`${gym.name} 상세`}>
      <div className="gym-detail-hero">
        {hero ? (
          <img className="gym-detail-hero-photo" src={hero} alt="" />
        ) : (
          <div className="gym-detail-hero-photo is-empty" aria-hidden="true" />
        )}
        <div className="gym-detail-hero-fade" aria-hidden="true" />

        <button
          type="button"
          className="gym-detail-back"
          onClick={onClose}
          aria-label="목록으로"
        >
          ←
        </button>

        <div className="gym-detail-hero-copy">
          <p className="gym-detail-status">{statusLabel}</p>
          <h2>{gym.name}</h2>
          {gym.distanceLabel ? (
            <p className="gym-detail-meta">{gym.distanceLabel}</p>
          ) : null}
        </div>
      </div>

      {photos.length > 1 ? (
        <ul className="gym-detail-gallery" aria-label="시설 사진">
          {photos.map((url, index) => (
            <li key={`${url}-${index}`}>
              <button
                type="button"
                className={`gym-detail-gallery-thumb${
                  index === safeIndex ? " is-active" : ""
                }`}
                onClick={() => setActivePhoto(index)}
                aria-label={`사진 ${index + 1}`}
              >
                <img src={url} alt="" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="gym-detail-body">
        <section className="gym-detail-block" aria-label="소개">
          <p className="gym-detail-label">소개</p>
          {gym.intro ? (
            <p className="gym-detail-intro">{gym.intro}</p>
          ) : (
            <p className="gym-detail-intro is-muted">
              {isListing
                ? "관에서 올린 소개가 아직 없습니다."
                : "OpenStreetMap에서 찾은 장소입니다. 지도 정보는 실제와 다를 수 있습니다."}
            </p>
          )}
          {gym.tags?.length > 0 ? (
            <p className="gym-detail-tags">{gym.tags.join(" · ")}</p>
          ) : null}
        </section>

        {gym.address ? (
          <section className="gym-detail-block" aria-label="위치">
            <p className="gym-detail-label">위치</p>
            <p className="gym-detail-address">{gym.address}</p>
          </section>
        ) : null}

        <section className="gym-detail-block" aria-label="이용권">
          <p className="gym-detail-label">이용권</p>
          <aside className="gym-detail-passes">
            {passes.map((pass) => (
              <div key={pass.key} className="gym-detail-pass">
                <span>{pass.label}</span>
                <strong>{pass.value}</strong>
              </div>
            ))}
          </aside>
        </section>

        <p className="gym-detail-community-note">
          관 소식·커뮤니티는 나중에 붙습니다.
        </p>
      </div>

      <div className="gym-detail-cta">
        {isOwn ? (
          <button
            type="button"
            className="gym-listing-submit"
            onClick={() => onOpenLedger?.()}
          >
            받은 문의 보기
          </button>
        ) : isListing ? (
          <button
            type="button"
            className="gym-listing-submit"
            onClick={() => onInquire?.(gym)}
          >
            문의하기
          </button>
        ) : (
          <a
            className="gym-listing-submit"
            href={
              gym.mapUrl ||
              `https://www.openstreetmap.org/?mlat=${gym.lat}&mlon=${gym.lon}#map=17/${gym.lat}/${gym.lon}`
            }
            target="_blank"
            rel="noreferrer"
          >
            OpenStreetMap에서 보기
          </a>
        )}
      </div>
    </section>
  );
}
