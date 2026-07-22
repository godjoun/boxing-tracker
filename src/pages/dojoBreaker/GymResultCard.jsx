import { getGymPassLines } from "../../utils/gymPricing";

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

  function handleCardActivate() {
    onOpen?.(gym);
  }

  return (
    <article
      className={`gym-result-card${isFeatured ? " is-featured" : ""}${
        onOpen ? " is-tappable" : ""
      }`}
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
      <div className="gym-result-rank">
        {isFeatured ? "추천" : String(index + 1).padStart(2, "0")}
      </div>

      <div className="gym-result-body">
        <div className="gym-result-main">
          {gym.photoUrl ? (
            <img
              className="gym-result-photo"
              src={gym.photoUrl}
              alt=""
              loading="lazy"
            />
          ) : (
            <div className="gym-result-photo is-empty" aria-hidden="true">
              GYM
            </div>
          )}
          <div className="gym-result-top">
            <strong>{gym.name}</strong>
            <span className="gym-result-distance">{gym.distanceLabel}</span>
          </div>
          {gym.address ? <p className="gym-result-address">{gym.address}</p> : null}
          {gym.tags?.length > 0 ? (
            <p className="gym-result-category">{gym.tags.join(" · ")}</p>
          ) : null}
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

        <aside className="gym-result-passes" aria-label="이용권 가격">
          {passes.map((pass) => (
            <div key={pass.key} className="gym-result-pass">
              <span>{pass.label}</span>
              <strong>{pass.value}</strong>
            </div>
          ))}
        </aside>
      </div>
    </article>
  );
}
