export default function TrainingStageCard({ stage }) {
  return (
    <section className="training-stage-card" aria-label="선택한 훈련">
      <span className="training-stage-kicker">{stage.kicker}</span>
      <h2>{stage.title}</h2>
      <p>{stage.summary}</p>
      <div className="training-stage-stats" aria-label="훈련 요약">
        {stage.stats.map((stat) => (
          <span key={stat.label}>
            <small>{stat.label}</small>
            <b>{stat.value}</b>
          </span>
        ))}
      </div>
    </section>
  );
}
