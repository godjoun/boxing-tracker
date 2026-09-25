import MenuIcon from "../MenuIcon";

export default function HomeTrainingChoiceBoard({ choices = [] }) {
  return (
    <section className="home-training-choice-section" aria-label="오늘의 훈련 선택">
      <div className="home-training-choice-head">
        <h2>빠른 시작</h2>
        <span>바쁜 날에는 1라운드만 남겨도 됩니다</span>
      </div>
      <div className="home-training-choice-grid">
        {choices.map((item) => (
          <button
            type="button"
            className="home-training-choice-item"
            key={item.id}
            onClick={item.onClick}
          >
            <span className="home-training-choice-icon" aria-hidden="true">
              <MenuIcon name={item.icon} size={18} />
            </span>
            <span className="home-training-choice-copy">
              <small>{item.label}</small>
              <strong>{item.title}</strong>
              <em>{item.meta}</em>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
