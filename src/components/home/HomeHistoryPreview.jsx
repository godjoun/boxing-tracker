export default function HomeHistoryPreview({
  latestLog = null,
  latestLogMetric = "",
  latestLogWhen = "",
  surfaceLogCount = 0,
  trainingDayCount = 0,
  totalRounds = 0,
  weekStrip = [],
  onOpenLatest,
  onOpenProfile,
}) {
  return (
    <section className="home-history-preview" aria-label="Boxer History">
      <div className="home-history-preview-head">
        <div>
          <p>Boxer History</p>
          <h2>내 복싱 이력</h2>
        </div>
        <button type="button" onClick={onOpenProfile}>
          보기
        </button>
      </div>
      <div className="home-history-stats" aria-label="누적 훈련 요약">
        <span>
          <small>기록</small>
          <strong>{surfaceLogCount}회</strong>
        </span>
        <span>
          <small>훈련일</small>
          <strong>{trainingDayCount}일</strong>
        </span>
        <span>
          <small>라운드</small>
          <strong>{totalRounds}R</strong>
        </span>
      </div>
      <div className="home-history-week" aria-label="이번 주 훈련 흔적">
        {weekStrip.map((day) => (
          <span
            key={day.key}
            className={`${day.isToday ? " is-today" : ""}${
              day.trained ? " is-trained" : ""
            }`}
          >
            <em>{day.label}</em>
            <i aria-hidden="true" />
          </span>
        ))}
      </div>
      {latestLog ? (
        <button
          type="button"
          className="home-history-latest"
          onClick={onOpenLatest}
        >
          <span>
            <small>최근 기록</small>
            <strong>{latestLog.type || "훈련"}</strong>
          </span>
          <em>{[latestLogMetric, latestLogWhen].filter(Boolean).join(" · ")}</em>
        </button>
      ) : null}
    </section>
  );
}
