export default function WorkoutNameModal({
  error,
  maxLength,
  modal,
  nameDraft,
  onChangeName,
  onClose,
  onSubmit,
}) {
  if (!modal) return null;

  return (
    <div
      className="training-workout-name-modal"
      role="dialog"
      aria-modal="true"
      aria-label={modal.mode === "save" ? "운동 이름 저장" : "이름 변경"}
    >
      <button
        type="button"
        className="training-workout-name-modal-backdrop"
        aria-label="닫기"
        onClick={onClose}
      />
      <div className="training-workout-name-modal-panel">
        <strong>{modal.mode === "save" ? "운동 이름" : "이름 변경"}</strong>
        <input
          type="text"
          value={nameDraft}
          maxLength={maxLength}
          placeholder="예: 기본 훈련"
          autoFocus
          autoComplete="off"
          enterKeyHint="done"
          onChange={(event) => onChangeName?.(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onSubmit?.();
            }
          }}
        />
        {error ? <p className="training-workout-name-modal-error">{error}</p> : null}
        <div className="training-workout-name-modal-actions">
          <button type="button" onClick={onClose}>
            취소
          </button>
          <button type="button" onClick={onSubmit}>
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
