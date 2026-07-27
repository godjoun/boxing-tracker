/**
 * 하단 결과 시트 — 지도 앱형 (핸들로 높이 조절).
 */
const SNAP_CYCLE = {
  peek: "half",
  half: "full",
  full: "half",
};

export default function GymMapSheet({
  snap = "peek",
  title = "결과",
  count = 0,
  subtitle = "",
  showBack = false,
  onBack,
  onSnapChange,
  children,
}) {
  function cycleSnap() {
    onSnapChange?.(SNAP_CYCLE[snap] || "half");
  }

  const isPeek = snap === "peek";

  return (
    <section
      className={`gym-map-sheet is-${snap}${
        snap === "full" ? " is-detail-height" : ""
      }`}
      aria-label={title}
    >
      <div className="gym-map-sheet-chrome">
        <button
          type="button"
          className="gym-map-sheet-handle"
          aria-label={
            snap === "full"
              ? "시트 접기"
              : snap === "half"
                ? "시트 펼치기"
                : "시트 목록 열기"
          }
          onClick={cycleSnap}
        >
          <span />
        </button>

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
          <button
            type="button"
            className="gym-map-sheet-head"
            onClick={cycleSnap}
            aria-label={`${title}, 시트 높이 조절`}
          >
            <div>
              <h2>{title}</h2>
              {!isPeek && subtitle ? (
                <p className="gym-map-sheet-caption">{subtitle}</p>
              ) : null}
            </div>
            {count > 0 ? (
              <span className="gym-map-sheet-count" aria-hidden="true">
                {count}
              </span>
            ) : null}
          </button>
        </div>
      </div>
      <div className="gym-map-sheet-body">{children}</div>
    </section>
  );
}
