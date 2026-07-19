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
import { getTrainingStreak } from "./profilePage/profileCardUtils";
import {
  buildWeeklyRoundTrend,
  getWeeklyTrendSummary,
} from "../utils/trainingStats";
import { getTodaysLessonPreview } from "../utils/dailyLesson";
import { getFirstWeekChallengeStatus } from "../utils/retentionMetrics";

const HOME_FEATURES_KEY = "fitness-league-home-features";

function loadSelectedFeatures() {
  const validIds = new Set(DASHBOARD_SHORTCUT_POOL.map((item) => item.id));

  try {
    const saved = JSON.parse(localStorage.getItem(HOME_FEATURES_KEY) || "null");

    if (!Array.isArray(saved)) {
      return DEFAULT_HOME_SHORTCUTS;
    }

    const filtered = saved.filter((id) => validIds.has(id));
    return filtered.length > 0 ? filtered : DEFAULT_HOME_SHORTCUTS;
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
  onGoProfile,
  onNavigate,
  onNavigateGym,
  onOpenCardMaker,
  onOpenCurriculum,
  onReadLesson,
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

  const todaysLesson = useMemo(() => getTodaysLessonPreview(), []);
  const firstWeekChallenge = useMemo(
    () => getFirstWeekChallengeStatus(logs),
    [logs]
  );

  const topTrainingType = trainingBreakdown[0]?.type || null;
  const todayKey = getTodayKey();
  const todayRounds = dashboard.trainingByDate[todayKey]?.rounds || 0;
  const nickname = profile?.nickname || "나";

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

      <section className="home-brand" aria-label="브랜드 소개">
        <div className="home-brand-hero">
          <div className="home-brand-top">
            <div
              className="home-brand-avatar"
              aria-hidden={!profile?.photo}
            >
              {profile?.photo ? (
                <img src={profile.photo} alt="" />
              ) : (
                <span>{nickname.slice(0, 1)}</span>
              )}
            </div>
            <div className="home-brand-identity">
              <p className="home-brand-name">ROUND ON</p>
              <p className="home-brand-meta">
                {nickname} · LV.{dashboard.level} · {dashboard.fighterTitle}
              </p>
            </div>
          </div>

          <h1 className="home-brand-title">I RULE THE ROUND.</h1>
          <p className="home-brand-copy">
            EVERY BELL. EVERY ROUND. MINE.
          </p>
          <p className="home-brand-line">
            LIFE GOES ON. SO DOES THE FIGHT.
          </p>
        </div>

        <div className="home-brand-actions">
          <button
            type="button"
            className="home-brand-primary"
            data-tutorial-target="home-start"
            onClick={() => {
              if (todaysLesson.kind === "session") {
                onReadLesson?.(todaysLesson.session);
                return;
              }
              onOpenTimer?.();
            }}
          >
            {todaysLesson.kind === "session"
              ? "오늘 레슨 열기"
              : dashboard.trainedToday
                ? "오늘 훈련 이어가기"
                : "오늘 훈련 시작"}
          </button>
          <button
            type="button"
            className="home-brand-secondary"
            onClick={onGoProfile}
          >
            내 명패 보기
          </button>
        </div>
      </section>

      <section className="home-today-task" aria-label="오늘">
        <p className="home-today-task-label">오늘</p>

        {todaysLesson.kind === "session" ? (
          <>
            <h2 className="home-today-task-title">{todaysLesson.title}</h2>
            {todaysLesson.goal ? (
              <p className="home-today-task-copy">{todaysLesson.goal}</p>
            ) : (
              <p className="home-today-task-copy">
                레슨을 읽고, 준비되면 타이머로 이어가세요.
              </p>
            )}
            {todaysLesson.weekLabel || todaysLesson.code ? (
              <p className="home-today-task-meta">
                {[todaysLesson.weekLabel, todaysLesson.code]
                  .filter(Boolean)
                  .join(" · ")}
                {todaysLesson.totalSessions
                  ? ` · ${todaysLesson.completedCount}/${todaysLesson.totalSessions}`
                  : ""}
              </p>
            ) : null}

            <div className="home-today-task-links">
              <button
                type="button"
                className="home-today-task-link"
                onClick={onOpenTimer}
              >
                타이머로 훈련
              </button>
              <button
                type="button"
                className="home-today-task-link"
                onClick={() => onOpenCurriculum?.()}
              >
                커리큘럼 전체
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="home-today-task-title">{todaysLesson.title}</h2>
            <p className="home-today-task-copy">
              {todaysLesson.message ||
                "짧게라도 라운드를 남기면 오늘의 흔적이 됩니다."}
            </p>
            <div className="home-today-task-links">
              <button
                type="button"
                className="home-today-task-link"
                onClick={() => onOpenCurriculum?.()}
              >
                커리큘럼 보기
              </button>
            </div>
          </>
        )}
      </section>

      <section className="home-center-dash" aria-label="오늘의 흔적">
        <div className="home-center-dash-head">
          <p className="home-center-dash-label">오늘의 흔적</p>
          <button
            type="button"
            className={`home-center-dash-edit${
              isEditingDashboard ? " is-active" : ""
            }`}
            onClick={() => setIsEditingDashboard((current) => !current)}
          >
            {isEditingDashboard ? "완료" : "편집"}
          </button>
        </div>

        <div className="home-center-dash-stats">
          <div>
            <span>오늘</span>
            <strong>{todayRounds}R</strong>
          </div>
          <div>
            <span>연속</span>
            <strong>{dashboard.streakDays}일</strong>
          </div>
          <div>
            <span>누적</span>
            <strong>{dashboard.totalRounds}R</strong>
          </div>
        </div>

        {visibleFeatures.length === 0 ? (
          <button
            type="button"
            className="home-center-dash-empty"
            onClick={() => setIsEditingDashboard(true)}
          >
            바로가기 추가
          </button>
        ) : (
          <div className="home-center-dash-grid">
            {visibleFeatures.map((feature) => {
              const locked =
                feature.featureId &&
                !isFeatureUnlocked(feature.featureId, fighterLevel);

              return (
                <button
                  type="button"
                  className="home-center-dash-item"
                  key={feature.id}
                  onClick={() => openFeature(feature)}
                  disabled={locked}
                >
                  <span aria-hidden="true">{feature.icon}</span>
                  <strong>{feature.title}</strong>
                  {locked ? <em>잠김</em> : null}
                </button>
              );
            })}
          </div>
        )}

        {isEditingDashboard ? (
          <div className="home-center-dash-editor">
            <p>홈에 둘 바로가기를 고르세요.</p>
            <div className="home-center-dash-editor-grid">
              {DASHBOARD_SHORTCUT_POOL.map((feature) => {
                const selected = selectedFeatures.includes(feature.id);
                const locked =
                  feature.featureId &&
                  !isFeatureUnlocked(feature.featureId, fighterLevel);

                return (
                  <button
                    type="button"
                    className={`home-center-dash-pick${
                      selected ? " is-selected" : ""
                    }${locked ? " is-locked" : ""}`}
                    key={feature.id}
                    onClick={() => toggleDashboardFeature(feature.id)}
                  >
                    <span aria-hidden="true">{feature.icon}</span>
                    <strong>{feature.title}</strong>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </section>

      <details className="home-collapsible home-status-details">
        <summary className="home-collapsible-summary">
          <span className="home-section-label">내 현황</span>
          <strong>
            누적 {dashboard.totalRounds}R · {dashboard.trendSummary.label}
          </strong>
        </summary>

        <div className="home-status-details-body">
          {dashboard.lastLog && dashboard.trainedToday ? (
            <div className="home-today-victory">
              <p className="home-today-victory-kicker">오늘 기록</p>
              <div className="home-today-victory-statline">
                <strong>{getRounds(dashboard.lastLog)}R</strong>
                <span>·</span>
                <em>+{dashboard.lastLogExp} EXP</em>
              </div>
              <p className="home-today-victory-copy">
                {dashboard.lastLog.type} ·{" "}
                {dashboard.lastLog.minutes || dashboard.lastLog.duration}분
              </p>
              <button
                type="button"
                className="home-today-card-link"
                onClick={() => onOpenCardMaker?.(dashboard.lastLog?.id)}
              >
                인증 카드 만들기
              </button>
            </div>
          ) : (
            <p className="home-today-ready-inline">
              오늘 첫 라운드를 하면 기록이 여기에 쌓입니다.
            </p>
          )}

          <div className="home-growth-highlight home-today-metrics">
            <div className="home-growth-main-stat">
              <span>이번 주 추세</span>
              <strong className={`home-growth-trend tone-${dashboard.trendSummary.tone}`}>
                {dashboard.trendSummary.label}
              </strong>
            </div>
            <div className="home-growth-side-stats">
              <div>
                <span>주간 EXP</span>
                <strong>{weeklyScore}</strong>
              </div>
              <div>
                <span>칭호</span>
                <strong>{dashboard.fighterTitle}</strong>
              </div>
            </div>
          </div>

          {firstWeekChallenge ? (
            <div className="home-first-week-challenge" aria-label="첫 주 챌린지">
              <p className="home-first-week-kicker">첫 주</p>
              <div className="home-first-week-stats">
                <div>
                  <span>훈련</span>
                  <strong>
                    {firstWeekChallenge.timerCompletes}/
                    {firstWeekChallenge.timerTarget}
                  </strong>
                </div>
                <div>
                  <span>방문</span>
                  <strong>
                    {firstWeekChallenge.openDays}/
                    {firstWeekChallenge.openTarget}일
                  </strong>
                </div>
                <div>
                  <span>남은 날</span>
                  <strong>D-{firstWeekChallenge.daysLeft}</strong>
                </div>
              </div>
            </div>
          ) : null}

          <button
            type="button"
            className="home-secondary-button"
            onClick={onStartTraining}
          >
            훈련 메뉴에서 더 보기
          </button>

          {todaysLesson.kind === "session" ? (
            <button
              type="button"
              className="home-today-task-link home-today-task-link-block"
              onClick={() => onOpenCurriculum?.()}
            >
              커리큘럼 전체 보기
            </button>
          ) : null}
        </div>
      </details>

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

      <p className="home-backup-hint">
        훈련 기록은 이 기기에 저장됩니다.{" "}
        <button type="button" onClick={() => onNavigate?.("backup")}>
          데이터 백업
        </button>
        으로 JSON 보관을 권장해요.
      </p>
    </main>
  );
}
