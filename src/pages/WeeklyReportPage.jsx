import { useMemo } from "react";
import { useTraining } from "../store/TrainingContext";
import { getFighterProgress } from "../utils/fighterProgress";
import { getLevelTitle, getNextTitleMilestone } from "../utils/fighterTitles";
import { buildWeeklyReport } from "../utils/trainingStats";

export default function WeeklyReportPage({ onGoBack }) {
  const { logs, weeklyScore, seasonInfo } = useTraining();

  const report = useMemo(() => buildWeeklyReport(logs), [logs]);
  const fighter = useMemo(() => getFighterProgress(logs), [logs]);
  const nextTitle = getNextTitleMilestone(fighter.level);

  return (
    <main className="report-page">
      <header className="report-hero">
        <button className="category-back" type="button" onClick={onGoBack}>
          <span>←</span> 성장
        </button>
        <div className="report-hero-copy">
          <p>WEEKLY REPORT</p>
          <h1>주간 리포트</h1>
          <span>{report.weekLabel} · 이번 주 D-{seasonInfo.daysLeft}</span>
        </div>
      </header>

      <section className="report-summary-grid">
        <article className="report-stat-card primary">
          <span>총 라운드</span>
          <strong>{report.totalRounds}R</strong>
          <small>{report.totalSessions}회 훈련</small>
        </article>
        <article className="report-stat-card">
          <span>스파링</span>
          <strong>{report.sparringCount}회</strong>
          <small>{report.sparringRounds}R</small>
        </article>
        <article className="report-stat-card">
          <span>주간 점수</span>
          <strong>{weeklyScore}</strong>
          <small>이번 주 활동</small>
        </article>
        <article className="report-stat-card">
          <span>훈련 시간</span>
          <strong>{report.totalMinutes}분</strong>
          <small>누적 볼륨</small>
        </article>
      </section>

      <section className="report-panel">
        <p className="home-section-label">GROWTH</p>
        <h2>
          {fighter.isMaxLevel
            ? "최대 레벨 달성"
            : `다음 레벨까지 ${fighter.xpToNextLevel} EXP`}
        </h2>
        <p className="report-note">
          {fighter.levelLabel} · {fighter.fighterTitle} ({fighter.fighterTitleEn})
          {nextTitle
            ? ` · 다음 칭호: LV.${nextTitle.level} ${nextTitle.ko}`
            : " · 백 단계 정점에 도달했습니다."}
        </p>
      </section>

      <section className="report-panel">
        <p className="home-section-label">HIGHLIGHTS</p>
        <h2>이번 주 요약</h2>
        <ul className="report-highlight-list">
          {report.highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="report-panel">
        <div className="home-section-heading">
          <div>
            <p className="home-section-label">TRAINING MIX</p>
            <h2>훈련 구성</h2>
          </div>
        </div>

        {report.breakdown.length === 0 ? (
          <p className="report-empty">이번 주 훈련 기록이 없습니다.</p>
        ) : (
          <div className="breakdown-list">
            {report.breakdown.map((item) => (
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
                        report.totalRounds > 0
                          ? Math.round((item.rounds / report.totalRounds) * 100)
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

      <section className="report-panel">
        <p className="home-section-label">CONDITION</p>
        <h2>컨디션 요약</h2>

        {report.conditionBreakdown.length === 0 ? (
          <p className="report-empty">컨디션 기록이 없습니다.</p>
        ) : (
          <div className="report-condition-list">
            {report.conditionBreakdown.map((item) => (
              <article className="report-condition-card" key={item.id}>
                <strong>{item.label}</strong>
                <span>{item.count}회</span>
                <span>{item.rounds}R</span>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="report-panel">
        <p className="home-section-label">DAILY LOG</p>
        <h2>요일별 활동</h2>

        {report.dailyActivity.length === 0 ? (
          <p className="report-empty">아직 이번 주 기록이 없습니다.</p>
        ) : (
          <div className="report-daily-list">
            {report.dailyActivity.map((day) => (
              <article className="report-daily-card" key={day.date}>
                <strong>{day.date.replaceAll("-", ".")}</strong>
                <span>{day.sessions}회</span>
                <span>{day.rounds}R</span>
                <span>{day.minutes}분</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
