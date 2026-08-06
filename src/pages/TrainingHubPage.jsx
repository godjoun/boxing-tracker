import { useMemo, useState } from "react";
import { useTraining } from "../store/TrainingContext";
import { MATCH_TIMER_PRESETS, DEFAULT_BOXING_WORK_SECONDS } from "../utils/timerPresets";
import { startTimerAudioSession } from "../utils/timerAudio";
import { isDevSurfaceLog } from "../utils/devMode";
import {
  WORKOUT_DETAILS_MAX_LENGTH,
  loadRecentWorkoutDetails,
  normalizeWorkoutDetails,
} from "../utils/workoutDetails";
import MenuIcon from "../components/MenuIcon";
import WorkoutDetailsQuickBar from "../components/WorkoutDetailsQuickBar";

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
  const { logs } = useTraining();
  const [categoryId, setCategoryId] = useState("boxing");
  const [boxingKindId, setBoxingKindId] = useState("round");
  const [roundPresetId, setRoundPresetId] = useState(
    MATCH_TIMER_PRESETS[0]?.id || "match3"
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [workoutDetails, setWorkoutDetails] = useState("");
  const [recentWorkoutDetails] = useState(() => loadRecentWorkoutDetails());

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
  const runningGoalMinutes = 30;

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
    await startTimerAudioSession();
    onStartPreset?.({
      id: "running-time-30",
      title: "러닝",
      description: "시간 목표 러닝",
      rounds: 1,
      workSeconds: runningGoalMinutes * 60,
      restSeconds: 0,
      logType: "러닝",
      routineTitle: "러닝 · 30분",
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
    {
      id: "weights",
      icon: "body",
      title: "복싱 체력",
      detail: "10분 · 무도구 보조",
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
      id: "curriculum",
      label: "기술 루틴",
      hint: "커리큘럼으로 이어가기",
      onClick: onOpenCurriculum,
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
      : categoryId === "weights"
        ? {
            label: "루틴 열기",
            detail: "10분 · 무도구 보조",
            onClick: () => onOpenStrength?.(),
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
        </section>
      ) : null}

      <details className="training-tools-details">
        <summary className="training-tools-summary">
          <span>기타 기능 보기</span>
          <strong>기록 · 기술 · 콤보</strong>
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
        <button type="button" onClick={() => cta.onClick?.()}>
          {cta.label}
          <small>{cta.detail}</small>
        </button>
      </div>
    </main>
  );
}
