import { useMemo, useRef, useState } from "react";
import { useTraining } from "../store/TrainingContext";
import { resizeImage } from "./profilePage/profileCardUtils";
import { getLogMinutes } from "../utils/trainingStats";
import { getTodaysLessonPreview } from "../utils/dailyLesson";
import { getLastStyleContinue } from "../utils/styleProgress";
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
  onOpenCurriculum,
  onReadLesson,
  onContinueStyle,
  onStartMinimumRound,
}) {
  const { logs = [], profile, updateProfile } = useTraining();
  const [isHeroMenuOpen, setIsHeroMenuOpen] = useState(false);
  const homeHeroInputRef = useRef(null);
  const surfaceLogs = useMemo(
    () => logs.filter((log) => !isDevSurfaceLog(log)),
    [logs]
  );

  const dashboard = useMemo(() => {
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
      trainedToday: Boolean(trainingByDate[todayKey]),
      trainingByDate,
      weekStrip: buildWeekStrip(trainingByDate),
    };
  }, [surfaceLogs]);

  const todaysLesson = getTodaysLessonPreview();
  const styleContinue = getLastStyleContinue();
  const todayKey = getTodayKey();
  const nickname = profile?.nickname || "나";
  const greeting = getGreeting();
  // Explicit home hero only — never fall back to profile.photo / general shots.
  const homeHeroPhoto = String(profile?.homeHeroPhoto || "").trim();
  const recentLogs = surfaceLogs.slice(0, 2);
  const latestLog = recentLogs[0] || null;
  const hasAnyRecords = surfaceLogs.length > 0;
  const trainedDaysThisWeek = dashboard.weekStrip.filter((day) => day.trained)
    .length;

  const trainedToday = Boolean(dashboard.trainedToday);
  const todayLogs = surfaceLogs.filter((log) => getDateKey(log.date || log.createdAt) === todayKey);
  const todayMinutes = todayLogs.reduce((sum, log) => sum + getLogMinutes(log), 0);
  const totalRounds = surfaceLogs.reduce((sum, log) => sum + getRounds(log), 0);
  const trainingDayCount = Object.keys(dashboard.trainingByDate).length;
  const hasLesson = todaysLesson.kind === "session";
  const timerIsActive = Boolean(timerSummary?.isActive);
  const latestLogRounds = latestLog ? getRounds(latestLog) : 0;
  const latestLogMinutes = latestLog ? getLogMinutes(latestLog) : 0;
  const latestLogMetric =
    latestLogRounds > 0
      ? `${latestLogRounds}R`
      : latestLogMinutes > 0
        ? `${latestLogMinutes}분`
        : latestLog
          ? getLogSummary(latestLog) || "저장됨"
          : "";

  const sceneTitle = trainedToday
    ? "오늘 훈련을 남겼어요"
    : hasLesson ? `오늘 ${todaysLesson.durationLabel} 복싱` : "오늘의 훈련";

  const sceneCopy = trainedToday
    ? `${todayLogs.length}회 기록${todayMinutes > 0 ? ` · ${todayMinutes}분` : ""}`
    : hasLesson
      ? `체육관 못 가는 날, 기본 자세부터 ${todaysLesson.rounds}R`
      : "짧게라도 오늘 라운드를 남기세요";

  const primaryLabel = timerIsActive
    ? "타이머 이어하기"
    : trainedToday
      ? "오늘 기록 보기"
      : hasLesson ? "오늘 훈련 시작" : "훈련 시작";
  const trainingChoices = [
    {
      id: "course",
      icon: "skill",
      label: "추천",
      title: hasLesson ? `정석 ${todaysLesson.durationLabel}` : "정석 코스",
      meta: hasLesson
        ? `기본 자세부터 ${todaysLesson.rounds}R`
        : "정석 루틴",
      onClick: () =>
        hasLesson ? onReadLesson?.(todaysLesson.session) : onOpenCurriculum?.("program"),
    },
    {
      id: "quick",
      icon: "ring",
      label: "가볍게",
      title: "1R만",
      meta: "바쁜 날 최소 기록",
      onClick: () =>
        onStartMinimumRound ? onStartMinimumRound() : onNavigate?.("train"),
    },
    {
      id: "review",
      icon: "combo",
      label: "복습",
      title: "기술 복습",
      meta: styleContinue ? styleContinue.stageTitle : "자세와 가드 확인",
      onClick: () =>
        styleContinue ? onContinueStyle?.(styleContinue) : onOpenCurriculum?.("techniques"),
    },
    {
      id: "free",
      icon: "round",
      label: "자유",
      title: "자유 타이머",
      meta: "내 라운드로 설정",
      onClick: () => onOpenTimer?.(),
    },
  ];
  const heroStats = trainedToday
    ? [
        { label: "오늘 기록", value: `${todayLogs.length}회` },
        { label: "남긴 시간", value: todayMinutes > 0 ? `${todayMinutes}분` : "-" },
        { label: "누적", value: `${surfaceLogs.length}회` },
      ]
    : hasLesson
      ? [
          { label: "분량", value: `${todaysLesson.rounds}R` },
          { label: "전체", value: todaysLesson.durationLabel },
          { label: "순서", value: todaysLesson.code },
        ]
      : [
          { label: "오늘", value: "대기" },
          { label: "기록", value: `${surfaceLogs.length}회` },
          { label: "이번 주", value: `${trainedDaysThisWeek}일` },
        ];

  function handlePrimaryAction() {
    if (timerIsActive) {
      onOpenTimer?.();
      return;
    }
    if (trainedToday) {
      if (todayLogs[0]?.id && onOpenCardMaker) onOpenCardMaker(todayLogs[0].id);
      else onNavigate?.("log");
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

      <header className="home-scene-header home-scene-header-compact home-command-header">
        <div
          className="home-app-brand"
          aria-label={`${BRAND_NAME} Boxing Tracker`}
        >
          <strong>{BRAND_NAME}</strong>
          <p className="home-header-line">
            {greeting}, {nickname}
          </p>
        </div>
        <span className="home-command-state">
          {trainedToday ? "오늘 기록 완료" : "훈련 대기"}
        </span>
      </header>

      <section className="home-training-stack" aria-label="오늘 훈련 흐름">
        <section
          className={`home-scene-card home-scene-card-hero home-command-board${
            homeHeroPhoto ? " has-custom-photo" : " home-scene-card-hero-default"
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
          ) : (
            <div className="home-scene-card-default-stage" aria-hidden="true" />
          )}
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
          <div className="home-board-topline">
            <p className="home-scene-kicker">
              {trainedToday ? "기록 완료" : "오늘의 세션"}
            </p>
            {hasLesson ? (
              <span className="home-course-status">
                {todaysLesson.code}
              </span>
            ) : null}
          </div>
          <h1 className="home-scene-title">{sceneTitle}</h1>
          <p className="home-scene-copy">{sceneCopy}</p>
          <div className="home-session-stats" aria-label="오늘 훈련 요약">
            {heroStats.map((stat) => (
              <span key={stat.label}>
                <small>{stat.label}</small>
                <strong>{stat.value}</strong>
              </span>
            ))}
          </div>
          <div
            className={`home-session-track${trainedToday ? " is-complete" : ""}`}
            aria-hidden="true"
          >
            <span>{trainedToday ? "완료" : "준비"}</span>
            <i />
            <span>{trainedToday ? "기록" : "훈련"}</span>
            <i />
            <span>{trainedToday ? "다음" : "저장"}</span>
          </div>
          <div className="home-scene-actions">
            <button
              type="button"
              className="home-scene-primary"
              data-tutorial-target="home-start"
              onClick={handlePrimaryAction}
            >
              {primaryLabel}
            </button>
            {trainedToday && !timerIsActive ? (
              <button
                type="button"
                className="home-scene-secondary-link home-next-session"
                onClick={() =>
                  hasLesson ? onReadLesson?.(todaysLesson.session) : onNavigate?.("train")
                }
              >
                {hasLesson ? `다음 훈련 · ${todaysLesson.title}` : "다른 훈련 보기"}
              </button>
            ) : null}
          </div>
        </section>

        {!hasAnyRecords && !timerIsActive ? (
          <p className="home-first-note">
            완료하면 기록은 자동 저장되고 Boxer History에 남습니다.
          </p>
        ) : null}
      </section>

      <section className="home-training-choice-section" aria-label="오늘의 훈련 선택">
        <div className="home-training-choice-head">
          <h2>오늘의 선택</h2>
          <span>{hasAnyRecords ? "상황에 맞게 이어가기" : "처음엔 하나만 골라도 됩니다"}</span>
        </div>
        <div className="home-training-choice-grid">
          {trainingChoices.map((item) => (
            <button
              type="button"
              className="home-training-choice-item"
              key={item.id}
              onClick={item.onClick}
            >
              <span className="home-training-choice-icon" aria-hidden="true">
                <MenuIcon name={item.icon} size={18} />
              </span>
              <span className="home-training-choice-copy">
                <small>{item.label}</small>
                <strong>{item.title}</strong>
                <em>{item.meta}</em>
              </span>
            </button>
          ))}
        </div>
      </section>

      {hasAnyRecords ? (
        <section className="home-history-preview" aria-label="Boxer History">
          <div className="home-history-preview-head">
            <div>
              <p>Boxer History</p>
              <h2>내 복싱 이력</h2>
            </div>
            <button type="button" onClick={() => onNavigate?.("profile")}>
              보기
            </button>
          </div>
          <div className="home-history-stats" aria-label="누적 훈련 요약">
            <span>
              <small>기록</small>
              <strong>{surfaceLogs.length}회</strong>
            </span>
            <span>
              <small>훈련일</small>
              <strong>{trainingDayCount}일</strong>
            </span>
            <span>
              <small>라운드</small>
              <strong>{totalRounds}R</strong>
            </span>
          </div>
          <div className="home-history-week" aria-label="이번 주 훈련 흔적">
            {dashboard.weekStrip.map((day) => (
              <span
                key={day.key}
                className={`${day.isToday ? " is-today" : ""}${
                  day.trained ? " is-trained" : ""
                }`}
              >
                <em>{day.label}</em>
                <i aria-hidden="true" />
              </span>
            ))}
          </div>
          {latestLog ? (
            <button
              type="button"
              className="home-history-latest"
              onClick={() => onOpenCardMaker?.(latestLog.id)}
            >
              <span>
                <small>최근 기록</small>
                <strong>{latestLog.type || "훈련"}</strong>
              </span>
              <em>
                {[latestLogMetric, formatLogWhen(latestLog, todayKey)]
                  .filter(Boolean)
                  .join(" · ")}
              </em>
            </button>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
