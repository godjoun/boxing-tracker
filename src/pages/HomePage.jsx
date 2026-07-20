import { useMemo, useState } from "react";
import { useTraining } from "../store/TrainingContext";
import { buildTrainingBreakdown } from "../utils/trainingBreakdown";
import { getFighterProgress, getLogExp } from "../utils/fighterProgress";
import { getTrainingStreak } from "./profilePage/profileCardUtils";
import {
  buildWeeklyRoundTrend,
  getWeeklyTrendSummary,
} from "../utils/trainingStats";
import { getTodaysLessonPreview } from "../utils/dailyLesson";
import { getFirstWeekChallengeStatus } from "../utils/retentionMetrics";
import { BRAND_NAME } from "../utils/brand";

const WEEKDAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

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
  return (
    Number(
      log.rounds ||
        log.totalRounds ||
        log.completedRounds ||
        log.sets ||
        log.count ||
        0
    ) || 0
  );
}

function getTodayKey() {
  return getDateKey(new Date());
}

function startOfWeekMonday(date = new Date()) {
  const current = new Date(date);
  current.setHours(0, 0, 0, 0);
  const day = current.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  current.setDate(current.getDate() + diff);
  return current;
}

function buildWeekStrip(trainingByDate, now = new Date()) {
  const monday = startOfWeekMonday(now);
  const todayKey = getDateKey(now);

  return WEEKDAY_LABELS.map((label, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const key = getDateKey(date);
    const training = trainingByDate[key];

    return {
      key,
      label,
      day: date.getDate(),
      trained: Boolean(training),
      rounds: training?.rounds || 0,
      isToday: key === todayKey,
    };
  });
}

function formatRecentLogLine(log, todayKey) {
  if (!log) {
    return {
      title: "아직 흔적이 없습니다",
      copy: "오늘 첫 벨을 울리면 여기에 남습니다.",
    };
  }

  const logKey = getDateKey(log.date || log.createdAt);
  const rounds = getRounds(log);
  const type = (log.type || "훈련").trim();
  const minutes = log.minutes || log.duration;

  let when = logKey.replaceAll("-", ".");
  if (logKey === todayKey) {
    when = "오늘";
  } else {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (logKey === getDateKey(yesterday)) {
      when = "어제";
    }
  }

  return {
    title: `${when} · ${rounds}R · ${type}`,
    copy: minutes ? `${minutes}분 남긴 기록` : "기록을 열어 다시 볼 수 있어요",
  };
}

