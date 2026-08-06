import {
  QUICK_WORKOUT_KINDS,
  bumpQuickWorkoutKind,
  getSelectedQuickWorkoutKinds,
  removeQuickWorkoutKind,
} from "../utils/workoutDetails";

export default function WorkoutDetailsQuickBar({
  value = "",
  onChange,
  disabled = false,
}) {
  const selected = getSelectedQuickWorkoutKinds(value);
  const selectedByName = new Map(selected.map((item) => [item.name, item]));

  return (
    <div
      className="training-workout-quick"
      role="list"
      aria-label="빠른 종목 추가"
    >
      {QUICK_WORKOUT_KINDS.map((kind) => {
        const active = selectedByName.get(kind);
        return (
          <span
            key={kind}
            className={`training-workout-quick-chip${active ? " is-active" : ""}`}
            role="listitem"
          >
            <button
              type="button"
              className="training-workout-quick-main"
              disabled={disabled}
              aria-pressed={Boolean(active)}
              aria-label={
                active ? `${kind} ${active.rounds}R, 라운드 추가` : `${kind} 추가`
              }
              onClick={() => onChange?.(bumpQuickWorkoutKind(value, kind))}
            >
              {active ? `${kind} ${active.rounds}R` : kind}
            </button>
            {active ? (
              <button
                type="button"
                className="training-workout-quick-remove"
                disabled={disabled}
                aria-label={`${kind} 제거`}
                onClick={() => onChange?.(removeQuickWorkoutKind(value, kind))}
              >
                ×
              </button>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}
