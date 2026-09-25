import MenuIcon from "../MenuIcon";

export default function TrainingDecisionBoard({
  choices = [],
  selectedChoiceId = "",
  onChoice,
}) {
  return (
    <section className="training-decision-section" aria-label="오늘 할 훈련">
      <div className="training-decision-head">
        <div>
          <h2>오늘 할 훈련</h2>
          <p>3R 시작, 1R, 기술, 코스</p>
        </div>
      </div>

      <div className="training-decision-grid">
        {choices.map((choice) => {
          const selected = selectedChoiceId === choice.id;
          return (
            <button
              key={choice.id}
              type="button"
              className={`training-decision-card${selected ? " is-selected" : ""}`}
              onClick={() => onChoice?.(choice)}
            >
              <span className="training-decision-icon" aria-hidden="true">
                <MenuIcon name={choice.icon} size={18} />
              </span>
              <span className="training-decision-copy">
                <small>{choice.label}</small>
                <strong>{choice.title}</strong>
                <em>{choice.meta}</em>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
