import WorkoutDetailsQuickBar from "../WorkoutDetailsQuickBar";

export default function TrainingWorkoutDetailsPanel({
  canSaveCurrent,
  categoryId,
  maxLength,
  menuOpenId,
  presetsFull,
  recentWorkoutDetails = [],
  savedMenuRef,
  savedWorkouts = [],
  workoutDetails,
  onApplySavedWorkout,
  onDeleteSavedWorkout,
  onOpenRenameModal,
  onOpenSaveNameModal,
  onSetMenuOpenId,
  onWorkoutDetailsChange,
}) {
  const summary = workoutDetails ? "작성됨" : "선택 사항";

  return (
    <details className="training-detail-panel training-notes-panel">
      <summary className="training-detail-summary">
        <span>운동 메모</span>
        <strong>{summary}</strong>
      </summary>

      <section
        className="training-workout-details-block"
        aria-label="오늘 할 운동"
      >
        <label className="training-workout-details">
          <span>오늘 할 운동</span>
          <input
            type="text"
            value={workoutDetails}
            maxLength={maxLength}
            placeholder="예: 줄넘기 2R · 쉐도우 3R · 샌드백 4R"
            onChange={(event) => onWorkoutDetailsChange?.(event.target.value)}
            autoComplete="off"
            enterKeyHint="done"
          />
        </label>

        {categoryId === "boxing" ? (
          <WorkoutDetailsQuickBar
            value={workoutDetails}
            onChange={onWorkoutDetailsChange}
          />
        ) : null}

        {recentWorkoutDetails.length > 0 ? (
          <div
            className="training-workout-recent"
            role="list"
            aria-label="최근 운동 내용"
          >
            {recentWorkoutDetails.map((item) => (
              <button
                key={item}
                type="button"
                role="listitem"
                className="training-workout-recent-chip"
                onClick={() => onWorkoutDetailsChange?.(item)}
              >
                {item}
              </button>
            ))}
          </div>
        ) : null}

        <div className="training-workout-saved" aria-label="저장한 운동">
          <div className="training-workout-saved-header">
            <span className="training-workout-saved-label">저장한 운동</span>
            <button
              type="button"
              className="training-workout-save-btn"
              disabled={!canSaveCurrent}
              onClick={onOpenSaveNameModal}
            >
              현재 운동 저장
            </button>
          </div>
          {savedWorkouts.length > 0 ? (
            <div
              className="training-workout-saved-list"
              role="list"
              ref={savedMenuRef}
            >
              {savedWorkouts.map((preset) => (
                <div
                  key={preset.id}
                  className="training-workout-saved-row"
                  role="listitem"
                >
                  <button
                    type="button"
                    className="training-workout-saved-name"
                    onClick={() => onApplySavedWorkout?.(preset)}
                  >
                    {preset.name}
                  </button>
                  <div className="training-workout-saved-menu-wrap">
                    <button
                      type="button"
                      className="training-workout-saved-menu-btn"
                      aria-label={`${preset.name} 메뉴`}
                      aria-expanded={menuOpenId === preset.id}
                      onClick={() =>
                        onSetMenuOpenId?.(
                          menuOpenId === preset.id ? null : preset.id
                        )
                      }
                    >
                      ⋯
                    </button>
                    {menuOpenId === preset.id ? (
                      <div
                        className="training-workout-saved-menu"
                        role="menu"
                      >
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => onOpenRenameModal?.(preset)}
                        >
                          이름 변경
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => onDeleteSavedWorkout?.(preset)}
                        >
                          삭제
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          {presetsFull ? (
            <p className="training-workout-saved-hint">
              최대 3개까지 저장할 수 있어요
            </p>
          ) : null}
        </div>
      </section>
    </details>
  );
}
