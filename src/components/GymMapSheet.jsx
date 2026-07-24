/**
 * 하단 결과 시트 — 목록 / 미리보기 / 상세.
 * 높이는 핸들·헤더 탭으로만 조절 (접기/펼치기 버튼 없음).
 */
const SNAP_CYCLE = {
  peek: "half",
  half: "full",
  full: "half",
};

export default function GymMapSheet({
  snap = "half",
  title = "결과",
  count = 0,
  subtitle = "",
  onSnapChange,
  children,
}) {
  function cycleSnap() {
    onSnapChange?.(SNAP_CYCLE[snap] || "half");
  }

  return (
    <section
      className={`gym-map-sheet is-${snap}${snap === "full" ? " is-detail-height" : ""}`}
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

        <button
          type="button"
          className="gym-map-sheet-head"
          onClick={cycleSnap}
          aria-label={`${title}, 시트 높이 조절`}
        >
          <div>
            <h2>{title}</h2>
            {subtitle ? (
              <p className="gym-map-sheet-caption">{subtitle}</p>
            ) : null}
          </div>
          <span className="gym-map-sheet-count" aria-hidden="true">
            {count}
          </span>
        </button>
      </div>
      <div className="gym-map-sheet-body">{children}</div>
    </section>
  );
}
