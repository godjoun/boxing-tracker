import { useState } from "react";
import ComposerShell, { ComposerDockPrimary } from "../components/ComposerShell";
import {
  buildStrengthDayLaunch,
  STRENGTH_ROUTINES,
  STRENGTH_SEGMENT,
} from "../utils/strengthProgram";
import "./StrengthProgramPage.css";

export default function StrengthProgramPage({ onGoBack, onStartDay }) {
  const [selectedId, setSelectedId] = useState(null);
  const selected =
    STRENGTH_ROUTINES.find((routine) => routine.id === selectedId) || null;

  if (selected) {
    return (
      <ComposerShell
        className="strength-page"
        back={
          <button
            className="category-back"
            type="button"
            onClick={() => setSelectedId(null)}
          >
            ← 목록
          </button>
        }
        kicker="CONDITIONING"
        title={selected.title}
        summary={
          <>
            <p className="strength-detail-purpose">{selected.purpose}</p>
            <p className="strength-summary-warmup">
              운동 {STRENGTH_SEGMENT.workSeconds}초 · 휴식{" "}
              {STRENGTH_SEGMENT.restSeconds}초 · 동작 {selected.exercises.length}
              개 × {STRENGTH_SEGMENT.laps}바퀴 · {selected.durationLabel}
            </p>
          </>
        }
        dock={
          <ComposerDockPrimary
            label="훈련 시작"
            onClick={() => onStartDay?.(buildStrengthDayLaunch(selected))}
          />
        }
      >
        <article className={`strength-day-panel tone-${selected.tone}`}>
          <header className="strength-day-head">
            <div>
              <p>동작</p>
              <h2>{selected.exercises.length}개 · 2바퀴</h2>
              <span>도구 없이 · 좁은 공간</span>
            </div>
          </header>

          <section className="strength-block">
            <ol className="strength-exercise-list">
              {selected.exercises.map((item, index) => (
                <li key={item.id}>
                  <div className="strength-exercise-top">
                    <strong>
                      {index + 1}. {item.name}
                    </strong>
                    <span>{item.cue}</span>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="strength-block">
            <div className="strength-block-head">
              <h3>초보 대체</h3>
            </div>
            <ul className="strength-note-list">
              {selected.beginners.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>

          <section className="strength-block">
            <div className="strength-block-head">
              <h3>주의사항</h3>
            </div>
            <ul className="strength-note-list">
              {selected.cautions.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        </article>
      </ComposerShell>
    );
  }

  return (
    <ComposerShell
      className="strength-page"
      back={
        <button className="category-back" type="button" onClick={onGoBack}>
          ← 뒤로
        </button>
      }
      kicker="CONDITIONING"
      title="복싱 체력"
      summary={
        <>
          <p>
            가드·스탠스·이동을 버티는 집 안 무도구 보조 루틴입니다. 약 10분 · 동작
            5개 · 2바퀴.
          </p>
        </>
      }
    >
      <div className="strength-routine-list">
        {STRENGTH_ROUTINES.map((routine) => (
          <article
            key={routine.id}
            className={`strength-routine-card tone-${routine.tone}`}
          >
            <div className="strength-routine-card-body">
              <h2>{routine.title}</h2>
              <p>{routine.purpose}</p>
              <div className="strength-routine-meta">
                <span>{routine.durationLabel}</span>
                <span>동작 {routine.exercises.length}개</span>
              </div>
            </div>
            <button
              type="button"
              className="strength-routine-start"
              onClick={() => setSelectedId(routine.id)}
            >
              시작
            </button>
          </article>
        ))}
      </div>
    </ComposerShell>
  );
}