function formatSceneDateLabel(now = new Date()) {
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return `${now.getMonth() + 1}월 ${now.getDate()}일 ${weekdays[now.getDay()]}요일`;
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
  fighterLevel: _fighterLevel = 1,
  timerSummary = null,
  onStartTraining,
  onOpenTimer,
  onGoProfile,
  onNavigate,
  onNavigateGym: _onNavigateGym,
  onOpenCardMaker,
  onOpenCurriculum,
  onReadLesson,
}) {
  const { logs = [], profile, weeklyScore } = useTraining();
  const [selectedDate, setSelectedDate] = useState("");

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
      weekStrip: buildWeekStrip(trainingByDate),
    };
  }, [logs, weeklyScore]);

  const selectedDayTraining = selectedDate
    ? dashboard.trainingByDate[selectedDate]
    : null;

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
  const sceneDateLabel = formatSceneDateLabel();
  const recentLine = formatRecentLogLine(dashboard.lastLog, todayKey);

  const sceneTitle =
    todaysLesson.kind === "session"
      ? todaysLesson.title
      : todaysLesson.title || "오늘도 벨을 울리자";

  const sceneCopy =
    todaysLesson.kind === "session"
      ? todaysLesson.goal || "레슨을 읽고, 준비되면 타이머로 이어가세요."
      : todaysLesson.message ||
        "짧게라도 라운드를 남기면 오늘의 흔적이 됩니다.";

  const primaryLabel =
    todaysLesson.kind === "session"
      ? "오늘 레슨 열기"
      : dashboard.trainedToday
        ? "오늘 훈련 이어가기"
        : "오늘 훈련 시작";

  function handleCalendarSelect(dateKey) {
    setSelectedDate((current) => (current === dateKey ? "" : dateKey));
  }

  function handlePrimaryAction() {
    if (todaysLesson.kind === "session") {
      onReadLesson?.(todaysLesson.session);
      return;
    }
    onOpenTimer?.();
  }

  function handleRecentClick() {
    if (dashboard.lastLog) {
      onOpenCardMaker?.(dashboard.lastLog.id);
      return;
    }
    onNavigate?.("log");
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

      <header className="home-scene-header">
        <div className="home-scene-header-identity">
          <div
            className="home-scene-avatar"
            aria-hidden={!profile?.photo}
          >
            {profile?.photo ? (
              <img src={profile.photo} alt="" />
            ) : (
              <span>{nickname.slice(0, 1)}</span>
            )}
          </div>
          <div className="home-scene-header-copy">
            <p className="home-scene-brand">{BRAND_NAME}</p>
            <p className="home-scene-meta">
              {nickname} · LV.{dashboard.level} · {dashboard.fighterTitle}
            </p>
          </div>
        </div>
      </header>

      <section className="home-scene-card" aria-label="오늘의 장면">
        <div className="home-scene-card-top">
          <p className="home-scene-kicker">TODAY</p>
          <p className="home-scene-date">
            {sceneDateLabel}
            {dashboard.streakDays > 0
              ? ` · 연속 ${dashboard.streakDays}일`
              : ""}
          </p>
        </div>

        <p className="home-scene-accent">ARE YOU READY?</p>
        <h1 className="home-scene-title">{sceneTitle}</h1>
        <p className="home-scene-copy">{sceneCopy}</p>

        {todaysLesson.kind === "session" &&
        (todaysLesson.weekLabel || todaysLesson.code) ? (
          <p className="home-scene-lesson-meta">
            {[todaysLesson.weekLabel, todaysLesson.code]
              .filter(Boolean)
              .join(" · ")}
            {todaysLesson.totalSessions
              ? ` · ${todaysLesson.completedCount}/${todaysLesson.totalSessions}`
              : ""}
          </p>
        ) : null}

        <div className="home-scene-actions">
          <button
            type="button"
            className="home-scene-primary"
            data-tutorial-target="home-start"
            onClick={handlePrimaryAction}
          >
            {primaryLabel}
          </button>
          <div className="home-scene-secondary-row">
            <button
              type="button"
              className="home-scene-secondary"
              onClick={onOpenTimer}
            >
              타이머
            </button>
            <button
              type="button"
              className="home-scene-secondary"
              onClick={onGoProfile}
            >
              명패
            </button>
          </div>
        </div>
      </section>

      <section className="home-week-strip" aria-label="이번 주 훈련 흔적">
        <div className="home-week-strip-head">
          <p className="home-week-strip-label">이번 주</p>
          <span>
            {dashboard.weekStrip.filter((day) => day.trained).length}일 훈련
          </span>
        </div>
        <div className="home-week-strip-days">
          {dashboard.weekStrip.map((day) => (
            <div
              key={day.key}
              className={`home-week-day${day.isToday ? " is-today" : ""}${
                day.trained ? " is-trained" : ""
              }`}
            >
              <span>{day.label}</span>
              <strong>{day.day}</strong>
              <i aria-hidden="true" />
            </div>
          ))}
        </div>
      </section>

      <button
        type="button"
        className="home-recent-line"
        onClick={handleRecentClick}
      >
        <span className="home-recent-line-kicker">최근</span>
        <strong>{recentLine.title}</strong>
        <em>{recentLine.copy}</em>
      </button>

      <section className="home-trace-stats" aria-label="흔적">
        <p className="home-trace-stats-label">흔적</p>
        <div className="home-trace-stats-grid">
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
              <strong
                className={`home-growth-trend tone-${dashboard.trendSummary.tone}`}
              >
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
                  className={`home-weekly-bar${
                    week.isCurrentWeek ? " is-current" : ""
                  }`}
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
              아직 훈련 기록이 없습니다.
              <br />
              오늘 첫 훈련을 시작해보세요.
            </p>
          ) : selectedDate && selectedDayTraining ? (
            <div className="calendar-detail">
              <span>{selectedDate.replaceAll("-", ".")}</span>
              <strong>
                훈련 {selectedDayTraining.count}회 ·{" "}
                {selectedDayTraining.rounds}R
              </strong>
              {selectedDayTraining.types?.length > 0 && (
                <p className="calendar-detail-types">
                  {selectedDayTraining.types.join(" · ")}
                </p>
              )}
            </div>
          ) : selectedDate ? (
            <p className="calendar-hint">
              {selectedDate.replaceAll("-", ".")} — 이 날은 훈련 기록이
              없습니다.
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
