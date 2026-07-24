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
  onReserve,
  onOpenLedger,
  onSetHomeGym,
  isHomeGym = false,
  homeGymNotice = "",
  isOwn = false,
  embedded = false,
}) {
  const photos = normalizeGymPhotoUrls(gym?.photoUrls, gym?.photoUrl);
  const [activePhoto, setActivePhoto] = useState(0);
  const [activeSection, setActiveSection] = useState("info");

  if (!gym) return null;

  const passes = getGymPassLines(gym);
  const safeIndex = Math.min(activePhoto, Math.max(photos.length - 1, 0));
  const hero = photos[safeIndex] || "";
  const isFeatured = Boolean(gym.featured);
  const isListing = gym.source === "listing";
  const destination = Number.isFinite(Number(gym.lat)) && Number.isFinite(Number(gym.lon))
    ? `${gym.lat},${gym.lon}`
    : [gym.name, gym.address].filter(Boolean).join(" ");
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
  const statusLabel = isOwn
    ? "내 관"
    : isFeatured
      ? "추천"
      : isListing
        ? "입점"
        : "근처";

  return (
    <section
      className={`gym-detail-panel${embedded ? " is-embedded" : ""}`}
      aria-label={`${gym.name} 상세`}
    >
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
        <nav className="gym-detail-sections" aria-label="체육관 메뉴">
          {[
            { id: "info", label: "정보" },
            { id: "inquiry", label: "문의" },
            { id: "reservation", label: "예약" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              className={activeSection === item.id ? "is-active" : ""}
              onClick={() => setActiveSection(item.id)}
            >
              {item.label}
            </button>
          ))}
          <a href={directionsUrl} target="_blank" rel="noreferrer">길찾기</a>
        </nav>

        {activeSection === "info" ? (
          <>
            <section className="gym-detail-block" aria-label="소개">
              <p className="gym-detail-label">소개</p>
              <p className={`gym-detail-intro${gym.intro ? "" : " is-muted"}`}>
                {gym.intro ||
                  (isListing
                    ? "관에서 올린 소개가 아직 없습니다."
                    : "OpenStreetMap에서 찾은 장소입니다. 지도 정보는 실제와 다를 수 있습니다.")}
              </p>
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
          </>
        ) : (
          <section className="gym-detail-action-panel">
            <p className="gym-detail-label">
              {activeSection === "reservation" ? "방문 예약" : "체육관 문의"}
            </p>
            <h3>
              {activeSection === "reservation"
                ? "방문·레슨·스파링 일정을 남기세요"
                : "체험과 이용 방법을 바로 물어보세요"}
            </h3>
            <p>
              {isListing
                ? "체육관에 전달할 내용을 작성합니다."
                : "지도에서 찾은 장소라 온라인 문의와 예약 정보를 아직 확인할 수 없습니다."}
            </p>
            {isListing ? (
              <button
                type="button"
                className="gym-listing-submit"
                onClick={() =>
                  activeSection === "reservation"
                    ? onReserve?.(gym)
                    : onInquire?.(gym)
                }
              >
                {activeSection === "reservation" ? "예약 문의 시작" : "문의 작성"}
              </button>
            ) : null}
          </section>
        )}
      </div>

      <div className="gym-detail-cta">
        <button
          type="button"
          className={`gym-home-register-button${isHomeGym ? " is-active" : ""}`}
          onClick={() => onSetHomeGym?.(gym)}
        >
          {isHomeGym ? "내 체육관으로 등록됨" : "내 체육관으로 등록"}
        </button>
        {homeGymNotice ? (
          <p className="gym-home-register-notice" role="status">
            {homeGymNotice}
          </p>
        ) : null}
        {isOwn ? (
          <button
            type="button"
            className="gym-listing-submit"
            onClick={() => onOpenLedger?.()}
          >
            받은 문의 보기
          </button>
        ) : (
          <button
            type="button"
            className="gym-listing-submit"
            onClick={() => setActiveSection(isListing ? "inquiry" : "info")}
          >
            {isListing ? "문의하기" : "정보 보기"}
          </button>
        )}
        <a className="gym-detail-directions" href={directionsUrl} target="_blank" rel="noreferrer">
          길찾기
        </a>
      </div>
    </section>
  );
}
