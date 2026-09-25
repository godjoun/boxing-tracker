import { useEffect, useMemo, useRef, useState } from "react";
import TrainingDecisionBoard from "../components/training/TrainingDecisionBoard";
import TrainingSessionSettings from "../components/training/TrainingSessionSettings";
import TrainingStageCard from "../components/training/TrainingStageCard";
import TrainingToolsPanel from "../components/training/TrainingToolsPanel";
import TrainingWorkoutDetailsPanel from "../components/training/TrainingWorkoutDetailsPanel";
import WorkoutNameModal from "../components/training/WorkoutNameModal";
import { useTraining } from "../store/TrainingContext";
import {
  RUNNING_GOAL_DEFAULT,
  RUNNING_GOAL_MIN_MESSAGE,
  RUNNING_GOAL_PRESETS,
  buildRunningLaunchConfig,
  parseRunningGoalMinutes,
} from "../utils/runningGoal";
import { MATCH_TIMER_PRESETS } from "../utils/timerPresets";
import { startTimerAudioSession } from "../utils/timerAudio";
import {
  BOXING_KINDS,
  DEFAULT_BOXING_KIND_ID,
  DEFAULT_ROUND_PRESET_ID,
  PRIMARY_TRAINING_CHOICES,
  TRAINING_CATEGORY,
  buildBoxingPreset,
  buildRoundSummary,
  buildTodayTrainingSummary,
  buildTrainingStage,
  resolveBoxingKind,
  resolveRoundPreset,
} from "../utils/trainingHub";
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

function presetErrorMessage(error) {
  if (error === "duplicate") return "같은 이름이 이미 있어요";
  if (error === "full") return "최대 3개까지 저장할 수 있어요";
  if (error === "empty") return "이름과 운동 내용을 입력해 주세요";
  if (error === "missing") return "저장한 운동을 찾을 수 없어요";
  return "저장하지 못했어요";
}

