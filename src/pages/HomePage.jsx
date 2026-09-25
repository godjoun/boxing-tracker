import { useMemo, useRef, useState } from "react";
import { useTraining } from "../store/TrainingContext";
import { resizeImage } from "./profilePage/profileCardUtils";
import { BRAND_NAME } from "../utils/brand";
import HomeHistoryPreview from "../components/home/HomeHistoryPreview";
import HomeTrainingChoiceBoard from "../components/home/HomeTrainingChoiceBoard";
import HomeTrainingHero from "../components/home/HomeTrainingHero";
import {
  buildHomeDashboard,
  formatLogWhen,
  getGreeting,
} from "../utils/homeDashboard";

export default function HomePage({
  timerSummary = null,
  onOpenTimer,
  onNavigate,
  onOpenCardMaker,
  onStartMinimumRound,
}) {
  const { logs = [], profile, updateProfile } = useTraining();
  const [isHeroMenuOpen, setIsHeroMenuOpen] = useState(false);
  const homeHeroInputRef = useRef(null);
  const dashboard = useMemo(() => buildHomeDashboard(logs), [logs]);
  const {
    hasAnyRecords,
    latestLog,
    latestLogMetric,
    surfaceLogs,
    todayKey,
    todayLogs,
    todayMinutes,
    totalRounds,
    trainedDaysThisWeek,
    trainedToday,
    trainingDayCount,
    weekStrip,
  } = dashboard;
  const nickname = profile?.nickname || "나";
  const greeting = getGreeting();
  // Explicit home hero only — never fall back to profile.photo / general shots.
  const homeHeroPhoto = String(profile?.homeHeroPhoto || "").trim();
  const timerIsActive = Boolean(timerSummary?.isActive);
  const latestLogWhen = latestLog ? formatLogWhen(latestLog, todayKey) : "";

  const sceneTitle = trainedToday ? "오늘 훈련을 남겼어요" : "오늘의 훈련";

  const sceneCopy = trainedToday
    ? `${todayLogs.length}회 기록${todayMinutes > 0 ? ` · ${todayMinutes}분` : ""}`
    : "짧게라도 오늘 라운드를 남기세요";

  const primaryLabel = timerIsActive ? "타이머 이어하기" : "1R 시작";
  const trainingChoices = [
    {
      id: "quick",
      icon: "ring",
      label: "가볍게",
      title: "1R만",
      meta: "바쁜 날 최소 기록",
      onClick: () =>
        onStartMinimumRound ? onStartMinimumRound() : onNavigate?.("train"),
    },
  ];
  const heroStats = trainedToday
    ? [
        { label: "오늘 기록", value: `${todayLogs.length}회` },
        { label: "남긴 시간", value: todayMinutes > 0 ? `${todayMinutes}분` : "-" },
        { label: "누적", value: `${surfaceLogs.length}회` },
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
    if (onStartMinimumRound) {
      onStartMinimumRound();
      return;
    }
    onNavigate?.("train");
  }

  function handleOpenTodayRecord() {
    if (todayLogs[0]?.id && onOpenCardMaker) onOpenCardMaker(todayLogs[0].id);
    else onNavigate?.("log");
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
        <HomeTrainingHero
          heroInputRef={homeHeroInputRef}
          heroStats={heroStats}
          homeHeroPhoto={homeHeroPhoto}
          isHeroMenuOpen={isHeroMenuOpen}
          primaryLabel={primaryLabel}
          sceneCopy={sceneCopy}
          sceneTitle={sceneTitle}
          showNextAction={trainedToday && !timerIsActive}
          trainedToday={trainedToday}
          nextActionLabel="오늘 기록 보기"
          onHeroPhotoChange={handleHomeHeroPhotoChange}
          onNextAction={handleOpenTodayRecord}
          onPrimaryAction={handlePrimaryAction}
          onRemoveHeroPhoto={handleRemoveHomeHeroPhoto}
          onToggleHeroMenu={() => setIsHeroMenuOpen((open) => !open)}
        />

        {!hasAnyRecords && !timerIsActive ? (
          <p className="home-first-note">
            완료하면 기록은 자동 저장되고 Boxer History에 남습니다.
          </p>
        ) : null}
      </section>

      <HomeTrainingChoiceBoard choices={trainingChoices} />

      {hasAnyRecords ? (
        <HomeHistoryPreview
          latestLog={latestLog}
          latestLogMetric={latestLogMetric}
          latestLogWhen={latestLogWhen}
          surfaceLogCount={surfaceLogs.length}
          trainingDayCount={trainingDayCount}
          totalRounds={totalRounds}
          weekStrip={weekStrip}
          onOpenLatest={() => onOpenCardMaker?.(latestLog?.id)}
          onOpenProfile={() => onNavigate?.("profile")}
        />
      ) : null}
    </main>
  );
}
