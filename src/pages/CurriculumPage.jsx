import { useEffect, useMemo, useState } from "react";
import {
  getAllCurriculumSessions,
  getCurriculumProgress,
  getCurriculumWeekOverviews,
  getRecommendedSession,
  CURRICULUM_GRADUATION,
  HOME_CURRICULUM,
  isCurriculumSessionComplete,
} from "../utils/homeCurriculum";
import {
  applyTrainingSettings,
  clearSessionOverride,
  createCustomSessionFromForm,
  deleteCustomWorkout,
  getCurriculumSettings,
  getCustomWorkouts,
  INTENSITY_OPTIONS,
  saveCurriculumSettings,
  saveCustomWorkout,
  saveSessionOverride,
} from "../utils/curriculumSettings";
import {
  COMBO_CREATOR_UNLOCK_LEVEL,
  getComboCreatorUnlockProgress,
  isComboCreatorUnlocked,
} from "../utils/featureUnlocks";
import { getLevelTitle } from "../utils/fighterTitles";
import { resolveSessionTimerConfig } from "../utils/curriculumTimerSync";
import SessionDrillGuide from "../components/SessionDrillGuide";
import LessonVideoPlayer from "../components/LessonVideoPlayer";
import { getLessonBySessionId } from "../utils/lessonCatalog";
import ComposerShell, {
  ComposerDockPrimary,
  ComposerSegmentTabs,
} from "../components/ComposerShell";
import "./CurriculumPage.css";

const CURRICULUM_TABS = [
  { id: "today", label: "오늘" },
  { id: "program", label: "4주 코스" },
];

const EMPTY_CUSTOM_FORM = {
  title: "",
  goal: "",
  rounds: 4,
  workMinutes: 2,
  restSeconds: 30,
  drills: [
    { name: "워밍업", duration: "5분", description: "가벼운 스트레칭과 제자리 뛰기를 하십시오" },
    { name: "섀도우", duration: "라운드당", description: "" },
    { name: "", duration: "라운드당", description: "" },
  ],
};

function SessionAdjustFields({ values, onChange }) {
  return (
    <div className="curriculum-adjust-grid">
      <label>
        <span>라운드</span>
        <input
          type="number"
          min={2}
          max={12}
          value={values.rounds}
          onChange={(event) =>
            onChange({ ...values, rounds: Number(event.target.value) })
          }
        />
      </label>
      <label>
        <span>라운드(분)</span>
        <input
          type="number"
          min={1}
          max={10}
          value={Math.round(values.workSeconds / 60)}
          onChange={(event) =>
            onChange({
              ...values,
              workSeconds: Number(event.target.value) * 60,
            })
          }
        />
      </label>
      <label>
        <span>휴식(초)</span>
        <input
          type="number"
          min={15}
          max={180}
          value={values.restSeconds}
          onChange={(event) =>
            onChange({ ...values, restSeconds: Number(event.target.value) })
          }
        />
      </label>
    </div>
  );
}

function WeekProgressRing({ percent }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);

  return (
    <div className="curriculum-week-ring" aria-hidden="true">
      <svg viewBox="0 0 44 44">
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="3"
        />
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 22 22)"
        />
      </svg>
      <span>{percent}%</span>
    </div>
  );
}