export default function TrainingHubPage({
  onStartPreset,
  onOpenTimer,
  onOpenCurriculum,
  onOpenComboCreator,
  onOpenStrength,
  onOpenLog,
  onStartMinimumRound,
}) {
  const { logs, userId } = useTraining();
  const [categoryId, setCategoryId] = useState(TRAINING_CATEGORY.BOXING);
  const [boxingKindId, setBoxingKindId] = useState(DEFAULT_BOXING_KIND_ID);
  const [roundPresetId, setRoundPresetId] = useState(DEFAULT_ROUND_PRESET_ID);
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
  const canSaveCurrent = Boolean(normalizedWorkoutDetails) && !presetsFull;
  const todaySummary = useMemo(() => buildTodayTrainingSummary(logs), [logs]);
  const selectedRoundPreset = resolveRoundPreset(roundPresetId);
  const boxingKind = resolveBoxingKind(boxingKindId);
  const roundSummary = buildRoundSummary(selectedRoundPreset);
  const stage = buildTrainingStage({
    categoryId,
    boxingKind,
    runningGoalMinutes,
    roundPreset: selectedRoundPreset,
    todaySummary,
  });
  const selectedChoiceId =
    categoryId === TRAINING_CATEGORY.BOXING &&
    boxingKindId === DEFAULT_BOXING_KIND_ID &&
    roundPresetId === DEFAULT_ROUND_PRESET_ID
      ? "standard"
      : "";

  const categories = [
    {
      id: TRAINING_CATEGORY.BOXING,
      icon: "skill",
      title: "복싱",
      detail: "라운드 · 샌드백 · 미트",
    },
    {
      id: TRAINING_CATEGORY.RUNNING,
      icon: "growth",
      title: "러닝",
      detail: `시간 목표 · ${runningGoalMinutes}분`,
    },
  ];

  function markRecentSelectionDelay() {
    ignoreStartUntilRef.current = Date.now() + 500;
  }

  function selectStandardTraining() {
    setCategoryId(TRAINING_CATEGORY.BOXING);
    setBoxingKindId(DEFAULT_BOXING_KIND_ID);
    setRoundPresetId(DEFAULT_ROUND_PRESET_ID);
    setSettingsOpen(false);
    markRecentSelectionDelay();
  }

  function selectRunningTraining() {
    setCategoryId(TRAINING_CATEGORY.RUNNING);
    setSettingsOpen(false);
    markRecentSelectionDelay();
  }

  function selectCategory(nextCategoryId) {
    setCategoryId(nextCategoryId);
    setSettingsOpen(false);
    markRecentSelectionDelay();
  }

  function buildCurrentBoxingPreset() {
    return buildBoxingPreset({
      boxingKind,
      preset: selectedRoundPreset,
      workoutDetails,
    });
  }

  async function startBoxingSession() {
    const preset = buildCurrentBoxingPreset();
    if (!preset) return;
    await startTimerAudioSession();
    onStartPreset?.(preset);
  }

  async function startStandardRound() {
    selectStandardTraining();
    const preset = buildBoxingPreset({
      boxingKind: resolveBoxingKind(DEFAULT_BOXING_KIND_ID),
      preset: resolveRoundPreset(DEFAULT_ROUND_PRESET_ID),
      workoutDetails,
    });
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
    onStartPreset?.(
      buildRunningLaunchConfig(minutes, normalizeWorkoutDetails(workoutDetails))
    );
  }

  async function startMinimumRound() {
    await startTimerAudioSession();
    if (onStartMinimumRound) {
      onStartMinimumRound();
      return;
    }

    const basePreset = resolveRoundPreset(DEFAULT_ROUND_PRESET_ID);
    onStartPreset?.({
      ...basePreset,
      id: "minimum-1r",
      title: "1R",
      rounds: 1,
      routineTitle: "오늘 1R",
      logType: "1R 라운드 훈련",
      workoutDetails: normalizeWorkoutDetails(workoutDetails) || "오늘 최소 1R",
    });
  }

  async function startSelectedSession() {
    if (categoryId === TRAINING_CATEGORY.RUNNING) {
      await startRunningSession();
      return;
    }
    await startBoxingSession();
  }

  function openCustomRoundSetup() {
    const preset = buildCurrentBoxingPreset();
    if (!preset) {
      onOpenTimer?.();
      return;
    }
    setSettingsOpen(false);
    onOpenTimer?.(preset);
  }

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

  function setRunningDraft(value) {
    const digits = String(value ?? "").replace(/\D/g, "");
    setRunningCustomDraft(digits);
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

  function updateNameDraft(value) {
    setNameDraft(value);
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

  function handleChoice(choice) {
    if (choice.action === "start-standard") {
      startStandardRound();
      return;
    }
    if (choice.action === "start-minimum") {
      startMinimumRound();
      return;
    }
    if (choice.action === "open-techniques") {
      onOpenCurriculum?.("techniques");
      return;
    }
    if (choice.action === "open-program") {
      onOpenCurriculum?.("program");
    }
  }

  const tools = [
    {
      id: "running",
      label: `${runningGoalMinutes}분 러닝`,
      hint: "로드워크를 시간으로 남깁니다",
      onClick: selectRunningTraining,
    },
    {
      id: "strength",
      label: "복싱 체력",
      hint: "10분 · 무도구 보조 훈련",
      onClick: onOpenStrength,
    },
    {
      id: "timer",
      label: "자유 타이머",
      hint: "라운드 · 운동 · 휴식 직접 설정",
      onClick: openCustomRoundSetup,
    },
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

  return (
    <main className="hub-page levelup-page training-page training-page-focus">
      <header className="levelup-header training-focus-header">
        <div>
          <h1 className="levelup-title">훈련</h1>
          <p className="training-page-sub">체육관 밖에서도 오늘 라운드는 남습니다</p>
        </div>
        <p className="training-today-chip">
          오늘 {todaySummary.rounds}R · {todaySummary.minutes}분
        </p>
      </header>

      <TrainingStageCard stage={stage} />

      <TrainingDecisionBoard
        choices={PRIMARY_TRAINING_CHOICES}
        selectedChoiceId={selectedChoiceId}
        onChoice={handleChoice}
      />

      <TrainingSessionSettings
        boxingKindId={boxingKindId}
        boxingKinds={BOXING_KINDS}
        categories={categories}
        categoryId={categoryId}
        roundPresetId={roundPresetId}
        roundPresets={MATCH_TIMER_PRESETS}
        roundSummary={roundSummary}
        runningCustomDraft={runningCustomDraft}
        runningGoalMinutes={runningGoalMinutes}
        runningGoalPresets={RUNNING_GOAL_PRESETS}
        settingsOpen={settingsOpen}
        onApplyRunningGoalMinutes={applyRunningGoalMinutes}
        onCommitRunningCustomMinutes={commitRunningCustomMinutes}
        onOpenCustomRoundSetup={openCustomRoundSetup}
        onRunningCustomDraftChange={setRunningDraft}
        onSelectBoxingKind={setBoxingKindId}
        onSelectCategory={selectCategory}
        onSelectRoundPreset={(presetId) => {
          setRoundPresetId(presetId);
          setSettingsOpen(false);
        }}
        onToggleSettings={() => setSettingsOpen((open) => !open)}
      />

      <TrainingWorkoutDetailsPanel
        canSaveCurrent={canSaveCurrent}
        categoryId={categoryId}
        maxLength={WORKOUT_DETAILS_MAX_LENGTH}
        menuOpenId={menuOpenId}
        presetsFull={presetsFull}
        recentWorkoutDetails={recentWorkoutDetails}
        savedMenuRef={savedMenuRef}
        savedWorkouts={savedWorkouts}
        workoutDetails={workoutDetails}
        onApplySavedWorkout={applySavedWorkout}
        onDeleteSavedWorkout={deleteSavedWorkout}
        onOpenRenameModal={openRenameModal}
        onOpenSaveNameModal={openSaveNameModal}
        onSetMenuOpenId={setMenuOpenId}
        onWorkoutDetailsChange={setWorkoutDetails}
      />

      <TrainingToolsPanel tools={tools} />

      <WorkoutNameModal
        error={nameError}
        maxLength={WORKOUT_DETAIL_PRESET_NAME_MAX}
        modal={nameModal}
        nameDraft={nameDraft}
        onChangeName={updateNameDraft}
        onClose={closeNameModal}
        onSubmit={submitNameModal}
      />

      <div className="training-start-dock">
        <button
          type="button"
          onClick={() => {
            if (Date.now() < ignoreStartUntilRef.current) return;
            startSelectedSession();
          }}
        >
          {stage.ctaLabel}
          <small>{stage.ctaDetail}</small>
        </button>
      </div>
    </main>
  );
}
