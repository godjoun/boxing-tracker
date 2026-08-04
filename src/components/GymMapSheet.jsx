/**
 * 커뮤니티 목록형 본문 (지도 없음).
 */
export default function GymMapSheet({
  snap = "full",
  title = "결과",
  count = 0,
  subtitle = "",
  showBack = false,
  onBack,
  onSnapChange,
  filters = null,
  headAction = null,
  variant = "sheet",
  children,
}) {
  const isPage = variant === "page";
  const hasHead =
    Boolean(title) ||
    Boolean(subtitle) ||
    count > 0 ||
    showBack ||
    Boolean(headAction);

  function cycleSnap() {
    if (isPage || !onSnapChange) return;
    const next =
      snap === "full" ? "half" : snap === "half" ? "full" : "full";
    onSnapChange(next);
  }

  return (
    <section
      className={`gym-map-sheet is-${isPage ? "full" : snap}${
        isPage ? " is-page" : ""
      }${snap === "full" || isPage ? " is-detail-height" : ""}`}
      aria-label={title || "목록"}
    >
      <div className={`gym-map-sheet-chrome${hasHead ? "" : " is-minimal"}`}>
        {!isPage ? (
          <button
            type="button"
            className="gym-map-sheet-handle"
            aria-label={
              snap === "full"
                ? "시트 접기"
                : snap === "half"
                  ? "시트 펼치기"
                  : "목록 펼치기"
            }
            onClick={cycleSnap}
          >
            <span />
          </button>
        ) : null}

        {hasHead ? (
          <div className="gym-map-sheet-head-row">
            {showBack ? (
              <button
                type="button"
                className="gym-map-sheet-back"
                aria-label="뒤로"
                onClick={onBack}
              >
                ←
              </button>
            ) : null}
            <div className="gym-map-sheet-head">
              <div>
                {title ? <h2>{title}</h2> : null}
                {subtitle ? (
                  <p className="gym-map-sheet-caption">{subtitle}</p>
                ) : null}
              </div>
              {count > 0 ? (
                <span className="gym-map-sheet-count" aria-hidden="true">
                  {count}
                </span>
              ) : null}
            </div>
            {headAction}
          </div>
        ) : null}
        {filters ? (
          <div className="gym-map-sheet-filters">{filters}</div>
        ) : null}
      </div>
      <div className="gym-map-sheet-body">{children}</div>
    </section>
  );
}