export default function CurriculumPage({
  fighterLevel = 1,
  focusSessionId = null,
  focusOpenDrills = false,
  focusOpenVideo = false,
  onFocusConsumed,
  onGoBack,
  onStartSession,
  onOpenComboCreator,
  onStartTraining,
}) {
  const [progress, setProgress] = useState(() => getCurriculumProgress());
  const [settings, setSettings] = useState(() => getCurriculumSettings());
  const [customWorkouts, setCustomWorkouts] = useState(() => getCustomWorkouts());
  const [customForm, setCustomForm] = useState(EMPTY_CUSTOM_FORM);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [sessionDrafts, setSessionDrafts] = useState({});
  const [expandedDrillId, setExpandedDrillId] = useState(null);
  const [expandedVideoId, setExpandedVideoId] = useState(null);
  const [activeTab, setActiveTab] = useState("today");
  const [openWeekId, setOpenWeekId] = useState(() => {
    const next = getRecommendedSession(progress);
    return next?.weekId || HOME_CURRICULUM.weeks[0]?.id || null;
  });

  const recommended = useMemo(
    () => getRecommendedSession(progress),
    [progress]
  );

  const recommendedAdjusted = useMemo(
    () => (recommended ? applyTrainingSettings(recommended, settings) : null),
    [recommended, settings]
  );

  const recommendedTimerConfig = useMemo(
    () =>
      recommendedAdjusted ? resolveSessionTimerConfig(recommendedAdjusted) : null,
    [recommendedAdjusted]
  );

  const recommendedLesson = useMemo(
    () => (recommended ? getLessonBySessionId(recommended.id) : null),
    [recommended]
  );

  const sessions = useMemo(() => getAllCurriculumSessions(), []);
  const weekOverviews = useMemo(() => getCurriculumWeekOverviews(), [progress]);

  useEffect(() => {
    if (!focusSessionId) return;

    const session = sessions.find((item) => item.id === focusSessionId);
    if (!session) {
      onFocusConsumed?.();
      return;
    }

    const isTodaySession = recommended?.id === focusSessionId;

    setActiveTab(isTodaySession ? "today" : "program");
    setOpenWeekId(session.weekId);

    if (focusOpenDrills) {
      setExpandedDrillId(focusSessionId);
    }

    if (focusOpenVideo) {
      setExpandedVideoId(focusSessionId);
    }

    requestAnimationFrame(() => {
      const scrollTarget = isTodaySession
        ? document.getElementById("curriculum-today")
        : document.getElementById(`curriculum-week-${session.weekId}`);

      scrollTarget?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      onFocusConsumed?.();
    });
  }, [
    focusSessionId,
    focusOpenDrills,
    focusOpenVideo,
    sessions,
    recommended?.id,
    onFocusConsumed,
  ]);

  const comboUnlocked = isComboCreatorUnlocked(fighterLevel);
  const comboUnlock = useMemo(
    () => getComboCreatorUnlockProgress(fighterLevel),
    [fighterLevel]
  );
  const comboMilestone = getLevelTitle(COMBO_CREATOR_UNLOCK_LEVEL);

  function refreshProgress() {
    setProgress(getCurriculumProgress());
  }

  function updateSettings(nextSettings) {
    const saved = saveCurriculumSettings(nextSettings);
    setSettings(saved);
  }

  function handleIntensityChange(intensityId) {
    updateSettings({ intensityId });
  }

  function handleStartSession(session) {
    const adjusted = applyTrainingSettings(session, settings);
    onStartSession?.(adjusted);
  }

  function toggleWeek(weekId) {
    setOpenWeekId((current) => (current === weekId ? null : weekId));
  }

  function toggleSessionEdit(session) {
    setEditingSessionId((current) => {
      if (current === session.id) {
        return null;
      }

      setSessionDrafts((drafts) => ({
        ...drafts,
        [session.id]: getSessionEditValues(session),
      }));
      return session.id;
    });
  }

  function getSessionEditValues(session) {
    const adjusted = applyTrainingSettings(session, settings);
    return {
      rounds: adjusted.rounds,
      workSeconds: adjusted.workSeconds,
      restSeconds: adjusted.restSeconds,
    };
  }

  function handleSaveSessionOverride(session) {
    const values = sessionDrafts[session.id] || getSessionEditValues(session);
    const saved = saveSessionOverride(session.id, values);
    setSettings(saved);
    setEditingSessionId(null);
  }

  function handleResetSessionOverride(sessionId) {
    const saved = clearSessionOverride(sessionId);
    setSettings(saved);
    setEditingSessionId(null);
  }

  function updateCustomDrill(index, field, value) {
    setCustomForm((current) => ({
      ...current,
      drills: current.drills.map((drill, drillIndex) =>
        drillIndex === index ? { ...drill, [field]: value } : drill
      ),
    }));
  }

  function handleStartCustomSession(savePreset = false) {
    const session = createCustomSessionFromForm({
      title: customForm.title,
      goal: customForm.goal,
      rounds: customForm.rounds,
      workSeconds: customForm.workMinutes * 60,
      restSeconds: customForm.restSeconds,
      drills: customForm.drills,
    });

    if (savePreset) {
      const saved = saveCustomWorkout(session);
      setCustomWorkouts(getCustomWorkouts());
      onStartSession?.(saved);
      return;
    }

    onStartSession?.(session);
  }

  function handleDeleteCustomWorkout(workoutId) {
    deleteCustomWorkout(workoutId);
    setCustomWorkouts(getCustomWorkouts());
  }

  function getSessionStatus(session) {
    if (isCurriculumSessionComplete(session.id, progress)) return "complete";
    if (recommended?.id === session.id) return "next";
    return "pending";
  }

  return (
    <ComposerShell
      className="curriculum-page"
      back={
        <button className="curriculum-back" type="button" onClick={onGoBack}>
          ← 뒤로
        </button>
      }
      kicker="LEARN"
      title="배움"
      summary={
        <>
          <span className="composer-meta-label">진행</span>
          <strong>
            {progress.completedCount}/{progress.totalSessions} 세션 ·{" "}
            {progress.progressPercent}%
          </strong>
          <p>
            {recommendedAdjusted
              ? `다음 · ${recommended.title} · ${recommendedAdjusted.rounds}R`
              : progress.isComplete
                ? "4주 프로그램을 모두 마쳤습니다."
                : "세션을 완료하면 진행률이 올라갑니다."}
          </p>
          <div className="curriculum-progress-bar" aria-hidden="true">
            <div style={{ width: `${progress.progressPercent}%` }} />
          </div>
        </>
      }
      segments={
        <ComposerSegmentTabs
          tabs={CURRICULUM_TABS}
          activeId={activeTab}
          onChange={setActiveTab}
          ariaLabel="배움 메뉴"
        />
      }
      dock={
        recommendedAdjusted ? (
          <ComposerDockPrimary
            label={`${recommendedAdjusted.rounds}R 훈련 시작`}
            onClick={() => handleStartSession(recommended)}
          />
        ) : null
      }
      hideDock={!recommendedAdjusted}
    >
      <header className="curriculum-hero curriculum-hero-compact">
        <p className="curriculum-intro">
          {activeTab === "today"
            ? "오늘 할 세션만 빠르게 시작하세요."
            : "4주 · 12세션. 영상 보고 바로 훈련까지 이어가세요."}
        </p>
      </header>

      {activeTab === "today" ? (
        <>
          {recommendedAdjusted ? (
            <section
              className="curriculum-card curriculum-today-card"
              id="curriculum-today"
            >
              <p className="curriculum-section-label">TODAY</p>
              <h2>오늘 추천 세션</h2>
              <div className="curriculum-today-body">
                <div>
                  <span>
                    {recommended.weekLabel} · {recommended.code}
                  </span>
                  <strong>{recommended.title}</strong>
                  <p>{recommended.goal}</p>
                  {recommendedTimerConfig ? (
                    <p className="curriculum-session-schedule">
                      {recommendedTimerConfig.scheduleSummary}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="curriculum-today-meta">
                <span>{recommendedAdjusted.rounds}R</span>
                <span>
                  라운드 {Math.round(recommendedAdjusted.workSeconds / 60)}분
                </span>
                <span>휴식 {recommendedAdjusted.restSeconds}초</span>
                {settings.intensityId !== "normal" ||
                settings.sessionOverrides[recommended.id] ? (
                  <span className="curriculum-adjusted-badge">조정됨</span>
                ) : null}
              </div>

              <div className="curriculum-today-lesson">
                <button
                  type="button"
                  className="curriculum-drill-toggle"
                  onClick={() =>
                    setExpandedDrillId((current) =>
                      current === recommended.id ? null : recommended.id
                    )
                  }
                  aria-expanded={expandedDrillId === recommended.id}
                >
                  {expandedDrillId === recommended.id
                    ? "레슨 접기"
                    : "① 레슨·드릴 보기"}
                </button>
                {expandedDrillId === recommended.id && recommendedTimerConfig ? (
                  <SessionDrillGuide
                    syncedDrills={recommendedTimerConfig.syncedDrills}
                    totalRounds={recommendedAdjusted.rounds}
                    workSeconds={recommendedAdjusted.workSeconds}
                  />
                ) : null}

                {recommendedLesson?.hasVideo ? (
                  <>
                    <button
                      type="button"
                      className="curriculum-drill-toggle curriculum-today-video-toggle"
                      onClick={() =>
                        setExpandedVideoId((current) =>
                          current === recommended.id ? null : recommended.id
                        )
                      }
                      aria-expanded={expandedVideoId === recommended.id}
                    >
                      {expandedVideoId === recommended.id
                        ? "영상 접기"
                        : "영상 보기 (선택)"}
                    </button>
                    {expandedVideoId === recommended.id ? (
                      <LessonVideoPlayer
                        videoUrl={recommendedLesson.videoUrl}
                        title={recommendedLesson.title}
                      />
                    ) : null}
                  </>
                ) : null}
              </div>
            </section>
          ) : null}

          {progress.isComplete ? (
            <section className="curriculum-card curriculum-graduate-card">
              <p className="curriculum-section-label">
                {CURRICULUM_GRADUATION.badge}
              </p>
              <h2>{CURRICULUM_GRADUATION.title}</h2>
              <p className="curriculum-settings-note">
                {CURRICULUM_GRADUATION.message}
              </p>
              <ul className="curriculum-graduate-list">
                {CURRICULUM_GRADUATION.nextSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : null}

      {activeTab === "program" ? (
        <>
      <section className="curriculum-card curriculum-progress-card curriculum-progress-card-compact">
        <div className="curriculum-progress-head">
          <div>
            <span>4주 코스</span>
            <strong>
              {progress.completedCount}/{progress.totalSessions} 세션
            </strong>
          </div>
          <b>{progress.progressPercent}%</b>
        </div>
        <div className="curriculum-progress-bar" aria-hidden="true">
          <div style={{ width: `${progress.progressPercent}%` }} />
        </div>
        <p className="curriculum-progress-note">{HOME_CURRICULUM.intro}</p>
      </section>

      {progress.isComplete ? (
        <section className="curriculum-card curriculum-graduate-card">
          <p className="curriculum-section-label">{CURRICULUM_GRADUATION.badge}</p>
          <h2>{CURRICULUM_GRADUATION.title}</h2>
          <p className="curriculum-settings-note">{CURRICULUM_GRADUATION.message}</p>
          <ul className="curriculum-graduate-list">
            {CURRICULUM_GRADUATION.nextSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="curriculum-timeline">
        {HOME_CURRICULUM.weeks.map((week, weekIndex) => {
          const weekSessions = sessions.filter(
            (session) => session.weekId === week.id
          );
          const weekOverview = weekOverviews.find((item) => item.id === week.id);
          const weekPercent = weekOverview?.sessionCount
            ? Math.round(
                (weekOverview.completedCount / weekOverview.sessionCount) * 100
              )
            : 0;
          const isOpen = openWeekId === week.id;
          const isLast = weekIndex === HOME_CURRICULUM.weeks.length - 1;

          return (
            <article
              className={`curriculum-timeline-week${isOpen ? " is-open" : ""}`}
              id={`curriculum-week-${week.id}`}
              key={week.id}
            >
              {!isLast ? <div className="curriculum-timeline-line" aria-hidden="true" /> : null}

              <button
                type="button"
                className="curriculum-timeline-week-head"
                onClick={() => toggleWeek(week.id)}
                aria-expanded={isOpen}
              >
                <WeekProgressRing percent={weekPercent} />
                <div className="curriculum-timeline-week-copy">
                  <span>{week.label}</span>
                  <strong>{week.theme}</strong>
                  <p>{week.summary}</p>
                </div>
                <div className="curriculum-timeline-week-meta">
                  <em>
                    {weekOverview?.completedCount}/{weekOverview?.sessionCount}
                  </em>
                  <span>{isOpen ? "▲" : "▼"}</span>
                </div>
              </button>

              <div className="curriculum-timeline-sessions">
                {weekSessions.map((session) => {
                  const status = getSessionStatus(session);
                  const adjusted = applyTrainingSettings(session, settings);
                  const timerConfig = resolveSessionTimerConfig(adjusted);
                  const hasOverride = Boolean(settings.sessionOverrides[session.id]);
                  const isEditing = editingSessionId === session.id;
                  const drillsOpen = expandedDrillId === session.id;
                  const editValues =
                    sessionDrafts[session.id] || getSessionEditValues(session);
                  const sessionLesson = getLessonBySessionId(session.id);
                  const videoOpen = expandedVideoId === session.id;

                  return (
                    <article
                      className={`curriculum-session-card curriculum-session-${status}`}
                      key={session.id}
                    >
                      <div className="curriculum-session-card-top">
                        <div className="curriculum-session-day">{session.code}</div>
                        <div className="curriculum-session-main">
                          <div className="curriculum-session-title-row">
                            <strong>{session.title}</strong>
                            <span className={`curriculum-session-status is-${status}`}>
                              {status === "complete"
                                ? "완료"
                                : status === "next"
                                  ? "다음"
                                  : "대기"}
                            </span>
                          </div>
                          <p>{session.goal}</p>
                          <p className="curriculum-session-schedule">
                            {timerConfig.scheduleSummary}
                          </p>
                          <div className="curriculum-session-meta">
                            <span>{adjusted.rounds}R</span>
                            <span>{Math.round(adjusted.workSeconds / 60)}분</span>
                            <span>휴식 {adjusted.restSeconds}초</span>
                            {hasOverride || settings.intensityId !== "normal" ? (
                              <span className="curriculum-adjusted-badge">조정됨</span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="curriculum-session-media-row">
                        <button
                          type="button"
                          className="curriculum-session-media-button"
                          onClick={() =>
                            setExpandedVideoId((current) =>
                              current === session.id ? null : session.id
                            )
                          }
                          aria-expanded={videoOpen}
                        >
                          {videoOpen
                            ? "영상 접기"
                            : sessionLesson?.hasVideo
                              ? "① 영상"
                              : "① 영상 준비 중"}
                        </button>
                        <button
                          type="button"
                          className="curriculum-drill-toggle curriculum-session-media-button"
                          onClick={() =>
                            setExpandedDrillId((current) =>
                              current === session.id ? null : session.id
                            )
                          }
                          aria-expanded={drillsOpen}
                        >
                          {drillsOpen ? "레슨 접기" : "① 레슨·드릴"}
                        </button>
                      </div>

                      {videoOpen ? (
                        <LessonVideoPlayer
                          videoUrl={sessionLesson?.videoUrl || ""}
                          title={session.title}
                        />
                      ) : null}

                      {drillsOpen ? (
                        <SessionDrillGuide
                          syncedDrills={timerConfig.syncedDrills}
                          totalRounds={adjusted.rounds}
                          workSeconds={adjusted.workSeconds}
                        />
                      ) : null}

                      {isEditing ? (
                        <div className="curriculum-session-adjust">
                          <p>이 세션만 조정</p>
                          <SessionAdjustFields
                            values={editValues}
                            onChange={(values) =>
                              setSessionDrafts((drafts) => ({
                                ...drafts,
                                [session.id]: values,
                              }))
                            }
                          />
                          <div className="curriculum-session-adjust-actions">
                            <button
                              type="button"
                              className="curriculum-session-button"
                              onClick={() => handleSaveSessionOverride(session)}
                            >
                              저장
                            </button>
                            {hasOverride ? (
                              <button
                                type="button"
                                className="curriculum-text-button"
                                onClick={() => handleResetSessionOverride(session.id)}
                              >
                                기본값
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="curriculum-text-button"
                              onClick={() => setEditingSessionId(null)}
                            >
                              닫기
                            </button>
                          </div>
                        </div>
                      ) : null}

                      <div className="curriculum-session-card-actions">
                        <button
                          type="button"
                          className="curriculum-secondary-button"
                          onClick={() => toggleSessionEdit(session)}
                        >
                          {isEditing ? "닫기" : "조정"}
                        </button>
                        <button
                          type="button"
                          className="curriculum-session-button"
                          onClick={() => handleStartSession(session)}
                        >
                          {status === "complete" ? "② 다시 훈련" : "② 훈련 시작"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </article>
          );
        })}
      </section>

      <details className="curriculum-card curriculum-advanced-details">
        <summary>훈련 설정 · 커스텀 루틴</summary>

      <section className="curriculum-card curriculum-settings-card curriculum-nested-card">
        <p className="curriculum-section-label">SETTINGS</p>
        <h2>내 훈련 강도</h2>
        <p className="curriculum-settings-note">
          라운드·휴식을 내 몸에 맞게 조절하세요.
        </p>
        <div className="curriculum-intensity-list">
          {INTENSITY_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`curriculum-intensity-chip${settings.intensityId === option.id ? " is-active" : ""}`}
              onClick={() => handleIntensityChange(option.id)}
            >
              <strong>{option.label}</strong>
              <span>{option.description}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="curriculum-card curriculum-combo-card">
        <p className="curriculum-section-label">COMBO LAB</p>
        <h2>콤보 크리에이터</h2>
        {comboUnlocked ? (
          <>
            <p className="curriculum-settings-note">
              잽·크로스·훅을 조합해 나만의 섀도우 루틴을 만들고 타이머로 바로 실행하세요.
            </p>
            <button
              type="button"
              className="curriculum-cta"
              onClick={onOpenComboCreator}
            >
              콤보 만들기
            </button>
          </>
        ) : (
          <>
            <p className="curriculum-settings-note">
              LV.{COMBO_CREATOR_UNLOCK_LEVEL} {comboMilestone.ko} 달성 후 해금됩니다.
            </p>
            <div className="curriculum-lock-progress">
              <div className="curriculum-lock-progress-head">
                <span>현재 LV. {comboUnlock.currentLevel}</span>
                <span>{comboUnlock.progressPercent}%</span>
              </div>
              <div className="curriculum-progress-bar" aria-hidden="true">
                <div style={{ width: `${comboUnlock.progressPercent}%` }} />
              </div>
            </div>
            <button
              type="button"
              className="curriculum-secondary-button"
              onClick={onStartTraining}
            >
              훈련하러 가기
            </button>
          </>
        )}
      </section>

      {comboUnlocked ? (
        <section className="curriculum-card curriculum-custom-card">
          <p className="curriculum-section-label">CUSTOM</p>
          <h2>내 커스텀 훈련</h2>
          <p className="curriculum-settings-note">
            라운드·드릴을 직접 정해서 타이머로 바로 시작하세요.
          </p>

          <div className="curriculum-custom-form">
            <label>
              <span>훈련 이름</span>
              <input
                type="text"
                placeholder="예: 잽-훅 섀도우"
                value={customForm.title}
                onChange={(event) =>
                  setCustomForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              <span>목표 (선택)</span>
              <input
                type="text"
                placeholder="예: 거리 감각과 리듬"
                value={customForm.goal}
                onChange={(event) =>
                  setCustomForm((current) => ({
                    ...current,
                    goal: event.target.value,
                  }))
                }
              />
            </label>

            <SessionAdjustFields
              values={{
                rounds: customForm.rounds,
                workSeconds: customForm.workMinutes * 60,
                restSeconds: customForm.restSeconds,
              }}
              onChange={(values) =>
                setCustomForm((current) => ({
                  ...current,
                  rounds: values.rounds,
                  workMinutes: Math.round(values.workSeconds / 60),
                  restSeconds: values.restSeconds,
                }))
              }
            />

            <div className="curriculum-custom-drills">
              <p>드릴 (최대 3개)</p>
              {customForm.drills.map((drill, index) => (
                <div className="curriculum-custom-drill" key={`custom-drill-${index}`}>
                  <input
                    type="text"
                    placeholder={`드릴 ${index + 1} 이름`}
                    value={drill.name}
                    onChange={(event) =>
                      updateCustomDrill(index, "name", event.target.value)
                    }
                  />
                  <input
                    type="text"
                    placeholder="설명 (선택)"
                    value={drill.description}
                    onChange={(event) =>
                      updateCustomDrill(index, "description", event.target.value)
                    }
                  />
                </div>
              ))}
            </div>

            <div className="curriculum-custom-actions">
              <button
                type="button"
                className="curriculum-session-button"
                onClick={() => handleStartCustomSession(false)}
              >
                바로 시작
              </button>
              <button
                type="button"
                className="curriculum-secondary-button"
                onClick={() => handleStartCustomSession(true)}
              >
                저장 후 시작
              </button>
            </div>
          </div>

          {customWorkouts.length > 0 ? (
            <div className="curriculum-saved-list">
              <p>저장한 루틴</p>
              {customWorkouts.map((workout) => (
                <article className="curriculum-saved-item" key={workout.id}>
                  <div>
                    <strong>{workout.title}</strong>
                    <span>
                      {workout.rounds}R · {Math.round(workout.workSeconds / 60)}분 · 휴식{" "}
                      {workout.restSeconds}초
                    </span>
                  </div>
                  <div className="curriculum-saved-actions">
                    <button
                      type="button"
                      className="curriculum-session-button"
                      onClick={() => onStartSession?.(workout)}
                    >
                      시작
                    </button>
                    <button
                      type="button"
                      className="curriculum-text-button"
                      onClick={() => handleDeleteCustomWorkout(workout.id)}
                    >
                      삭제
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
      </details>
        </>
      ) : null}

      {activeTab === "today" || activeTab === "program" ? (
        <button
          type="button"
          className="curriculum-refresh"
          onClick={refreshProgress}
        >
          진행 상태 새로고침
        </button>
      ) : null}
    </ComposerShell>
  );
}
