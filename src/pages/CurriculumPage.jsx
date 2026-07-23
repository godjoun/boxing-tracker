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
import {
  buildStyleDrillSession,
  getStyleCategories,
  getTechniqueCatalog,
} from "../utils/techniqueCatalog";
import ComposerShell, {
  ComposerDockPrimary,
  ComposerSegmentTabs,
} from "../components/ComposerShell";
import "./CurriculumPage.css";

const CURRICULUM_TABS = [
  { id: "techniques", label: "기술" },
  { id: "program", label: "4주 코스" },
];

const EMPTY_CUSTOM_FORM = {
  title: "",
  goal: "",
  rounds: 4,
  workMinutes: 3,
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
  initialStyleId = null,
  initialCategoryId = null,
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
  const [activeTab, setActiveTab] = useState(
    initialStyleId ? "techniques" : "program"
  );
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

  const sessions = useMemo(() => getAllCurriculumSessions(), []);
  const weekOverviews = useMemo(() => getCurriculumWeekOverviews(), [progress]);
  const techniqueCatalog = useMemo(() => getTechniqueCatalog(), []);
  const [selectedStyleId, setSelectedStyleId] = useState(initialStyleId);
  const [selectedCategoryId, setSelectedCategoryId] =
    useState(initialCategoryId);
  const selectedStyle = useMemo(
    () => techniqueCatalog.find((style) => style.id === selectedStyleId) || null,
    [techniqueCatalog, selectedStyleId]
  );
  const styleCategories = useMemo(
    () => getStyleCategories(selectedStyle),
    [selectedStyle]
  );
  const selectedCategory = useMemo(
    () =>
      styleCategories.find((category) => category.id === selectedCategoryId) ||
      null,
    [styleCategories, selectedCategoryId]
  );
  const isStyleDetail =
    activeTab === "techniques" && Boolean(selectedStyle);
  const isCategoryDetail = isStyleDetail && Boolean(selectedCategory);

  useEffect(() => {
    if (!focusSessionId) return;

    const session = sessions.find((item) => item.id === focusSessionId);
    if (!session) {
      onFocusConsumed?.();
      return;
    }

    setActiveTab("program");
    setOpenWeekId(session.weekId);

    if (focusOpenDrills) {
      setExpandedDrillId(focusSessionId);
    }

    if (focusOpenVideo) {
      setExpandedVideoId(focusSessionId);
    }

    requestAnimationFrame(() => {
      const scrollTarget = document.getElementById(
        `curriculum-week-${session.weekId}`
      );

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

  function handleStartStyleDrill(style, stage) {
    const session = buildStyleDrillSession(style, stage);
    if (session) onStartSession?.(session);
  }

  function handleOpenStyle(styleId) {
    setSelectedStyleId(styleId);
    setSelectedCategoryId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCloseStyle() {
    if (selectedCategoryId) {
      setSelectedCategoryId(null);
      return;
    }
    setSelectedStyleId(null);
  }

  function handleOpenCategory(categoryId) {
    setSelectedCategoryId(categoryId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleTabChange(tabId) {
    setActiveTab(tabId);
    setSelectedStyleId(null);
    setSelectedCategoryId(null);
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
      className={`curriculum-page${isStyleDetail ? " is-style-detail" : ""}`}
      back={
        <button
          className="curriculum-back"
          type="button"
          onClick={isStyleDetail ? handleCloseStyle : onGoBack}
        >
          {isCategoryDetail
            ? "← 카테고리"
            : isStyleDetail
              ? "← 스타일"
              : "← 뒤로"}
        </button>
      }
      kicker={
        isCategoryDetail
          ? selectedStyle.en
          : isStyleDetail
            ? selectedStyle.en
            : "LEARN"
      }
      title={
        isCategoryDetail
          ? selectedCategory.label
          : isStyleDetail
            ? selectedStyle.title
            : "기술"
      }
      summary={
        <>
          {isCategoryDetail ? (
            <>
              <span className="composer-meta-label">
                {selectedStyle.title} · {selectedCategory.kind === "stage" ? "기술" : selectedCategory.label}
              </span>
              <strong>{selectedCategory.title}</strong>
              <p>{selectedCategory.description}</p>
            </>
          ) : isStyleDetail ? (
            <>
              <span className="composer-meta-label">카테고리</span>
              <strong>{selectedStyle.title} 안에서 고르기</strong>
              <p>{selectedStyle.summary}</p>
              {selectedStyle.advanced ? (
                <p className="style-detail-advanced">
                  숙련자 권장 · 균형이 잡힌 뒤 연습하세요
                </p>
              ) : null}
            </>
          ) : activeTab === "techniques" ? (
            <>
              <span className="composer-meta-label">스타일 연습장</span>
              <strong>{techniqueCatalog.length}가지 스타일</strong>
              <p>하나를 고르면 그 스타일 전용 화면으로 들어갑니다.</p>
            </>
          ) : (
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
          )}
        </>
      }
      segments={
        isStyleDetail ? null : (
          <ComposerSegmentTabs
            tabs={CURRICULUM_TABS}
            activeId={activeTab}
            onChange={handleTabChange}
            ariaLabel="기술 메뉴"
          />
        )
      }
      dock={
        activeTab === "program" && !isStyleDetail && recommendedAdjusted ? (
          <ComposerDockPrimary
            label={`${recommendedAdjusted.rounds}R 훈련 시작`}
            onClick={() => handleStartSession(recommended)}
          />
        ) : null
      }
      hideDock={isStyleDetail || activeTab !== "program" || !recommendedAdjusted}
    >
      {!isStyleDetail ? (
        <header className="curriculum-hero curriculum-hero-compact">
          <p className="curriculum-intro">
            {activeTab === "techniques"
              ? "스타일은 정답이 아니라 자주 쓰는 선택입니다. 하나를 고르면 전용 화면으로 들어갑니다."
              : "4주 · 12세션. 영상 보고 바로 훈련까지 이어가세요."}
          </p>
        </header>
      ) : null}

      {activeTab === "techniques" && !selectedStyle ? (
        <section className="style-lab">
          <div className="style-picker" aria-label="복싱 스타일 선택">
            {techniqueCatalog.map((style) => (
              <button
                type="button"
                className="style-picker-card"
                key={style.id}
                onClick={() => handleOpenStyle(style.id)}
              >
                <span className="style-picker-icon" aria-hidden="true">
                  {style.icon}
                </span>
                <span className="style-picker-en">{style.en}</span>
                <strong>{style.title}</strong>
                <p>{style.summary}</p>
                {style.advanced ? <em>숙련자 권장</em> : null}
                <span className="style-picker-enter">들어가기 →</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {isStyleDetail && !selectedCategory ? (
        <section
          className="style-detail"
          aria-label={`${selectedStyle.title} 카테고리`}
        >
          <div className="style-category-grid">
            {styleCategories.map((category) => (
              <button
                type="button"
                className={`style-category-card kind-${category.kind}`}
                key={category.id}
                onClick={() => handleOpenCategory(category.id)}
              >
                <span className="style-category-kicker">
                  {category.kind === "overview"
                    ? "OVERVIEW"
                    : category.kind === "flow"
                      ? "FLOW"
                      : `STEP ${String(category.order).padStart(2, "0")}`}
                </span>
                <strong>{category.label}</strong>
                <p>{category.title}</p>
                <span className="style-picker-enter">보기 →</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {isCategoryDetail ? (
        <section
          className="style-category-detail"
          aria-label={`${selectedCategory.label} 상세`}
        >
          {selectedCategory.kind === "overview" ? (
            <article className="style-category-panel">
              <p className="style-category-panel-label">제목 · 요약</p>
              <h2>{selectedStyle.title}</h2>
              <p className="style-category-panel-en">{selectedStyle.en}</p>
              <p>{selectedStyle.summary}</p>
              {selectedStyle.advanced ? (
                <p className="style-detail-advanced">
                  숙련자 권장 · 균형이 잡힌 뒤 연습하세요
                </p>
              ) : null}
            </article>
          ) : null}

          {selectedCategory.kind === "flow" ? (
            <article className="style-category-panel">
              <p className="style-category-panel-label">흐름 순서</p>
              <h2>이렇게 연결합니다</h2>
              <ol className="style-detail-flow-steps">
                {selectedCategory.steps.map((step, index) => (
                  <li key={`${selectedStyle.id}-flow-${index}`}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{step}</strong>
                  </li>
                ))}
              </ol>
            </article>
          ) : null}

          {selectedCategory.kind === "stage" ? (
            <article className="style-category-panel">
              <p className="style-category-panel-label">
                단계 {String(selectedCategory.order).padStart(2, "0")} · 드릴
              </p>
              <h2>{selectedCategory.stage.title}</h2>
              <p>{selectedCategory.stage.purpose}</p>

              <div className="style-drill style-detail-drill">
                <div className="style-drill-head">
                  <div>
                    <span>DRILL · 3분 기준</span>
                    <strong>{selectedCategory.stage.drill.title}</strong>
                  </div>
                  <em>{selectedCategory.stage.drill.rounds}R</em>
                </div>
                <p>{selectedCategory.stage.drill.goal}</p>
                <ol>
                  {selectedCategory.stage.drill.cues.map((cue) => (
                    <li key={cue}>{cue}</li>
                  ))}
                </ol>
                <button
                  type="button"
                  className="style-drill-start"
                  onClick={() =>
                    handleStartStyleDrill(
                      selectedStyle,
                      selectedCategory.stage
                    )
                  }
                >
                  {selectedCategory.stage.drill.rounds}R 드릴 시작
                </button>
              </div>
            </article>
          ) : null}
        </section>
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

      {activeTab === "program" ? (
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
