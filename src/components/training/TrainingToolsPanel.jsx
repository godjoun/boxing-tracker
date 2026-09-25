export default function TrainingToolsPanel({ tools = [] }) {
  return (
    <details className="training-tools-details">
      <summary className="training-tools-summary">
        <span>보조 기능</span>
        <strong>러닝 · 체력 · 기록</strong>
      </summary>
      <section className="training-tools-section" aria-label="추가 훈련 도구">
        {tools.map((tool) => (
          <button key={tool.id} type="button" onClick={tool.onClick}>
            <span>{tool.label}</span>
            <small>{tool.hint}</small>
            <b>›</b>
          </button>
        ))}
      </section>
    </details>
  );
}
