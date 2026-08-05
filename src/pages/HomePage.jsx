import { useMemo, useRef, useState } from "react";
import { useTraining } from "../store/TrainingContext";
import { getFighterProgress } from "../utils/fighterProgress";
import {
  getTrainingStreak,
  resizeImage,
} from "./profilePage/profileCardUtils";
import { getLogMinutes } from "../utils/trainingStats";
import { getTodaysLessonPreview } from "../utils/dailyLesson";
import { BRAND_NAME } from "../utils/brand";
import { getLogSummary } from "../utils/logCategories";
import { isDevSurfaceLog } from "../utils/devMode";
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
      trained: Boolean(training),
      rounds: training?.rounds || 0,
      isToday: key === todayKey,
    };
  });
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

  return logKey ? logKey.replaceAll("-", ".") : "";
}

export default function HomePage({
  timerSummary = null,
  onOpenTimer,
  onNavigate,
  onOpenCardMaker,
  onOpenGrowth,
  onReadLesson,
}) {
  const { logs = [], profile, updateProfile } = useTraining();
  const [isHeroMenuOpen, setIsHeroMenuOpen] = useState(false);
  const homeHeroInputRef = useRef(null);
  const surfaceLogs = useMemo(
    () => logs.filter((log) => !isDevSurfaceLog(log)),
    [logs]
  );

  const dashboard = useMemo(() => {
    const fighter = getFighterProgress(logs);
    const streakDays = getTrainingStreak(logs);
    const todayKey = getTodayKey();

    const trainingByDate = surfaceLogs.reduce((dates, log) => {
      const key = getDateKey(log.date || log.createdAt);
      if (!key) return dates;

      if (!dates[key]) {
        dates[key] = { count: 0, rounds: 0 };
      }

      dates[key].count += 1;
      dates[key].rounds += getRounds(log);
      return dates;
    }, {});

    return {
      fighter,
      streakDays,
      trainedToday: Boolean(trainingByDate[todayKey]),
      trainingByDate,
      weekStrip: buildWeekStrip(trainingByDate),
    };
  }, [logs, surfaceLogs]);

  const todaysLesson = useMemo(() => getTodaysLessonPreview(), []);
  const todayKey = getTodayKey();
  const todayRounds = dashboard.trainingByDate[todayKey]?.rounds || 0;
  const nickname = profile?.nickname || "나";
  const greeting = getGreeting();
  const homeHeroPhoto = profile?.homeHeroPhoto || "";
  const recentLogs = surfaceLogs.slice(0, 2);
  const weeklyRounds = dashboard.weekStrip.reduce(
    (sum, day) => sum + day.rounds,
    0
  );
  const trainedDaysThisWeek = dashboard.weekStrip.filter((day) => day.trained)
    .length;

  const trainedToday = Boolean(dashboard.trainedToday);
  const hasLesson = todaysLesson.kind === "session";
  const timerIsActive = Boolean(timerSummary?.isActive);

  const sceneTitle = hasLesson
    ? todaysLesson.title
    : trainedToday
      ? "오늘도 벨은 울렸다"
      : "오늘의 훈련";

  const sceneCopy = hasLesson
    ? todaysLesson.goal || "준비되면 바로 이어가세요"
    : trainedToday
      ? `${todayRounds}R 남김 · 연속 ${dashboard.streakDays}일`
      : "짧게라도 오늘 라운드를 남기세요";

  const primaryLabel = timerIsActive
    ? "타이머 이어하기"
    : hasLesson
      ? "레슨 시작"
      : "훈련 시작";

  function handlePrimaryAction() {
    if (timerIsActive) {
      onOpenTimer?.();
      return;
    }
    if (hasLesson) {
      onReadLesson?.(todaysLesson.session);
      return;
    }
    onNavigate?.("train");
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

  return (
    <main className="home-page home-page-focus">
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

      <header className="home-scene-header home-scene-header-compact">
        <div
          className="home-app-brand"
          aria-label={`${BRAND_NAME} Boxing Tracker`}
        >
          <strong>{BRAND_NAME}</strong>
          <p className="home-header-line">
            {greeting}, {nickname}
          </p>
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

      <section
        className={`home-scene-card home-scene-card-hero${
          homeHeroPhoto ? " has-custom-photo" : ""
        }`}
        aria-label="오늘의 훈련"
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
        <p className="home-scene-kicker">오늘</p>
        <h1 className="home-scene-title">{sceneTitle}</h1>
        <p className="home-scene-copy">{sceneCopy}</p>
        <div className="home-scene-actions">
          <button
            type="button"
            className="home-scene-primary"
            data-tutorial-target="home-start"
            onClick={handlePrimaryAction}
          >
            {primaryLabel}
          </button>
        </div>
      </section>

      <section className="home-week-strip-inline" aria-label="이번 주">
        <div className="home-week-strip-days">
          {dashboard.weekStrip.map((day) => (
            <div
              key={day.key}
              className={`home-week-day${day.isToday ? " is-today" : ""}${
                day.trained ? " is-trained" : ""
              }`}
            >
              <span>{day.label}</span>
              <i aria-hidden="true">{day.trained ? "✓" : ""}</i>
            </div>
          ))}
        </div>
        <p className="home-week-strip-meta">
          {trainedDaysThisWeek}일 훈련 · {weeklyRounds}R
        </p>
      </section>

      <section className="home-recent-card home-recent-card-slim" aria-label="최근 기록">
        <div className="home-section-row">
          <h2>최근 기록</h2>
          <button
            type="button"
            className="home-section-text-link"
            onClick={() => onNavigate?.("log")}
          >
            전체
          </button>
        </div>
        <div className="home-recent-list">
          {recentLogs.length > 0 ? (
            recentLogs.map((log) => {
              const rounds = getRounds(log);
              const minutes = getLogMinutes(log);
              const metric =
                rounds > 0
                  ? `${rounds}R`
                  : minutes > 0
                    ? `${minutes}분`
                    : getLogSummary(log) || "";
              return (
                <button
                  type="button"
                  className="home-recent-item home-recent-item-slim"
                  key={log.id}
                  onClick={() => onOpenCardMaker?.(log.id)}
                >
                  <span className="home-recent-copy">
                    <strong>{log.type || "훈련"}</strong>
                    <em>
                      {[metric, formatLogWhen(log, todayKey)]
                        .filter(Boolean)
                        .join(" · ")}
                    </em>
                  </span>
                </button>
              );
            })
          ) : (
            <div className="home-recent-empty">
              <strong>아직 기록이 없습니다</strong>
              <span>첫 훈련을 시작하면 여기에 남습니다.</span>
            </div>
          )}
        </div>
      </section>

      <button
        type="button"
        className="home-level-strip home-level-strip-slim"
        onClick={() => onOpenGrowth?.()}
        aria-label={`레벨 ${dashboard.fighter.level}, 성장 보기`}
      >
        <span>
          <small>LV.{dashboard.fighter.level}</small>
        </span>
        <span className="home-level-progress" aria-hidden="true">
          <i style={{ width: `${dashboard.fighter.progressPercent}%` }} />
        </span>
        <em>{dashboard.fighter.progressPercent}%</em>
      </button>
    </main>
  );
}
