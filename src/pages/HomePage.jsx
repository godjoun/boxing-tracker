import { useMemo, useState } from "react";
import { useTraining } from "../store/TrainingContext";
import { buildTrainingBreakdown } from "../utils/trainingBreakdown";
import {
  DASHBOARD_SHORTCUT_POOL,
  DEFAULT_HOME_SHORTCUTS,
  getDashboardShortcut,
} from "../utils/appMenu";
import { isFeatureUnlocked } from "../utils/featureUnlocks";
import { getFighterProgress, getLogExp } from "../utils/fighterProgress";
import { getSparringUnlockProgress, SPARRING_UNLOCK_LEVEL } from "../utils/featureUnlocks";
import { getLevelTitle } from "../utils/fighterTitles";
import { getNextVeteranPerk } from "../utils/veteranPerks";
import { getTrainingStreak } from "./profilePage/profileCardUtils";
import {
  buildWeeklyRoundTrend,
  getWeeklyTrendSummary,
} from "../utils/trainingStats";

const HOME_FEATURES_KEY = "fitness-league-home-features";

function loadSelectedFeatures() {
  try {
    const saved = JSON.parse(localStorage.getItem(HOME_FEATURES_KEY) || "null");
    return Array.isArray(saved) ? saved : DEFAULT_HOME_SHORTCUTS;
  } catch {
    return DEFAULT_HOME_SHORTCUTS;
  }
}

