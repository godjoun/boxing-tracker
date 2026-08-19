import { useEffect, useMemo, useRef, useState } from "react";
import { useTraining } from "../store/TrainingContext";
import { MATCH_TIMER_PRESETS, DEFAULT_BOXING_WORK_SECONDS } from "../utils/timerPresets";
import { startTimerAudioSession } from "../utils/timerAudio";
import { isDevSurfaceLog } from "../utils/devMode";
import {
  WORKOUT_DETAIL_PRESETS_LIMIT,
  WORKOUT_DETAIL_PRESET_NAME_MAX,
  WORKOUT_DETAILS_MAX_LENGTH,
  deleteWorkoutDetailPreset,
  loadRecentWorkoutDetails,
  loadWorkoutDetailPresets,
  normalizeWorkoutDetails,
  normalizeWorkoutPresetName,
  renameWorkoutDetailPreset,
  saveWorkoutDetailPreset,
} from "../utils/workoutDetails";
import MenuIcon from "../components/MenuIcon";
import WorkoutDetailsQuickBar from "../components/WorkoutDetailsQuickBar";
import {
  RUNNING_GOAL_DEFAULT,
  RUNNING_GOAL_MIN_MESSAGE,
  RUNNING_GOAL_PRESETS,
  buildRunningLaunchConfig,
  parseRunningGoalMinutes,
} from "../utils/runningGoal";

function presetErrorMessage(error) {
  if (error === "duplicate") return "같은 이름이 이미 있어요";
  if (error === "full") return "최대 3개까지 저장할 수 있어요";
  if (error === "empty") return "이름과 운동 내용을 입력해 주세요";
  if (error === "missing") return "저장한 운동을 찾을 수 없어요";
  return "저장하지 못했어요";
}

function getTodayString() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;
}

function getLogRounds(log) {
  return Number(log.rounds || log.totalRounds || log.completedRounds || 0);
}

function formatRestLabel(seconds) {
  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60);
    const remain = seconds % 60;
    return remain ? `${minutes}분 ${remain}초` : `${minutes}분`;
  }
  return `${seconds}초`;
}

const BOXING_KINDS = [
  { id: "round", title: "라운드", logType: null },
  { id: "bag", title: "샌드백", logType: "샌드백" },
  { id: "mitt", title: "미트", logType: "미트 훈련" },
  { id: "sparring", title: "스파링", logType: "스파링" },
  { id: "shadow", title: "쉐도우", logType: "쉐도우" },
];

