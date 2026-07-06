import { useMemo } from "react";
import { useTraining } from "../store/TrainingContext";
import { buildJourneyData } from "../utils/fighterJourney";
import { getLogRounds } from "../utils/trainingStats";
import "./JourneyPage.css";

function formatDateLabel(dateKey) {
  if (!dateKey) return "";

  return String(dateKey).replaceAll("-", ".");
}

export default function JourneyPage({ onStartTraining }) {
  const { logs, profile, weeklyScore, currentTier } = useTraining();

  const journey = useMemo(
    () => buildJourneyData({ logs, profile, weeklyScore, currentTier }),
    [logs, profile, weeklyScore, currentTier]
  );

  const { summary, timeline, memories, achievements } = journey;
  const unlockedCount = achievements.filter((item) => item.unlocked).length;

  return (
    <main className="journey-page">
      <header className="journey-hero">
        <p className="journey-kicker">MY JOURNEY</p>
        <h1>추억 보기</h1>
        <p className="journey-story">{summary.storyLine}</p>
      </header>

      <section className="journey-card journey-summary-card">
        <div className="journey-summary-grid">
          <div>
            <span>주인공</span>
            <strong>{summary.nickname}</strong>
          </div>
          <div>
            <span>등급</span>
            <strong>{summary.levelLabel}</strong>
          </div>
          <div>
            <span>누적</span>
            <strong>{summary.totalRounds}R</strong>
          </div>
          <div>
            <span>연속</span>
            <strong>{summary.streakDays}일</strong>
          </div>
        </div>
        <p className="journey-summary-note">
          {summary.tierName} · 이번 주 {summary.weeklyScore}점 · 총 EXP{" "}
          {summary.totalExp}
        </p>
      </section>

      {logs.length === 0 ? (
        <section className="journey-card journey-empty">
          <p>아직 쌓인 추억이 없어요.</p>
          <button type="button" className="journey-cta" onClick={onStartTraining}>
            첫 훈련 시작하기
          </button>
        </section>
      ) : (
        <>
          <section className="journey-card">
            <div className="journey-section-head">
              <div>
                <p className="journey-section-label">TIMELINE</p>
                <h2>이정표</h2>
              </div>
              <span className="journey-count">{timeline.length}개</span>
            </div>

            <div className="journey-timeline">
              {timeline.map((item, index) => (
                <article className="journey-timeline-item" key={item.id}>
                  <div className="journey-timeline-marker" aria-hidden="true">
                    <span />
                    {index < timeline.length - 1 ? <i /> : null}
                  </div>
                  <div className="journey-timeline-body">
                    <time>{formatDateLabel(item.date)}</time>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="journey-card">
            <div className="journey-section-head">
              <div>
                <p className="journey-section-label">MEMORIES</p>
                <h2>기억에 남는 훈련</h2>
              </div>
            </div>

            {memories.length === 0 ? (
              <p className="journey-muted">
                기록에 메모나 공개 코멘트를 남기면 여기에 쌓입니다.
              </p>
            ) : (
              <div className="journey-memory-list">
                {memories.map((log) => {
                  const rounds = getLogRounds(log);

                  return (
                    <article className="journey-memory-item" key={log.id}>
                      <div className="journey-memory-top">
                        <div>
                          <strong>{log.type}</strong>
                          <p>
                            {formatDateLabel(log.date)} · {rounds}R ·{" "}
                            {log.minutes || log.duration}분
                          </p>
                        </div>
                        <span>+{log.score} EXP</span>
                      </div>
                      <blockquote>
                        {log.publicComment || log.memo}
                      </blockquote>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="journey-card">
            <div className="journey-section-head">
              <div>
                <p className="journey-section-label">ACHIEVEMENTS</p>
                <h2>업적</h2>
              </div>
              <span className="journey-count">
                {unlockedCount}/{achievements.length}
              </span>
            </div>

            <div className="journey-achievement-list">
              {achievements.map((achievement) => (
                <div
                  className={`journey-achievement${achievement.unlocked ? " is-unlocked" : ""}`}
                  key={achievement.id}
                >
                  <span>{achievement.unlocked ? "완료" : "잠김"}</span>
                  <div>
                    <strong>{achievement.title}</strong>
                    <p>{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
