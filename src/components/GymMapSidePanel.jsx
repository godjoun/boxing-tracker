/**
 * 지도 우측 장소 정보 패널 — 구글·네이버 지도형.
 * 하단 시트는 목록, 선택 시 우측에 미리보기·상세.
 */
export default function GymMapSidePanel({
  open = false,
  title = "장소",
  onClose,
  children,
}) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="gym-map-side-panel-backdrop"
        aria-label="패널 닫기"
        onClick={onClose}
      />
      <aside
        className="gym-map-side-panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="gym-map-side-panel-head">
          <button
            type="button"
            className="gym-map-side-panel-close"
            aria-label="닫기"
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <div className="gym-map-side-panel-body">{children}</div>
      </aside>
    </>
  );
}
