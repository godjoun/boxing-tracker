import "./StrengthTimerGuide.css";

/**
 * 신체 요일 루틴을 타이머와 같이 보여 주는 가이드.
 * 워밍업 라운드 / 본운동 라운드에 맞춰 현재 구간을 강조한다.
 */
export default function StrengthTimerGuide({
  plan,
  phase,
  currentRound,
  onEnd,
}) {
  if (!plan) return null;

  const warmupRounds = plan.warmupRounds || 0;
  const inWarmup =
    warmupRounds > 0 &&
    phase !== "cooldown" &&
    phase !== "done" &&
    (phase === "prep" || currentRound <= warmupRounds);
  const inMain =
    phase !== "prep" &&
    phase !== "cooldown" &&
    phase !== "done" &&
    currentRound > warmupRounds;

  const phaseHint =
    phase === "prep"
      ? "준비 중 · 곧 줄넘기부터"
      : phase === "rest"
        ? inWarmup || currentRound < warmupRounds
          ? "휴식 · 다음도 줄넘기"
          : "휴식 · 다음 라운드도 아래 루틴"
        : phase === "cooldown"
          ? "마무리"
          : inWarmup
            ? `줄넘기 워밍업 · ${currentRound}/${warmupRounds}R`
            : inMain
              ? `본운동 · ${currentRound - warmupRounds}/${plan.mainRounds || "?"}R`
              : null;

  return (
    <section className="strength-timer-guide" aria-label="신체 운동 가이드">
      <header className="strength-timer-guide-head">
        <div>
          <p className="strength-timer-guide-kicker">
            {plan.day} · {plan.focus}
          </p>
          <h3>{plan.theme}</h3>
          {phaseHint ? <span>{phaseHint}</span> : null}
        </div>
      </header>

      {warmupRounds > 0 ? (
        <div
          className={`strength-timer-guide-block${inWarmup ? " is-active" : ""}`}
        >
          <div className="strength-timer-guide-block-head">
            <h4>줄넘기 워밍업</h4>
            <em>{warmupRounds}R</em>
          </div>
          <ol>
            <li>
              <div className="strength-timer-guide-item-top">
                <strong>줄넘기</strong>
                <span>라운드당</span>
              </div>
              {plan.warmupNote ? <p>{plan.warmupNote}</p> : null}
            </li>
          </ol>
        </div>
      ) : null}

      {(plan.blocks || []).map((block) => (
        <div
          key={block.title}
          className={`strength-timer-guide-block${inMain ? " is-active" : ""}`}
        >
          <div className="strength-timer-guide-block-head">
            <h4>{block.title}</h4>
            {block.prescription ? <em>{block.prescription}</em> : null}
          </div>
          <ol>
            {(block.items || []).map((item) => (
              <li key={`${block.title}-${item.name}`}>
                <div className="strength-timer-guide-item-top">
                  <strong>{item.name}</strong>
                  {item.prescription ? <span>{item.prescription}</span> : null}
                </div>
                {item.note ? <p>{item.note}</p> : null}
              </li>
            ))}
          </ol>
        </div>
      ))}

      {onEnd ? (
        <button
          type="button"
          className="strength-timer-guide-end"
          onClick={onEnd}
        >
          신체 종료
        </button>
      ) : null}
    </section>
  );
}
