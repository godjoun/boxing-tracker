import { useMemo, useState } from "react";
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

  return (
    <main className="strength-page">
      <header className="strength-hero">
        <button className="category-back" type="button" onClick={onGoBack}>
          <span aria-hidden="true">←</span>
          더보기
        </button>
        <div className="strength-hero-copy">
          <p>STRENGTH CAMP</p>
          <h1>훈련법 추천</h1>
          <span>복싱 몸강화 · 요일별 현실 루틴</span>
        </div>
      </header>

      <section className="strength-card strength-warmup-card">
        <div className="strength-card-head">
          <p>필수 워밍업</p>
          <h2>{STRENGTH_WARMUP.title}</h2>
        </div>
        <p className="strength-warmup-desc">{STRENGTH_WARMUP.description}</p>
        <div className="strength-warmup-meta">
          <span>줄넘기 3분</span>
          <span>{STRENGTH_WARMUP.rounds}라운드</span>
          <span>휴식 {STRENGTH_WARMUP.restSeconds}초</span>
        </div>
        <button
          type="button"
          className="strength-warmup-button"
          onClick={() => onStartWarmup?.(buildStrengthWarmupLaunch())}
        >
          줄넘기 타이머 시작
        </button>
      </section>

      <section className="strength-today-card">
        <span>오늘 추천</span>
        <strong>
          {todayPlan.day} · {todayPlan.theme}
        </strong>
        <small>{todayPlan.focus}</small>
      </section>

      <div className="strength-day-chips" role="tablist" aria-label="요일 선택">
        {STRENGTH_WEEK.map((day) => (
          <button
            key={day.id}
            type="button"
            role="tab"
            aria-selected={activeDayId === day.id}
            className={`strength-day-chip tone-${day.tone}${
              activeDayId === day.id ? " is-active" : ""
            }${todayPlan.id === day.id ? " is-today" : ""}`}
            onClick={() => setActiveDayId(day.id)}
          >
            <em>{day.shortDay}</em>
            <span>{day.theme.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      <article className={`strength-day-panel tone-${activeDay.tone}`}>
        <header className="strength-day-head">
          <div>
            <p>{activeDay.day}</p>
            <h2>{activeDay.theme}</h2>
            <span>{activeDay.focus}</span>
          </div>
        </header>

        {activeDay.blocks.map((block) => (
          <section className="strength-block" key={`${activeDay.id}-${block.title}`}>
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
          <p>CAMP TIPS</p>
          <h2>캠프 루틴 소화 팁</h2>
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
    </main>
  );
}