export default function TrainingHubPage({
  onStartPreset,
  onOpenTimer,
  onOpenCurriculum,
  onOpenComboCreator,
  onOpenStrength,
  onOpenLog,
}) {
  const { logs, userId } = useTraining();
  const [categoryId, setCategoryId] = useState("boxing");
  const [boxingKindId, setBoxingKindId] = useState("round");
  const [roundPresetId, setRoundPresetId] = useState(
    MATCH_TIMER_PRESETS[0]?.id || "match3"
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [runningGoalMinutes, setRunningGoalMinutes] = useState(
    RUNNING_GOAL_DEFAULT
  );
  const [runningCustomDraft, setRunningCustomDraft] = useState("");
  const [workoutDetails, setWorkoutDetails] = useState("");
  const [recentWorkoutDetails] = useState(() => loadRecentWorkoutDetails());
  const [savedWorkouts, setSavedWorkouts] = useState(() =>
    loadWorkoutDetailPresets(userId)
  );
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [nameModal, setNameModal] = useState(null);
  const [nameDraft, setNameDraft] = useState("");
  const [nameError, setNameError] = useState("");
  const savedMenuRef = useRef(null);
  const ignoreStartUntilRef = useRef(0);

  useEffect(() => {
    if (!menuOpenId) return undefined;
    function handlePointerDown(event) {
      if (savedMenuRef.current && !savedMenuRef.current.contains(event.target)) {
        setMenuOpenId(null);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [menuOpenId]);

  const normalizedWorkoutDetails = normalizeWorkoutDetails(workoutDetails);
  const presetsFull = savedWorkouts.length >= WORKOUT_DETAIL_PRESETS_LIMIT;
  const canSaveCurrent =
    Boolean(normalizedWorkoutDetails) && !presetsFull;

  const todaySummary = useMemo(() => {
    const todayLogs = logs.filter(
      (log) => log.date === getTodayString() && !isDevSurfaceLog(log)
    );
    return {
      rounds: todayLogs.reduce((sum, log) => sum + getLogRounds(log), 0),
      minutes: todayLogs.reduce(
        (sum, log) => sum + Number(log.minutes || log.duration || 0),
        0
      ),
    };
  }, [logs]);

  const selectedRoundPreset =
    MATCH_TIMER_PRESETS.find((preset) => preset.id === roundPresetId) ||
    MATCH_TIMER_PRESETS[0];
  const boxingKind =
    BOXING_KINDS.find((kind) => kind.id === boxingKindId) || BOXING_KINDS[0];

  const sessionRounds = Number(selectedRoundPreset?.rounds || 3);
  const workSeconds = Number(
    selectedRoundPreset?.workSeconds || DEFAULT_BOXING_WORK_SECONDS
  );
  const restSeconds = Number(selectedRoundPreset?.restSeconds || 30);
  const workMinutes = Math.round(workSeconds / 60);
  const roundSummary = `${sessionRounds}R · 운동 ${workMinutes}분 · 휴식 ${formatRestLabel(
    restSeconds
  )}`;

  function applyRunningGoalMinutes(minutes) {
    const next = parseRunningGoalMinutes(minutes);
    if (next == null) return;
    setRunningGoalMinutes(next);
    setRunningCustomDraft("");
    setSettingsOpen(false);
  }

  function commitRunningCustomMinutes() {
    if (runningCustomDraft === "") return;
    const next = parseRunningGoalMinutes(runningCustomDraft);
    if (next == null) return;
    setRunningGoalMinutes(next);
    setRunningCustomDraft(String(next));
    setSettingsOpen(false);
  }

  function buildBoxingPreset() {
    if (!selectedRoundPreset) return null;
    const logType = boxingKind.logType;
    return {
      ...selectedRoundPreset,
      title: logType || selectedRoundPreset.title,
      logType: logType || undefined,
      routineTitle: logType
        ? `${logType} · ${sessionRounds}R`
        : `${sessionRounds}R 라운드 훈련`,
      workoutDetails: normalizeWorkoutDetails(workoutDetails),
    };
  }

  async function startBoxingSession() {
    const preset = buildBoxingPreset();
    if (!preset) return;
    await startTimerAudioSession();
    onStartPreset?.(preset);
  }

  async function startRunningSession() {
    const raw =
      runningCustomDraft !== "" ? runningCustomDraft : runningGoalMinutes;
    const minutes = parseRunningGoalMinutes(raw);
    if (minutes == null) {
      window.alert(RUNNING_GOAL_MIN_MESSAGE);
      return;
    }

    setRunningGoalMinutes(minutes);
    setRunningCustomDraft("");
    await startTimerAudioSession();
    onStartPreset?.({
      ...buildRunningLaunchConfig(minutes),
      workoutDetails: normalizeWorkoutDetails(workoutDetails),
    });
  }

  function openCustomRoundSetup() {
    const preset = buildBoxingPreset();
    if (!preset) {
      onOpenTimer?.();
      return;
    }
    onOpenTimer?.(preset);
  }

  function openSaveNameModal() {
    if (!canSaveCurrent) return;
    setMenuOpenId(null);
    setNameDraft("");
    setNameError("");
    setNameModal({ mode: "save" });
  }

  function openRenameModal(preset) {
    setMenuOpenId(null);
    setNameDraft(preset.name);
    setNameError("");
    setNameModal({ mode: "rename", presetId: preset.id });
  }

  function closeNameModal() {
    setNameModal(null);
    setNameDraft("");
    setNameError("");
  }

  function submitNameModal() {
    if (!nameModal) return;
    const nextName = normalizeWorkoutPresetName(nameDraft);
    if (!nextName) {
      setNameError(presetErrorMessage("empty"));
      return;
    }

    if (nameModal.mode === "save") {
      const result = saveWorkoutDetailPreset(userId, {
        name: nextName,
        details: normalizedWorkoutDetails,
      });
      setSavedWorkouts(result.presets);
      if (!result.ok) {
        setNameError(presetErrorMessage(result.error));
        return;
      }
      closeNameModal();
      return;
    }

    const result = renameWorkoutDetailPreset(
      userId,
      nameModal.presetId,
      nextName
    );
    setSavedWorkouts(result.presets);
    if (!result.ok) {
      setNameError(presetErrorMessage(result.error));
      return;
    }
    closeNameModal();
  }

  function applySavedWorkout(preset) {
    setMenuOpenId(null);
    const nextDetails = normalizeWorkoutDetails(preset.details);
    const current = normalizeWorkoutDetails(workoutDetails);
    if (current === nextDetails) return;
    if (current) {
      const ok = window.confirm("지금 내용을 바꿀까요?");
      if (!ok) return;
    }
    setWorkoutDetails(nextDetails);
  }

  function deleteSavedWorkout(preset) {
    setMenuOpenId(null);
    const ok = window.confirm(`‘${preset.name}’을(를) 삭제할까요?`);
    if (!ok) return;
    const result = deleteWorkoutDetailPreset(userId, preset.id);
    setSavedWorkouts(result.presets);
  }

  const categories = [
    {
      id: "boxing",
      icon: "skill",
      title: "복싱",
      detail: "라운드 · 샌드백 · 미트",
    },
    {
      id: "running",
      icon: "growth",
      title: "러닝",
      detail: `시간 목표 · ${runningGoalMinutes}분`,
    },
  ];

  const moreTools = [
    {
      id: "free",
      label: "직접 기록하기",
      hint: "이미 끝난 운동을 적습니다",
      onClick: () => onOpenLog?.(),
    },
    {
      id: "combo",
      label: "콤보 만들기",
      hint: "나만의 흐름",
      onClick: onOpenComboCreator,
    },
  ];

  const cta =
    categoryId === "running"
      ? {
          label: "러닝 시작",
          detail: `시간 목표 · ${runningGoalMinutes}분`,
          onClick: startRunningSession,
        }
      : {
          label: "훈련 시작",
          detail: `${boxingKind.title} · ${roundSummary}`,
          onClick: startBoxingSession,
        };

  return (
    <main className="hub-page levelup-page training-page training-page-focus">
      <header className="levelup-header training-focus-header">
        <div>
          <h1 className="levelup-title">훈련</h1>
        </div>
        <p className="training-today-chip">
          오늘 {todaySummary.rounds}R · {todaySummary.minutes}분
        </p>
      </header>

      <section className="training-path-section" aria-label="핵심 훈련">
        <button
          type="button"
          className="training-mode-card"
          onClick={() => onOpenCurriculum?.("program")}
        >
          <span className="training-mode-card-copy">
            <strong>4주 코스</strong>
            <small>순서대로 따라가는 홈복싱 훈련</small>
          </span>
          <span className="training-mode-card-arrow" aria-hidden="true">
            ›
          </span>
        </button>
        <button
          type="button"
          className="training-mode-card"
          onClick={() => onOpenCurriculum?.("techniques")}
        >
          <span className="training-mode-card-copy">
            <strong>기술 연습</strong>
            <small>원하는 스타일과 기술을 골라 연습</small>
          </span>
          <span className="training-mode-card-arrow" aria-hidden="true">
            ›
          </span>
        </button>
        <button
          type="button"
          className="training-mode-card"
          onClick={() => onOpenStrength?.()}
        >
          <span className="training-mode-card-copy">
            <strong>복싱 체력</strong>
            <small>10분 · 무도구 복싱 보조 훈련</small>
          </span>
          <span className="training-mode-card-arrow" aria-hidden="true">
            ›
          </span>
        </button>
      </section>

      <header className="training-free-heading">
        <h2>자유 훈련</h2>
        <p>코스를 따라가지 않고 직접 정해서 합니다</p>
      </header>

      <section className="training-mode-section" aria-label="훈련 종류">
        <div className="training-mode-grid">
          {categories.map((category) => {
            const selected = categoryId === category.id;
            return (
              <button
                key={category.id}
                type="button"
                className={`training-mode-card${selected ? " is-selected" : ""}`}
                aria-pressed={selected}
                onClick={() => {
                  setCategoryId(category.id);
                  setSettingsOpen(false);
                  ignoreStartUntilRef.current = Date.now() + 500;
                }}
              >
                <span className="training-mode-card-icon" aria-hidden="true">
                  <MenuIcon name={category.icon} size={16} />
                </span>
                <span className="training-mode-card-copy">
                  <strong>{category.title}</strong>
                  <small>{category.detail}</small>
                </span>
                <span
                  className={`training-mode-card-check${selected ? " is-on" : ""}`}
                  aria-hidden="true"
                >
                  {selected ? "✓" : ""}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {categoryId === "boxing" ? (
        <section className="training-boxing-setup" aria-label="복싱 훈련 설정">
          <div className="training-kind-row" role="list">
            {BOXING_KINDS.map((kind) => {
              const selected = boxingKindId === kind.id;
              return (
                <button
                  key={kind.id}
                  type="button"
                  role="listitem"
                  className={`training-kind-chip${selected ? " is-selected" : ""}`}
                  aria-pressed={selected}
                  onClick={() => setBoxingKindId(kind.id)}
                >
                  {kind.title}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className={`training-round-row${settingsOpen ? " is-open" : ""}`}
            aria-expanded={settingsOpen}
            onClick={() => setSettingsOpen((open) => !open)}
          >
            <span>
              <small>현재 설정</small>
              <strong>{roundSummary}</strong>
            </span>
            <em>{settingsOpen ? "접기" : "변경"}</em>
          </button>

          {settingsOpen ? (
            <div className="training-round-picker" role="group" aria-label="라운드 설정">
              <div className="training-round-chip-row">
                {MATCH_TIMER_PRESETS.map((preset) => {
                  const selected = roundPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      className={`training-round-chip${selected ? " is-selected" : ""}`}
                      aria-pressed={selected}
                      onClick={() => {
                        setRoundPresetId(preset.id);
                        setSettingsOpen(false);
                      }}
                    >
                      {preset.rounds}R
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                className="training-round-option training-round-option-custom"
                onClick={() => {
                  setSettingsOpen(false);
                  openCustomRoundSetup();
                }}
              >
                <strong>직접 설정</strong>
                <small>라운드 · 운동 · 휴식 직접 조절</small>
                <span>›</span>
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {categoryId === "running" ? (
        <section className="training-boxing-setup" aria-label="러닝 시간 목표">
          <button
            type="button"
            className={`training-round-row${settingsOpen ? " is-open" : ""}`}
            aria-expanded={settingsOpen}
            onClick={() => setSettingsOpen((open) => !open)}
          >
            <span>
              <small>현재 목표</small>
              <strong>{runningGoalMinutes}분</strong>
            </span>
            <em>{settingsOpen ? "접기" : "변경"}</em>
          </button>

          {settingsOpen ? (
            <div className="training-round-picker" role="group" aria-label="러닝 시간">
              <div className="training-round-chip-row">
                {RUNNING_GOAL_PRESETS.map((minutes) => {
                  const selected =
                    runningCustomDraft === "" && runningGoalMinutes === minutes;
                  return (
                    <button
                      key={minutes}
                      type="button"
                      className={`training-round-chip${selected ? " is-selected" : ""}`}
                      aria-pressed={selected}
                      onClick={() => applyRunningGoalMinutes(minutes)}
                    >
                      {minutes}분
                    </button>
                  );
                })}
              </div>
              <label className="training-running-custom">
                <span>직접 설정</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  enterKeyHint="done"
                  value={
                    runningCustomDraft === ""
                      ? RUNNING_GOAL_PRESETS.includes(runningGoalMinutes)
                        ? ""
                        : String(runningGoalMinutes)
                      : runningCustomDraft
                  }
                  placeholder="분"
                  onChange={(event) => {
                    const digits = String(event.target.value ?? "").replace(
                      /\D/g,
                      ""
                    );
                    setRunningCustomDraft(digits);
                  }}
                  onBlur={commitRunningCustomMinutes}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      event.currentTarget.blur();
                    }
                  }}
                  aria-label="러닝 목표 분"
                />
              </label>
            </div>
          ) : null}
        </section>
      ) : null}

      {categoryId === "boxing" || categoryId === "running" ? (
        <section
          className="training-workout-details-block"
          aria-label="오늘 할 운동"
        >
          <label className="training-workout-details">
            <span>오늘 할 운동</span>
            <input
              type="text"
              value={workoutDetails}
              maxLength={WORKOUT_DETAILS_MAX_LENGTH}
              placeholder="예: 줄넘기 2R · 쉐도우 3R · 샌드백 4R"
              onChange={(event) => setWorkoutDetails(event.target.value)}
              autoComplete="off"
              enterKeyHint="done"
            />
          </label>
          {categoryId === "boxing" ? (
            <WorkoutDetailsQuickBar
              value={workoutDetails}
              onChange={setWorkoutDetails}
            />
          ) : null}
          {recentWorkoutDetails.length > 0 ? (
            <div
              className="training-workout-recent"
              role="list"
              aria-label="최근 운동 내용"
            >
              {recentWorkoutDetails.map((item) => (
                <button
                  key={item}
                  type="button"
                  role="listitem"
                  className="training-workout-recent-chip"
                  onClick={() => setWorkoutDetails(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          ) : null}
          <div className="training-workout-saved" aria-label="저장한 운동">
            <div className="training-workout-saved-header">
              <span className="training-workout-saved-label">저장한 운동</span>
              <button
                type="button"
                className="training-workout-save-btn"
                disabled={!canSaveCurrent}
                onClick={openSaveNameModal}
              >
                현재 운동 저장
              </button>
            </div>
            {savedWorkouts.length > 0 ? (
              <div
                className="training-workout-saved-list"
                role="list"
                ref={savedMenuRef}
              >
                {savedWorkouts.map((preset) => (
                  <div
                    key={preset.id}
                    className="training-workout-saved-row"
                    role="listitem"
                  >
                    <button
                      type="button"
                      className="training-workout-saved-name"
                      onClick={() => applySavedWorkout(preset)}
                    >
                      {preset.name}
                    </button>
                    <div className="training-workout-saved-menu-wrap">
                      <button
                        type="button"
                        className="training-workout-saved-menu-btn"
                        aria-label={`${preset.name} 메뉴`}
                        aria-expanded={menuOpenId === preset.id}
                        onClick={() =>
                          setMenuOpenId((current) =>
                            current === preset.id ? null : preset.id
                          )
                        }
                      >
                        ⋯
                      </button>
                      {menuOpenId === preset.id ? (
                        <div
                          className="training-workout-saved-menu"
                          role="menu"
                        >
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => openRenameModal(preset)}
                          >
                            이름 변경
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => deleteSavedWorkout(preset)}
                          >
                            삭제
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            {presetsFull ? (
              <p className="training-workout-saved-hint">
                최대 3개까지 저장할 수 있어요
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {nameModal ? (
        <div
          className="training-workout-name-modal"
          role="dialog"
          aria-modal="true"
          aria-label={nameModal.mode === "save" ? "운동 이름 저장" : "이름 변경"}
        >
          <button
            type="button"
            className="training-workout-name-modal-backdrop"
            aria-label="닫기"
            onClick={closeNameModal}
          />
          <div className="training-workout-name-modal-panel">
            <strong>
              {nameModal.mode === "save" ? "운동 이름" : "이름 변경"}
            </strong>
            <input
              type="text"
              value={nameDraft}
              maxLength={WORKOUT_DETAIL_PRESET_NAME_MAX}
              placeholder="예: 기본 훈련"
              autoFocus
              autoComplete="off"
              enterKeyHint="done"
              onChange={(event) => {
                setNameDraft(event.target.value);
                setNameError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submitNameModal();
                }
              }}
            />
            {nameError ? (
              <p className="training-workout-name-modal-error">{nameError}</p>
            ) : null}
            <div className="training-workout-name-modal-actions">
              <button type="button" onClick={closeNameModal}>
                취소
              </button>
              <button type="button" onClick={submitNameModal}>
                저장
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <details className="training-tools-details">
        <summary className="training-tools-summary">
          <span>기타 기능 보기</span>
          <strong>기록 · 콤보</strong>
        </summary>
        <section className="training-tools-section" aria-label="추가 훈련 도구">
          {moreTools.map((tool) => (
            <button key={tool.id} type="button" onClick={tool.onClick}>
              <span>{tool.label}</span>
              <small>{tool.hint}</small>
              <b>›</b>
            </button>
          ))}
        </section>
      </details>

      <div className="training-start-dock">
        <button
          type="button"
          onClick={() => {
            if (Date.now() < ignoreStartUntilRef.current) return;
            cta.onClick?.();
          }}
        >
          {cta.label}
          <small>{cta.detail}</small>
        </button>
      </div>
    </main>
  );
}