function getDateKey(value) {
  if (!value) return "";

  const raw = String(value).trim();
  const dateOnlyMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return `${year}-${month}-${day}`;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return raw.slice(0, 10);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getRounds(log) {
  return Number(
    log.rounds ||
      log.totalRounds ||
      log.completedRounds ||
      log.sets ||
      log.count ||
      0
  ) || 0;
}

function getTodayKey() {
  return getDateKey(new Date());
}

function buildMonthDays(now = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  return [
    ...Array.from({ length: firstDay }, (_, index) => ({
      key: `empty-${index}`,
      empty: true,
    })),
    ...Array.from({ length: lastDate }, (_, index) => {
      const day = index + 1;
      return {
        key: getDateKey(new Date(year, month, day)),
        day,
      };
    }),
  ];
}

export default function HomePage({
  fighterLevel = 1,
  timerSummary = null,
  onStartTraining,
  onOpenTimer,
  onNavigate,
  onNavigateGym,
  onOpenCardMaker,
}) {
  const { logs = [], profile, weeklyScore } = useTraining();
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState(loadSelectedFeatures);
  const [isEditingDashboard, setIsEditingDashboard] = useState(false);

  const dashboard = useMemo(() => {
    const fighter = getFighterProgress(logs);
    const weeklyTrend = buildWeeklyRoundTrend(logs, 4);
    const trendSummary = getWeeklyTrendSummary(weeklyTrend);
    const streakDays = getTrainingStreak(logs);
    const todayKey = getTodayKey();
    const lastLog = logs[0] || null;

    const trainingByDate = logs.reduce((dates, log) => {
      const key = getDateKey(log.date || log.createdAt);
      if (!key) return dates;

      if (!dates[key]) {
        dates[key] = { count: 0, rounds: 0, types: [] };
      }

      dates[key].count += 1;
      dates[key].rounds += getRounds(log);

      const exerciseType = (log.type || "훈련").trim();
      if (exerciseType && !dates[key].types.includes(exerciseType)) {
        dates[key].types.push(exerciseType);
      }

      return dates;
    }, {});

    return {
      totalRounds: fighter.totalRounds,
      totalExp: fighter.totalExp,
      weeklyExp: fighter.weeklyExp,
      level: fighter.level,
      currentExp: fighter.currentLevelExp,
      progressPercent: fighter.progressPercent,
      expToNext: fighter.xpToNextLevel,
      nextLevelExp: fighter.nextLevelExp,
      isMaxLevel: fighter.isMaxLevel,
      weeklyRounds: fighter.weeklyRounds,
      fighterTitle: fighter.fighterTitle,
      fighterTitleEn: fighter.fighterTitleEn,
      careerStageKo: fighter.careerStageKo,
      weeklyTrend,
      trendSummary,
      streakDays,
      trainedToday: Boolean(trainingByDate[todayKey]),
      lastLog,
      lastLogExp: lastLog ? getLogExp(lastLog) : 0,
      trainingByDate,
      monthDays: buildMonthDays(),
    };
  }, [logs, weeklyScore]);

  const selectedDayTraining = selectedDate
    ? dashboard.trainingByDate[selectedDate]
    : null;

  const visibleFeatures = selectedFeatures
    .map((id) => getDashboardShortcut(id))
    .filter(Boolean);

  const trainingBreakdown = useMemo(
    () => buildTrainingBreakdown(logs),
    [logs]
  );

  const topTrainingType = trainingBreakdown[0]?.type || null;

  function handleCalendarSelect(dateKey) {
    setSelectedDate((current) => (current === dateKey ? "" : dateKey));
  }

  function openFeature(feature) {
    if (
      feature.featureId &&
      !isFeatureUnlocked(feature.featureId, fighterLevel)
    ) {
      return;
    }

    if (feature.action === "card-maker") {
      onOpenCardMaker?.();
      return;
    }

    if (feature.route === "gym") {
      onNavigateGym?.(feature.gymView || "hub");
      return;
    }

    onNavigate?.(feature.route);
  }

  function toggleDashboardFeature(featureId) {
    setSelectedFeatures((currentFeatures) => {
      const nextFeatures = currentFeatures.includes(featureId)
        ? currentFeatures.filter((id) => id !== featureId)
        : [...currentFeatures, featureId];

      localStorage.setItem(HOME_FEATURES_KEY, JSON.stringify(nextFeatures));
      return nextFeatures;
    });
  }

  const now = new Date();
  const monthTitle = `${now.getFullYear()}. ${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
  const sparringProgress = getSparringUnlockProgress(fighterLevel);
  const sparringTitle = getLevelTitle(SPARRING_UNLOCK_LEVEL);
  const nextVeteranPerk = getNextVeteranPerk(fighterLevel);

  return (
    <main className="home-page">
      {timerSummary?.isActive ? (
        <button
          type="button"
          className="timer-home-banner"
          onClick={onOpenTimer}
        >
          <div className="timer-home-banner-copy">
            <span className="timer-home-banner-kicker">
              {timerSummary.isRunning ? "훈련 진행 중" : "훈련 일시정지"}
            </span>
            <strong>
              {timerSummary.phaseLabel} {timerSummary.timeLabel}
            </strong>
            <p>
              {timerSummary.roundLabel} · {timerSummary.title}
            </p>
          </div>
          <em>타이머 열기</em>
        </button>
      ) : null}

      <section className="home-growth-hero">
        <div className="home-growth-head">
          <div>
            <p className="home-kicker">성장 현황</p>
            <h1>{profile?.nickname || "나의 파이터"}</h1>
            <p className="home-growth-title">{dashboard.fighterTitle}</p>
            {dashboard.fighterTitleEn ? (
              <p className="home-growth-title-en">{dashboard.fighterTitleEn}</p>
            ) : null}
          </div>
          <div className="home-growth-lv">
            <span>LV</span>
            <strong>{dashboard.level}</strong>
            <small>{dashboard.careerStageKo || "일반인"}</small>
          </div>
        </div>

        <div className="home-growth-highlight">
          <div className="home-growth-main-stat">
            <span>이번 주 라운드</span>
            <strong>{dashboard.weeklyRounds}R</strong>
            <em className={`home-growth-trend tone-${dashboard.trendSummary.tone}`}>
              {dashboard.trendSummary.label}
            </em>
          </div>

          <div className="home-growth-side-stats">
            <div>
              <span>이번 주 EXP</span>
              <strong>{dashboard.weeklyExp}</strong>
            </div>
            <div>
              <span>연속 훈련</span>
              <strong>{dashboard.streakDays}일</strong>
            </div>
          </div>
        </div>

        <div className="home-exp-meta">
          <span>LV. {dashboard.level}</span>
          <b>
            {dashboard.isMaxLevel
              ? `MAX LV.${dashboard.level}`
              : `${dashboard.currentExp} / ${dashboard.nextLevelExp} EXP`}{" "}
            · 누적 {dashboard.totalRounds}R
          </b>
        </div>
        <div className="home-exp-bar" aria-label="현재 레벨 경험치">
          <div style={{ width: `${dashboard.progressPercent}%` }} />
        </div>
        <p className="home-exp-copy">
          {dashboard.isMaxLevel ? (
            <strong>최대 레벨 달성</strong>
          ) : (
            <>
              다음 레벨까지 <strong>{dashboard.expToNext} EXP</strong>
            </>
          )}
        </p>

        {!sparringProgress.unlocked ? (
          <p className="home-growth-empty">
            LV.{sparringProgress.unlockLevel}{" "}
            <strong>{sparringTitle.ko}</strong> 칭호 달성 시 스파링 상대찾기 해금
          </p>
        ) : nextVeteranPerk ? (
          <p className="home-growth-empty">
            LV.{nextVeteranPerk.level} 베테랑 혜택{" "}
            <strong>{nextVeteranPerk.label}</strong> 해금 예정 · 여정 탭에서 확인
          </p>
        ) : null}

        {dashboard.lastLog ? (
          <div className="home-last-growth">
            <div>
              <span className="home-last-growth-label">최근 훈련</span>
              <strong>{dashboard.lastLog.type}</strong>
              <p>
                {getRounds(dashboard.lastLog)}R ·{" "}
                {dashboard.lastLog.minutes || dashboard.lastLog.duration}분 ·{" "}
                {dashboard.lastLog.date}
              </p>
            </div>
            <div className="home-last-growth-exp">
              +{dashboard.lastLogExp} EXP
            </div>
          </div>
        ) : (
          <p className="home-growth-empty">
            첫 훈련을 완료하면 여기에 성장 기록이 쌓입니다.
          </p>
        )}
      </section>

      <div className="home-cta-row">
        <button
          type="button"
          className="home-main-button"
          data-tutorial-target="home-start"
          onClick={onOpenTimer}
        >
          <span>
            {dashboard.trainedToday ? "훈련 이어가기" : "3R 바로 시작"}
          </span>
          <b>→</b>
        </button>

        <button
          type="button"
          className="home-secondary-button"
          onClick={onStartTraining}
        >
          레벨업 메뉴에서 더 보기
        </button>
      </div>

      {dashboard.weeklyTrend.length > 0 ? (
        <details className="home-collapsible">
          <summary className="home-collapsible-summary">
            <span className="home-section-label">주간 성장</span>
            <strong>주간 라운드 추이 · {weeklyScore} EXP</strong>
          </summary>
        <section className="home-weekly-trend" aria-label="주간 라운드 추이">
          <div className="home-section-heading">
            <div>
              <h2>주간 라운드 추이</h2>
            </div>
          </div>

          <div className="home-weekly-bars">
            {dashboard.weeklyTrend.map((week) => (
              <div
                className={`home-weekly-bar${week.isCurrentWeek ? " is-current" : ""}`}
                key={week.weekKey}
              >
                <div className="home-weekly-bar-track">
                  <div style={{ height: `${week.barHeightPercent}%` }} />
                </div>
                <strong>{week.rounds}R</strong>
                <span>{week.shortLabel}</span>
              </div>
            ))}
          </div>
        </section>
        </details>
      ) : null}

      <details className="home-collapsible">
        <summary className="home-collapsible-summary">
          <span className="home-section-label">훈련 구성</span>
          <strong>
            {topTrainingType ? `TOP · ${topTrainingType}` : "내 훈련 구성"}
          </strong>
        </summary>
      <section className="home-training-breakdown">
        <div className="home-section-heading">
          <div>
            <h2>내 훈련 구성</h2>
          </div>
        </div>

        {trainingBreakdown.length === 0 ? (
          <p className="breakdown-empty">
            훈련 기록을 작성하면 가장 많이 한 운동이 여기에 쌓입니다.
          </p>
        ) : (
          <div className="breakdown-list">
            {trainingBreakdown.map((item) => (
              <div className="breakdown-row" key={item.type}>
                <div className="breakdown-label">
                  <strong>{item.type}</strong>
                  <span>
                    {item.count}회 · {item.minutes}분
                    {item.rounds > 0 ? ` · ${item.rounds}R` : ""}
                  </span>
                </div>
                <div className="breakdown-bar" aria-hidden="true">
                  <div style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      </details>

      <details className="home-collapsible">
        <summary className="home-collapsible-summary">
          <span className="home-section-label">빠른 메뉴</span>
          <strong>나의 파이터 대시보드</strong>
        </summary>
      <section className="home-features home-quick-dashboard">
        <div className="home-section-heading">
          <div>
            <h2>나의 파이터 대시보드</h2>
          </div>
          <button
            className={`dashboard-edit-button ${
              isEditingDashboard ? "active" : ""
            }`}
            onClick={() => setIsEditingDashboard((current) => !current)}
          >
            {isEditingDashboard ? "완료" : "편집"}
          </button>
        </div>

        {visibleFeatures.length === 0 ? (
          <button
            className="dashboard-empty"
            onClick={() => setIsEditingDashboard(true)}
          >
            홈에 표시할 기능을 선택하세요 <span>+</span>
          </button>
        ) : (
          <div className="dashboard-quick-grid">
            {visibleFeatures.map((feature) => {
              const locked =
                feature.featureId &&
                !isFeatureUnlocked(feature.featureId, fighterLevel);

              return (
                <button
                  className="dashboard-quick-item"
                  key={feature.id}
                  onClick={() => openFeature(feature)}
                  disabled={locked}
                >
                  <span className="dashboard-quick-icon">{feature.icon}</span>
                  <strong>{feature.title}</strong>
                  {locked ? <em>잠김</em> : null}
                </button>
              );
            })}
          </div>
        )}

        {isEditingDashboard ? (
          <div className="dashboard-editor">
            <div className="dashboard-editor-copy">
              <strong>홈 기능 선택</strong>
              <span>자주 쓰는 기능만 대시보드에 표시됩니다.</span>
            </div>
            <div className="dashboard-editor-grid">
              {DASHBOARD_SHORTCUT_POOL.map((feature) => {
                const selected = selectedFeatures.includes(feature.id);
                const locked =
                  feature.featureId &&
                  !isFeatureUnlocked(feature.featureId, fighterLevel);

                return (
                  <button
                    className={`${selected ? "selected" : ""}${
                      locked ? " is-locked" : ""
                    }`}
                    key={feature.id}
                    onClick={() => toggleDashboardFeature(feature.id)}
                  >
                    <span>{feature.icon}</span>
                    <strong>{feature.title}</strong>
                    <i>{selected ? "" : "+"}</i>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </section>
      </details>

      <details className="home-collapsible">
        <summary className="home-collapsible-summary">
          <span className="home-section-label">캘린더</span>
          <strong>이번 달 훈련 · {monthTitle}</strong>
        </summary>
      <section className="training-calendar">
        <div className="home-section-heading">
          <div>
            <h2>이번 달 훈련</h2>
          </div>
        </div>

        <div className="calendar-weekdays" aria-hidden="true">
          {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="calendar-grid">
          {dashboard.monthDays.map((date) => {
            if (date.empty) {
              return <span className="calendar-day empty" key={date.key} />;
            }

            const training = dashboard.trainingByDate[date.key];
            const isSelected = selectedDate === date.key;

            return (
              <button
                type="button"
                className={[
                  "calendar-day",
                  training ? "trained" : "selectable",
                  isSelected ? "selected" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={date.key}
                onClick={() => handleCalendarSelect(date.key)}
                aria-label={`${date.day}일${
                  training ? `, 훈련 ${training.count}회` : ", 훈련 없음"
                }`}
                aria-pressed={isSelected}
              >
                {date.day}
                {training && <i />}
              </button>
            );
          })}
        </div>

        {logs.length === 0 ? (
          <p className="calendar-empty">
            아직 훈련 기록이 없습니다.<br />오늘 첫 훈련을 시작해보세요.
          </p>
        ) : selectedDate && selectedDayTraining ? (
          <div className="calendar-detail">
            <span>{selectedDate.replaceAll("-", ".")}</span>
            <strong>
              훈련 {selectedDayTraining.count}회 · {selectedDayTraining.rounds}R
            </strong>
            {selectedDayTraining.types?.length > 0 && (
              <p className="calendar-detail-types">
                {selectedDayTraining.types.join(" · ")}
              </p>
            )}
          </div>
        ) : selectedDate ? (
          <p className="calendar-hint">
            {selectedDate.replaceAll("-", ".")} — 이 날은 훈련 기록이 없습니다.
          </p>
        ) : (
          <p className="calendar-hint">
            날짜를 누르면 그날의 훈련 기록을 확인할 수 있어요.
          </p>
        )}
      </section>
      </details>

    </main>
  );
}
