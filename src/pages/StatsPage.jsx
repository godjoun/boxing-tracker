import { useMemo } from "react";
import { useTraining } from "../store/TrainingContext";
import { buildAllTimeStats, getLogRounds } from "../utils/trainingStats";

export default function StatsPage({ onGoWeekly }) {
  const { logs, weeklyScore } = useTraining();
  const stats = useMemo(() => buildAllTimeStats(logs), [logs]);
  const weekly = stats.weeklyReport;

  return (
    <main className="stats-page">
      <header className="stats-hero">
        <div>
          <p className="home-section-label">GROWTH</p>
          <h1>성장 분석</h1>
          <span>라운드 중심으로 훈련 볼륨과 구성을 확인하세요.</span>
        </div>
        {onGoWeekly && (
          <button type="button" className="stats-weekly-link" onClick={onGoWeekly}>
            주간 리포트 →
          </button>
        )}
      </header>

      <section className="stats-summary-grid">
        <article className="stats-card primary">
          <span>총 라운드</span>
          <strong>{stats.totalRounds}R</strong>
          <small>완료 라운드</small>
        </article>
        <article className="stats-card">
          <span>이번 주</span>
          <strong>{weekly.totalRounds}R</strong>
          <small>{weekly.totalSessions}회 훈련</small>
        </article>
        <article className="stats-card">
          <span>스파링</span>
          <strong>{stats.sparringCount}회</strong>
          <small>누적 실전 훈련</small>
        </article>
        <article className="stats-card">
          <span>주간 점수</span>
          <strong>{weeklyScore}</strong>
          <small>라운드 가중 점수</small>
        </article>
      </section>

      <section className="stats-panel">
        <p className="home-section-label">VOLUME</p>
        <h2>훈련 볼륨</h2>
        <div className="stats-meta-row">
          <div>
            <strong>{stats.totalSessions}회</strong>
            <span>누적 훈련</span>
          </div>
          <div>
            <strong>{stats.totalMinutes}분</strong>
            <span>총 시간</span>
          </div>
          <div>
            <strong>{stats.averageRoundsPerSession}R</strong>
            <span>회당 평균</span>
          </div>
          <div>
            <strong>{stats.timerLogs}회</strong>
            <span>타이머 자동 기록</span>
          </div>
        </div>
        {stats.topRoundDay && (
          <p className="stats-note">
            최고 볼륨 day: {stats.topRoundDay.date.replaceAll("-", ".")} ·{" "}
            {stats.topRoundDay.rounds}R
          </p>
        )}
      </section>

      <section className="stats-panel">
        <div className="home-section-heading">
          <div>
            <p className="home-section-label">TRAINING MIX</p>
            <h2>훈련 구성</h2>
          </div>
        </div>

        {stats.breakdown.length === 0 ? (
          <p className="stats-empty">아직 분석할 기록이 없습니다.</p>
        ) : (
          <div className="breakdown-list">
            {stats.breakdown.slice(0, 6).map((item) => (
              <div className="breakdown-row" key={item.type}>
                <div className="breakdown-label">
                  <strong>{item.type}</strong>
                  <span>
                    {item.count}회 · {item.rounds}R · {item.minutes}분
                  </span>
                </div>
                <div className="breakdown-bar">
                  <div
                    style={{
                      width: `${
                        stats.totalRounds > 0
                          ? Math.round((item.rounds / stats.totalRounds) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="stats-panel">
        <p className="home-section-label">RECENT LOGS</p>
        <h2>최근 훈련</h2>

        {logs.length === 0 ? (
          <p className="stats-empty">타이머로 첫 라운드를 시작해 보세요.</p>
        ) : (
          <div className="stats-log-list">
            {logs.slice(0, 8).map((log) => {
              const rounds = getLogRounds(log);

              return (
                <article className="stats-log-card" key={log.id}>
                  <div>
                    <strong>{log.type}</strong>
                    <p>{log.date}</p>
                  </div>
                  <div className="stats-log-badges">
                    <span className="round-badge">{rounds}R</span>
                    {log.conditionLabel && log.conditionLabel !== "보통" && (
                      <span className="round-badge">{log.conditionLabel}</span>
                    )}
                    <span>{log.minutes || log.duration}분</span>
                    <span>+{log.score}점</span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
