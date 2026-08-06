import { resolveStrengthSegment } from "../utils/strengthProgram";
import "./StrengthTimerGuide.css";

/**
 * 복싱 체력 타이머 가이드 — 현재 동작 · 바퀴 · 전체 진행
 */
export default function StrengthTimerGuide({
  plan,
  phase,
  currentRound,
  remainingTime,
  onEnd,
}) {
  if (!plan) return null;

  const segment = resolveStrengthSegment(plan, currentRound, phase);
  const exerciseName =
    phase === "prep"
      ? plan.exercises?.[0]?.name || plan.title
      : segment.exercise?.name || plan.title;
  const cue =
    phase === "prep"
      ? "준비 · 곧 첫 동작"
      : phase === "rest"
        ? segment.nextExercise
          ? `휴식 · 다음 ${segment.nextExercise.name}`
          : "휴식"
        : segment.exercise?.cue || "";

  const progressLabel = `${segment.segmentIndex}/${segment.totalSegments}`;
  const lapLabel = `${segment.lap}/${segment.totalLaps}`;

  function formatClock(seconds) {
    const safe = Math.max(0, Number(seconds) || 0);
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  return (
    <section className="strength-timer-guide" aria-label="복싱 체력 가이드">
      <header className="strength-timer-guide-head">
        <div>
          <p className="strength-timer-guide-kicker">복싱 체력</p>
          <h3>{plan.title}</h3>
        </div>
      </header>

      <div className="strength-timer-guide-now is-active">
        <p className="strength-timer-guide-now-label">
          {phase === "rest" ? "다음 동작" : "현재 동작"}
        </p>
        <strong className="strength-timer-guide-now-name">
          {phase === "rest" && segment.nextExercise
            ? segment.nextExercise.name
            : exerciseName}
        </strong>
        {cue ? <p className="strength-timer-guide-now-cue">{cue}</p> : null}
        <div className="strength-timer-guide-stats">
          <span>바퀴 {lapLabel}</span>
          <span>진행 {progressLabel}</span>
          {typeof remainingTime === "number" ? (
            <span>남은 {formatClock(remainingTime)}</span>
          ) : null}
        </div>
        {phase === "work" && segment.nextExercise ? (
          <p className="strength-timer-guide-next">
            다음 · {segment.nextExercise.name}
          </p>
        ) : null}
      </div>

      {onEnd ? (
        <button
          type="button"
          className="strength-timer-guide-end"
          onClick={onEnd}
        >
          복싱 체력 종료
        </button>
      ) : null}
    </section>
  );
}
