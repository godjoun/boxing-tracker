import { useMemo, useState } from "react";
import ComposerShell, {
  ComposerDockPrimary,
  ComposerSegmentTabs,
} from "../components/ComposerShell";
import {
  buildStrengthWarmupLaunch,
  getTodayStrengthDay,
  STRENGTH_TIPS,
  STRENGTH_WARMUP,
  STRENGTH_WEEK,
} from "../utils/strengthProgram";
import "./StrengthProgramPage.css";

export default function StrengthProgramPage({ onGoBack, onStartWarmup }) {
  const todayPlan = useMemo(() => getTodayStrengthDay(), []);
  const [activeDayId, setActiveDayId] = useState(todayPlan.id);
  const activeDay =
    STRENGTH_WEEK.find((day) => day.id === activeDayId) || todayPlan;

  const dayTabs = STRENGTH_WEEK.map((day) => ({
    id: day.id,
    label: day.shortDay,
  }));

  return (
    <ComposerShell
      className="strength-page"
      back={
        <button className="category-back" type="button" onClick={onGoBack}>
          ← 뒤로
        </button>
      }
      kicker="CONDITIONING"
      title="몸 강화"
      summary={
        <>
          <span className="composer-meta-label">오늘 추천</span>
          <strong>
            {todayPlan.day} · {todayPlan.theme}
          </strong>
          <p>{todayPlan.focus} · 복싱을 위한 컨디셔닝 루틴입니다</p>
          <p className="strength-summary-warmup">
            시작 전 워밍업 · {STRENGTH_WARMUP.title}
          </p>
        </>
      }
      segments={
        <ComposerSegmentTabs
          tabs={dayTabs}
          activeId={activeDayId}
          onChange={setActiveDayId}
          ariaLabel="요일 선택"
        />
      }
      dock={
        <ComposerDockPrimary
          label="줄넘기 워밍업 시작"
          onClick={() => onStartWarmup?.(buildStrengthWarmupLaunch())}
        />
      }
    >
      <article className={`strength-day-panel tone-${activeDay.tone}`}>
        <header className="strength-day-head">
          <div>
            <p>{activeDay.day}</p>
            <h2>{activeDay.theme}</h2>
            <span>{activeDay.focus}</span>
          </div>
        </header>

        {activeDay.blocks.map((block) => (
          <section
            className="strength-block"
            key={`${activeDay.id}-${block.title}`}
          >
            <div className="strength-block-head">
              <h3>{block.title}</h3>
              {block.prescription ? <em>{block.prescription}</em> : null}
            </div>
            <ol className="strength-exercise-list">
              {block.items.map((item) => (
                <li key={`${block.title}-${item.name}`}>
                  <div className="strength-exercise-top">
                    <strong>{item.name}</strong>
                    <span>{item.prescription}</span>
                  </div>
                  {item.note ? <p>{item.note}</p> : null}
                </li>
              ))}
            </ol>
          </section>
        ))}
      </article>

      <section className="strength-card strength-tips-card">
        <div className="strength-card-head">
          <p>TIPS</p>
          <h2>캠프 루틴 팁</h2>
        </div>
        <div className="strength-tips-list">
          {STRENGTH_TIPS.map((tip) => (
            <article key={tip.title}>
              <strong>{tip.title}</strong>
              <p>{tip.body}</p>
            </article>
          ))}
        </div>
      </section>
    </ComposerShell>
  );
}
