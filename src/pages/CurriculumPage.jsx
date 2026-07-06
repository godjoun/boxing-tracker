import { useMemo, useState } from "react";
import {
  getAllCurriculumSessions,
  getCurriculumProgress,
  getRecommendedSession,
  HOME_CURRICULUM,
  isCurriculumSessionComplete,
} from "../utils/homeCurriculum";
import "./CurriculumPage.css";

export default function CurriculumPage({ onGoBack, onStartSession }) {
  const [progress, setProgress] = useState(() => getCurriculumProgress());
  const [openWeekId, setOpenWeekId] = useState(() => {
    const next = getRecommendedSession(progress);
    return next?.weekId || HOME_CURRICULUM.weeks[0]?.id || null;
  });

  const recommended = useMemo(
    () => getRecommendedSession(progress),
    [progress]
  );

  const sessions = useMemo(() => getAllCurriculumSessions(), []);

  function refreshProgress() {
    setProgress(getCurriculumProgress());
  }

  function handleStartSession(session) {
    onStartSession?.(session);
  }

  function toggleWeek(weekId) {
    setOpenWeekId((current) => (current === weekId ? null : weekId));
  }

  return (
    <main className="curriculum-page">
      <header className="curriculum-hero">
        <button className="curriculum-back" type="button" onClick={onGoBack}>
          <span aria-hidden="true">←</span> 더보기
        </button>
        <p className="curriculum-kicker">HOME CURRICULUM</p>
        <h1>{HOME_CURRICULUM.title}</h1>
        <p className="curriculum-intro">{HOME_CURRICULUM.intro}</p>
      </header>

      <section className="curriculum-card curriculum-progress-card">
        <div className="curriculum-progress-head">
          <div>
            <span>진행률</span>
            <strong>
              {progress.completedCount}/{progress.totalSessions} 세션
            </strong>
          </div>
          <b>{progress.progressPercent}%</b>
        </div>
        <div className="curriculum-progress-bar" aria-hidden="true">
          <div style={{ width: `${progress.progressPercent}%` }} />
        </div>
        <p className="curriculum-progress-note">
          {progress.isComplete
            ? "4주 프로그램을 모두 마쳤습니다. 라운드 타이머로 반복 훈련해 보세요."
            : "세션을 완료하면 자동으로 체크됩니다."}
        </p>
      </section>

      {recommended ? (
        <section className="curriculum-card curriculum-today-card">
          <p className="curriculum-section-label">TODAY</p>
          <h2>오늘 추천 세션</h2>
          <div className="curriculum-today-body">
            <div>
              <span>
                {recommended.weekLabel} · {recommended.code}
              </span>
              <strong>{recommended.title}</strong>
              <p>{recommended.goal}</p>
            </div>
            <button
              type="button"
              className="curriculum-cta"
              onClick={() => handleStartSession(recommended)}
            >
              타이머로 시작
            </button>
          </div>
          <div className="curriculum-today-meta">
            <span>{recommended.rounds}R</span>
            <span>라운드 {Math.round(recommended.workSeconds / 60)}분</span>
            <span>휴식 {recommended.restSeconds}초</span>
          </div>
        </section>
      ) : null}

      <section className="curriculum-card">
        <p className="curriculum-section-label">EQUIPMENT</p>
        <h2>준비물</h2>
        <ul className="curriculum-equipment-list">
          {HOME_CURRICULUM.equipment.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <div className="curriculum-week-list">
        {HOME_CURRICULUM.weeks.map((week) => {
          const weekSessions = sessions.filter(
            (session) => session.weekId === week.id
          );
          const weekCompleted = weekSessions.filter((session) =>
            isCurriculumSessionComplete(session.id, progress)
          ).length;
          const isOpen = openWeekId === week.id;

          return (
            <section className="curriculum-card curriculum-week-card" key={week.id}>
              <button
                type="button"
                className="curriculum-week-toggle"
                onClick={() => toggleWeek(week.id)}
                aria-expanded={isOpen}
              >
                <div>
                  <p className="curriculum-section-label">{week.label}</p>
                  <h2>{week.theme}</h2>
                </div>
                <div className="curriculum-week-toggle-meta">
                  <span>
                    {weekCompleted}/{weekSessions.length}
                  </span>
                  <em>{isOpen ? "접기 ▲" : "펼치기 ▼"}</em>
                </div>
              </button>

              {isOpen ? (
                <div className="curriculum-session-list">
                  {weekSessions.map((session) => {
                    const completed = isCurriculumSessionComplete(
                      session.id,
                      progress
                    );

                    return (
                      <article
                        className={`curriculum-session${completed ? " is-complete" : ""}${recommended?.id === session.id ? " is-next" : ""}`}
                        key={session.id}
                      >
                        <div className="curriculum-session-head">
                          <div>
                            <span>{session.code}</span>
                            <strong>{session.title}</strong>
                            <p>{session.goal}</p>
                          </div>
                          <div className="curriculum-session-badge">
                            {completed ? "완료" : recommended?.id === session.id ? "다음" : "대기"}
                          </div>
                        </div>

                        <ul className="curriculum-drill-list">
                          {session.drills.map((drill) => (
                            <li key={`${session.id}-${drill.name}`}>
                              <strong>{drill.name}</strong>
                              <span>{drill.duration}</span>
                              <p>{drill.description}</p>
                            </li>
                          ))}
                        </ul>

                        <div className="curriculum-session-foot">
                          <span>
                            {session.rounds}R · {Math.round(session.workSeconds / 60)}분 · 휴식{" "}
                            {session.restSeconds}초
                          </span>
                          <button
                            type="button"
                            className="curriculum-session-button"
                            onClick={() => handleStartSession(session)}
                          >
                            {completed ? "다시 하기" : "시작하기"}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>

      <button
        type="button"
        className="curriculum-refresh"
        onClick={refreshProgress}
      >
        진행 상태 새로고침
      </button>
    </main>
  );
}
