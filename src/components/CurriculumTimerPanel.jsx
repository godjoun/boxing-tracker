import { getCurriculumDrillForRound } from "../utils/homeCurriculum";
import "./CurriculumTimerPanel.css";

function RoundRing({ currentRound, totalRounds }) {
  const progress = totalRounds > 0 ? currentRound / totalRounds : 0;
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <div className="curriculum-timer-round-ring" aria-hidden="true">
      <svg viewBox="0 0 54 54">
        <circle
          cx="27"
          cy="27"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="4"
        />
        <circle
          cx="27"
          cy="27"
          r={radius}
          fill="none"
          stroke="var(--p-brass)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span>
        {currentRound}/{totalRounds}
      </span>
    </div>
  );
}

function DrillProgress({ activeIndex, total }) {
  if (!total || total <= 1) return null;

  return (
    <div className="curriculum-timer-drill-progress" aria-hidden="true">
      {Array.from({ length: total }, (_, index) => (
        <span
          key={`drill-dot-${index}`}
          className={`curriculum-timer-drill-dot${index === activeIndex ? " is-active" : index < activeIndex ? " is-done" : ""}`}
        />
      ))}
      <em>
        라운드 {activeIndex + 1}/{total}
      </em>
    </div>
  );
}

export default function CurriculumTimerPanel({
  sessionTitle,
  sessionGoal,
  sessionCode,
  weekLabel,
  weekTheme,
  phase,
  currentRound,
  totalRounds,
  focus,
  drills = [],
  onEndCurriculum,
}) {
  const focusClass =
    phase === "rest"
      ? " is-rest"
      : phase === "prep" || phase === "cooldown"
        ? " is-prep"
        : "";

  const activeRoundIndex =
    phase === "prep" ? -1 : Math.max(currentRound - 1, 0);

  const visibleDrill =
    phase === "prep"
      ? drills.find((drill) => /워밍업/i.test(drill.name)) || drills[0]
      : phase === "cooldown"
        ? drills.find((drill) => /쿨다운|마무리/i.test(drill.name)) || focus
        : phase === "rest" && focus?.nextDrill
          ? focus.nextDrill
          : getCurriculumDrillForRound(drills, currentRound, totalRounds);

  const visibleLabel =
    phase === "prep"
      ? "준비"
      : phase === "cooldown"
        ? "마무리"
        : phase === "rest" && focus?.nextDrill
          ? `${currentRound + 1}라운드 예고`
          : focus?.label || `${currentRound}라운드`;

  const visibleName =
    phase === "rest"
      ? focus?.nextDrill?.name || focus?.name
      : phase === "cooldown"
        ? focus?.name || visibleDrill?.name
        : focus?.name;

  const visibleDescription =
    phase === "rest"
      ? focus?.nextDrill?.description || focus?.description
      : focus?.description || visibleDrill?.description;

  const visibleDuration =
    phase === "rest"
      ? focus?.nextDrill?.displayDuration || focus?.nextDrill?.duration
      : focus?.duration || visibleDrill?.displayDuration || visibleDrill?.duration;

  const visibleCombos =
    phase === "rest"
      ? focus?.nextDrill?.combos || []
      : focus?.combos || visibleDrill?.combos || [];

  return (
    <section className="curriculum-timer-panel" aria-label="커리큘럼 가이드">
      <div className="curriculum-timer-head">
        <div className="curriculum-timer-title-block">
          <div className="curriculum-timer-badges">
            {weekLabel ? (
              <span className="curriculum-timer-badge">{weekLabel}</span>
            ) : null}
            {sessionCode ? (
              <span className="curriculum-timer-badge is-muted">{sessionCode}</span>
            ) : null}
            {weekTheme ? (
              <span className="curriculum-timer-badge is-muted">{weekTheme}</span>
            ) : null}
          </div>
          <h3>{sessionTitle}</h3>
          {sessionGoal ? <p>{sessionGoal}</p> : null}
        </div>
        <RoundRing currentRound={currentRound} totalRounds={totalRounds} />
      </div>

      {phase === "rest" && !focus?.nextDrill ? (
        <div className={`curriculum-timer-focus is-rest`}>
          <span className="curriculum-timer-focus-label">{focus?.label}</span>
          <strong>{focus?.name}</strong>
          <p>{focus?.description}</p>
        </div>
      ) : visibleDrill ? (
        <>
          {phase !== "prep" && phase !== "cooldown" ? (
            <DrillProgress
              activeIndex={
                phase === "rest" && focus?.nextDrill
                  ? currentRound
                  : activeRoundIndex
              }
              total={totalRounds}
            />
          ) : null}

          <div
            key={`${phase}-${currentRound}-${visibleDrill.name}`}
            className={`curriculum-timer-focus curriculum-timer-focus-solo${focusClass}`}
          >
            <span className="curriculum-timer-focus-label">{visibleLabel}</span>
            <strong>{visibleName || visibleDrill.name}</strong>
            {visibleDuration ? (
              <em className="curriculum-timer-focus-duration">{visibleDuration}</em>
            ) : null}
            {visibleDescription ? <p>{visibleDescription}</p> : null}
            {Array.isArray(visibleCombos) && visibleCombos.length > 0 ? (
              <div className="curriculum-timer-combos">
                {visibleCombos.map((combo) => (
                  <span className="curriculum-timer-combo-chip" key={combo}>
                    {combo}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {phase === "rest" ? (
            <p className="curriculum-timer-rest-hint">
              호흡을 고른 뒤 다음 드릴에 집중하세요.
            </p>
          ) : null}
        </>
      ) : null}

      <div className="curriculum-timer-actions">
        <button
          type="button"
          className="curriculum-timer-end"
          onClick={onEndCurriculum}
        >
          커리큘럼 종료
        </button>
      </div>
    </section>
  );
}
