import { getGymPassLines } from "../../utils/gymPricing";
import { coverGymPhoto, normalizeGymPhotoUrls } from "../../utils/gymListing";

/** 검색 카드 — 간판(배너) 사진이 주인공 */
export default function GymResultCard({
  gym,
  index,
  onOpen,
  onInquire,
  featured = false,
  isOwn = false,
}) {
  const passes = getGymPassLines(gym);
  const isFeatured = featured || Boolean(gym.featured);
  const badge = isFeatured ? "추천" : String(index + 1).padStart(2, "0");
  const cover = coverGymPhoto(gym);
  const photoCount = normalizeGymPhotoUrls(gym.photoUrls, gym.photoUrl).length;

  function handleCardActivate() {
    onOpen?.(gym);
  }

  return (
    <article
      className={`gym-result-card${isFeatured ? " is-featured" : ""}${
        gym.ownerPreview ? " is-owner-preview" : ""
      }${onOpen ? " is-tappable" : ""}`}
      onClick={onOpen ? handleCardActivate : undefined}
      onKeyDown={
        onOpen
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleCardActivate();
              }
            }
          : undefined
      }
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
    >
      <div className="gym-result-banner">
        {cover ? (
          <img
            className="gym-result-banner-photo"
            src={cover}
            alt=""
            loading="lazy"
          />
        ) : (
          <div className="gym-result-banner-photo is-empty" aria-hidden="true" />
        )}
        <div className="gym-result-banner-fade" aria-hidden="true" />
        <span
          className={`gym-result-banner-badge${isFeatured ? " is-featured" : ""}`}
        >
          {badge}
        </span>
        {photoCount > 1 ? (
          <span className="gym-result-photo-count">{photoCount}장</span>
        ) : null}
        <div className="gym-result-banner-copy">
          <strong>{gym.name}</strong>
          {gym.distanceLabel ? (
            <span className="gym-result-distance">{gym.distanceLabel}</span>
          ) : null}
        </div>
      </div>

      <div className="gym-result-footer">
        {gym.address ? <p className="gym-result-address">{gym.address}</p> : null}
        {gym.tags?.length > 0 ? (
          <p className="gym-result-category">{gym.tags.join(" · ")}</p>
        ) : null}

        <aside className="gym-result-passes" aria-label="이용권 가격">
          {passes.map((pass) => (
            <div key={pass.key} className="gym-result-pass">
              <span>{pass.label}</span>
              <strong>{pass.value}</strong>
            </div>
          ))}
        </aside>

        {isOwn ? (
          <p className="gym-result-own-hint">내 등록 · 문의 대상 아님</p>
        ) : (
          <button
            type="button"
            className="gym-inquiry-button"
            onClick={(event) => {
              event.stopPropagation();
              onInquire?.(gym);
            }}
          >
            문의하기
          </button>
        )}
      </div>
    </article>
  );
}
