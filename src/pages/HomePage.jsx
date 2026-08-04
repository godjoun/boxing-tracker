import { useMemo, useRef, useState } from "react";
import { useTraining } from "../store/TrainingContext";
import { buildTrainingBreakdown } from "../utils/trainingBreakdown";
import { getFighterProgress } from "../utils/fighterProgress";
import {
  getTrainingStreak,
  resizeImage,
} from "./profilePage/profileCardUtils";
import {
  buildWeeklyRoundTrend,
  getLogMinutes,
} from "../utils/trainingStats";
import { getTodaysLessonPreview } from "../utils/dailyLesson";
import { getFirstWeekChallengeStatus } from "../utils/retentionMetrics";
import { BRAND_NAME } from "../utils/brand";
import { getLogSummary } from "../utils/logCategories";
import MenuIcon from "../components/MenuIcon";

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

function isThisWeek(value, now = new Date()) {
  const key = getDateKey(value || now);
  if (!key) return false;

  const weekStart = startOfWeekMonday(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const date = new Date(`${key}T00:00:00`);
  return date >= weekStart && date < weekEnd;
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

function formatSceneDateLabel(now = new Date()) {
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return `${now.getMonth() + 1}월 ${now.getDate()}일 ${weekdays[now.getDay()]}요일`;
}

function getGreeting(now = new Date()) {
  const hour = now.getHours();
  if (hour < 11) return "좋은 아침입니다";
  if (hour < 18) return "좋은 오후입니다";
  return "좋은 저녁입니다";
}

function formatLogWhen(log, todayKey) {
  const logKey = getDateKey(log.date || log.createdAt);
  if (logKey === todayKey) return "오늘";

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (logKey === getDateKey(yesterday)) return "어제";

  return logKey ? logKey.replaceAll("-", ".") : "날짜 없음";
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
  timerSummary = null,
  onOpenTimer,
  onNavigate,
  onOpenCardMaker,
  onOpenCurriculum,
  onOpenGrowth,
  onReadLesson,
}) {
  const { logs = [], profile, updateProfile } = useTraining();
  const [selectedDate, setSelectedDate] = useState("");
  const [isHeroMenuOpen, setIsHeroMenuOpen] = useState(false);
  const calendarDetailsRef = useRef(null);
  const moreDetailsRef = useRef(null);
  const homeHeroInputRef = useRef(null);
  const isFirstUser = logs.length === 0;
  const homeHeroPhoto = profile?.homeHeroPhoto || "";

  const dashboard = useMemo(() => {
    const fighter = getFighterProgress(logs);
    const weeklyTrend = buildWeeklyRoundTrend(logs, 4);
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
      fighter,
      totalRounds: fighter.totalRounds,
      totalMinutes: fighter.totalMinutes,
      totalExp: fighter.totalExp,
      weeklyTrend,
      streakDays,
      trainedToday: Boolean(trainingByDate[todayKey]),
      lastLog,
      trainingByDate,
      monthDays: buildMonthDays(),
      weekStrip: buildWeekStrip(trainingByDate),
    };
  }, [logs]);

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

  const todayKey = getTodayKey();
  const todayRounds = dashboard.trainingByDate[todayKey]?.rounds || 0;
  const nickname = profile?.nickname || "나";
  const sceneDateLabel = formatSceneDateLabel();
  const greeting = getGreeting();
  const recentLogs = logs.slice(0, 3);
  const weeklyLogs = logs.filter((log) => isThisWeek(log.date));
  const weeklyStats = {
    rounds: dashboard.weekStrip.reduce((sum, day) => sum + day.rounds, 0),
    minutes: weeklyLogs.reduce((sum, log) => sum + getLogMinutes(log), 0),
  };

  const sceneTitle =
    isFirstUser
      ? "오늘 운동을 남겨보세요"
      : todaysLesson.kind === "session"
        ? todaysLesson.title
        : todaysLesson.title || "오늘도 벨을 울리자";
  const primaryLabel =
    isFirstUser
      ? "기록하기"
      : todaysLesson.kind === "session"
        ? "레슨 열기"
        : dashboard.trainedToday
        ? "훈련 이어가기"
        : "훈련 시작";

  const primaryHint =
    isFirstUser
      ? "복싱 · 러닝 · 웨이트 · 걷기"
      : todaysLesson.kind === "session"
        ? todaysLesson.goal || "준비되면 바로 이어가세요"
        : dashboard.trainedToday
          ? "조금 더 남겨도 됩니다"
          : "짧게라도 오늘 라운드를 남기세요";

  function handleCalendarSelect(dateKey) {
    setSelectedDate((current) => (current === dateKey ? "" : dateKey));
  }

  function handleOpenCalendar() {
    const more = moreDetailsRef.current;
    if (more && !more.open) {
      more.open = true;
    }

    const node = calendarDetailsRef.current;
    if (node && !node.open) {
      node.open = true;
    }
    node?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handlePrimaryAction() {
    if (isFirstUser) {
      onNavigate?.("log");
      return;
    }
    if (todaysLesson.kind === "session") {
      onReadLesson?.(todaysLesson.session);
      return;
    }
    onOpenTimer?.();
  }

  async function handleHomeHeroPhotoChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      window.alert("이미지 파일만 선택할 수 있어요.");
      event.target.value = "";
      return;
    }

    try {
      const resizedImage = await resizeImage(file);
      updateProfile?.({ homeHeroPhoto: resizedImage });
      setIsHeroMenuOpen(false);
    } catch {
      window.alert("사진을 불러오지 못했어요. 다른 사진으로 다시 시도해 주세요.");
    } finally {
      event.target.value = "";
    }
  }

  function handleRemoveHomeHeroPhoto() {
    updateProfile?.({ homeHeroPhoto: "" });
    setIsHeroMenuOpen(false);
  }

  const sceneKicker = dashboard.trainedToday
    ? `오늘 ${todayRounds}R`
    : "오늘";

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
        <div className="home-app-brand" aria-label={`${BRAND_NAME} Boxing Tracker`}>
          <strong>{BRAND_NAME}</strong>
          <span>BOXING TRACKER</span>
        </div>
        <button
          type="button"
          className="home-alert-button"
          aria-label="전체 메뉴"
          onClick={() => onNavigate?.("category")}
        >
          <MenuIcon name="notification" size={20} />
        </button>
      </header>

      <section className="home-greeting" aria-label="오늘 인사">
        <p className="home-greeting-date">{sceneDateLabel}</p>
        <p className="home-greeting-line">
          {greeting}, <span>{nickname}</span>
        </p>
      </section>

      <section
        className={`home-scene-card${homeHeroPhoto ? " has-custom-photo" : ""}`}
        aria-label="오늘의 행동"
      >
        {homeHeroPhoto ? (
          <>
            <img
              className="home-scene-card-image"
              src={homeHeroPhoto}
              alt=""
              aria-hidden="true"
            />
            <div className="home-scene-card-shade" aria-hidden="true" />
          </>
        ) : null}
        <div className="home-scene-photo-control">
          <button
            type="button"
            className="home-scene-menu-button"
            aria-label="오늘 장면 사진 메뉴"
            aria-expanded={isHeroMenuOpen}
            title="사진 설정"
            onClick={() => setIsHeroMenuOpen((open) => !open)}
          >
            <span aria-hidden="true">•••</span>
          </button>
          {isHeroMenuOpen ? (
            <div className="home-scene-photo-menu" role="menu">
              <button
                type="button"
                role="menuitem"
                onClick={() => homeHeroInputRef.current?.click()}
              >
                {homeHeroPhoto ? "사진 교체" : "사진 선택"}
              </button>
              {homeHeroPhoto ? (
                <button
                  type="button"
                  role="menuitem"
                  className="is-danger"
                  onClick={handleRemoveHomeHeroPhoto}
                >
                  사진 제거
                </button>
              ) : null}
            </div>
          ) : null}
          <input
            ref={homeHeroInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleHomeHeroPhotoChange}
            hidden
          />
        </div>
        <div className="home-scene-card-top">
          <p className="home-scene-kicker">{sceneKicker}</p>
        </div>
        <h1 className="home-scene-title">{sceneTitle}</h1>
        <p className="home-scene-copy">{primaryHint}</p>

        <div className="home-scene-actions">
          <button
            type="button"
            className="home-scene-primary"
            data-tutorial-target="home-start"
            onClick={handlePrimaryAction}
          >
            {primaryLabel}
          </button>
          {!isFirstUser && dashboard.trainedToday && dashboard.lastLog ? (
            <button
              type="button"
              className="home-scene-secondary-link"
              onClick={() => onOpenCardMaker?.(dashboard.lastLog?.id)}
            >
              인증 카드 만들기
            </button>
          ) : null}
        </div>
      </section>

      {isFirstUser ? (
        <section className="home-first-guide" aria-label="시작 안내">
          <p className="home-first-guide-kicker">NEXT</p>
          <h2 className="home-first-guide-title">이렇게 시작하면 됩니다</h2>
          <ol className="home-first-guide-list">
            <li>
              <strong>기록하기</strong>
              <span>위에서 오늘의 첫 훈련을 남깁니다.</span>
            </li>
            <li>
              <strong>훈련</strong>
              <span>하단 탭에서 라운드 타이머를 바로 켭니다.</span>
            </li>
            <li>
              <strong>커뮤니티</strong>
              <span>다닐 체육관과 라이벌을 찾아둡니다.</span>
            </li>
          </ol>
          <div className="home-first-guide-actions">
            <button
              type="button"
              className="home-first-guide-link"
              onClick={() => onNavigate?.("train")}
            >
              훈련 탭 열기
            </button>
            <button
              type="button"
              className="home-first-guide-link"
              onClick={() => onNavigate?.("gym")}
            >
              커뮤니티 열기
            </button>
          </div>
        </section>
      ) : (
        <>
          <section className="home-week-summary-card" aria-label="이번 주 요약">
            <div className="home-section-row">
              <h2>이번 주</h2>
              <span className="home-week-inline-meta">
                {weeklyStats.rounds}R · {weeklyStats.minutes}분 · 연속{" "}
                {dashboard.streakDays}일
              </span>
            </div>
            <div className="home-week-summary-strip" aria-label="이번 주 훈련일">
              <div className="home-week-strip-days">
                {dashboard.weekStrip.map((day) => (
                  <div
                    key={day.key}
                    className={`home-week-day${day.isToday ? " is-today" : ""}${
                      day.trained ? " is-trained" : ""
                    }`}
                  >
                    <span>{day.label}</span>
                    <i aria-hidden="true" />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="home-recent-card" aria-label="최근 기록">
            <div className="home-section-row">
              <h2>최근 기록</h2>
              <button
                type="button"
                className="home-section-text-link"
                onClick={() => onNavigate?.("log")}
              >
                기록 전체
              </button>
            </div>
            <div className="home-recent-list">
              {recentLogs.length > 0 ? (
                recentLogs.slice(0, 2).map((log) => (
                  <button
                    type="button"
                    className="home-recent-item"
                    key={log.id}
                    onClick={() => onOpenCardMaker?.(log.id)}
                  >
                    <span>
                      <strong>{log.type || "훈련"}</strong>
                      <em>{getLogSummary(log) || "기록 보기"}</em>
                    </span>
                    <small>{formatLogWhen(log, todayKey)}</small>
                  </button>
                ))
              ) : (
                <div className="home-recent-empty">
                  <strong>아직 기록이 없습니다</strong>
                  <span>첫 훈련을 남기면 여기에 나타납니다.</span>
                </div>
              )}
            </div>
          </section>

          <button
            type="button"
            className="home-level-strip"
            onClick={() => onOpenGrowth?.()}
            aria-label={`레벨 ${dashboard.fighter.level}, 성장 보기`}
          >
            <span>
              <small>성장</small>
              <strong>LV.{dashboard.fighter.level}</strong>
            </span>
            <span className="home-level-progress" aria-hidden="true">
              <i style={{ width: `${dashboard.fighter.progressPercent}%` }} />
            </span>
            <em>{dashboard.fighter.progressPercent}%</em>
          </button>
        </>
      )}

      {!isFirstUser ? (
        <>
          <details
            className="home-collapsible home-more-details"
            ref={moreDetailsRef}
          >
            <summary className="home-collapsible-summary">
              <span className="home-section-label">더 보기</span>
              <strong>통계 · 캘린더 · 챌린지</strong>
            </summary>

            <div className="home-more-details-body">
              <section className="home-trace-stats" aria-label="흔적">
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

              {firstWeekChallenge ? (
                <div
                  className="home-first-week-challenge"
                  aria-label="첫 주 챌린지"
                >
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

              <div className="home-more-text-actions">
                <button
                  type="button"
                  className="home-secondary-button"
                  onClick={() => onNavigate?.("train")}
                >
                  훈련에서 더 보기
                </button>
                <button
                  type="button"
                  className="home-secondary-button"
                  onClick={handleOpenCalendar}
                >
                  캘린더 열기
                </button>
                {todaysLesson.kind === "session" ? (
                  <button
                    type="button"
                    className="home-today-task-link home-today-task-link-block"
                    onClick={() => onOpenCurriculum?.()}
                  >
                    기술 전체 보기
                  </button>
                ) : null}
              </div>

              {dashboard.weeklyTrend.length > 0 ? (
                <section
                  className="home-weekly-trend"
                  aria-label="주간 라운드 추이"
                >
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
                          <div
                            style={{ height: `${week.barHeightPercent}%` }}
                          />
                        </div>
                        <strong>{week.rounds}R</strong>
                        <span>{week.shortLabel}</span>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

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

              <details
                className="home-collapsible home-calendar-nested"
                ref={calendarDetailsRef}
                id="home-calendar"
              >
                <summary className="home-collapsible-summary">
                  <span className="home-section-label">캘린더</span>
                  <strong>이번 달 훈련</strong>
                </summary>
                <section className="training-calendar">
                  <div className="calendar-weekdays" aria-hidden="true">
                    {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                      <span key={day}>{day}</span>
                    ))}
                  </div>
                  <div className="calendar-grid">
                    {dashboard.monthDays.map((date) => {
                      if (date.empty) {
                        return (
                          <span
                            className="calendar-day empty"
                            key={date.key}
                          />
                        );
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
                            training
                              ? `, 훈련 ${training.count}회`
                              : ", 훈련 없음"
                          }`}
                          aria-pressed={isSelected}
                        >
                          {date.day}
                          {training && <i />}
                        </button>
                      );
                    })}
                  </div>

                  {selectedDate && selectedDayTraining ? (
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
                      {selectedDate.replaceAll("-", ".")} — 이 날은 훈련
                      기록이 없습니다.
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
            </div>
          </details>
        </>
      ) : null}
    </main>
  );
}
