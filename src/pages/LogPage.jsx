import { useEffect, useMemo, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import { useTraining } from "../store/TrainingContext";
import { getCompletionDelta } from "../utils/fighterProgress";
import {
  getLogRounds,
} from "../utils/trainingStats";
import {
  getLogCategory,
  getLogSummary,
  getRunningPaceLabel,
  getWeightsExerciseTitle,
  inferLogCategory,
  LOG_CATEGORIES,
  normalizeLogCategory,
} from "../utils/logCategories";
import { isDevSurfaceLog } from "../utils/devMode";
import { DEFAULT_BOXING_WORK_SECONDS } from "../utils/timerPresets";
import "./LogPage.css";

const CUSTOM_EXERCISE_VALUE = "직접 입력";
const BOXING_MINUTES_PER_ROUND = DEFAULT_BOXING_WORK_SECONDS / 60;
const EXERCISE_OPTIONS = [
  ...LOG_CATEGORIES.flatMap((category) => category.subtypes),
  CUSTOM_EXERCISE_VALUE,
];

const ROUND_MIN = 1;
const ROUND_MAX = 12;
const ROUND_QUICK = [3, 6, 9, 12];

function RoundStepper({ value, onChange, min = ROUND_MIN, max = ROUND_MAX }) {
  const rounds = Number(value);
  const hasValue = Number.isFinite(rounds) && rounds > 0;
  const displayRounds = hasValue
    ? Math.min(max, Math.max(min, Math.round(rounds)))
    : 0;

  function commit(next) {
    onChange(Math.min(max, Math.max(min, next)));
  }

  return (
    <div className="log-round-stepper">
      <span className="log-round-stepper-label">라운드</span>
      <div className="log-round-stepper-row">
        <button
          type="button"
          className="log-round-stepper-btn"
          aria-label="라운드 줄이기"
          disabled={hasValue && displayRounds <= min}
          onClick={() => commit((hasValue ? displayRounds : min + 1) - 1)}
        >
          −
        </button>
        <strong className="log-round-stepper-value" aria-live="polite">
          {hasValue ? `${displayRounds}R` : "—"}
        </strong>
        <button
          type="button"
          className="log-round-stepper-btn"
          aria-label="라운드 늘리기"
          disabled={hasValue && displayRounds >= max}
          onClick={() => commit((hasValue ? displayRounds : min - 1) + 1)}
        >
          +
        </button>
      </div>
      <div className="log-round-quick" role="group" aria-label="빠른 라운드">
        {ROUND_QUICK.map((n) => (
          <button
            key={n}
            type="button"
            className={hasValue && displayRounds === n ? "is-active" : ""}
            onClick={() => commit(n)}
          >
            {n}R
          </button>
        ))}
      </div>
    </div>
  );
}

function formatDotDate(value) {
  if (!value) return "";
  return String(value).replaceAll("-", ".");
}

function LogDateField({ value, onChange, id = "log-date" }) {
  return (
    <div className="log-date-field">
      <span className="log-date-display">{formatDotDate(value) || "날짜 선택"}</span>
      <input
        id={id}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="log-date-native"
        aria-label="날짜"
      />
    </div>
  );
}

function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const date = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${date}`;
}

function getDistanceKm(from, to) {
  if (!from || !to) return 0;

  const earthRadiusKm = 6371;
  const toRadians = (value) => (value * Math.PI) / 180;
  const latDelta = toRadians(to.latitude - from.latitude);
  const lonDelta = toRadians(to.longitude - from.longitude);
  const startLat = toRadians(from.latitude);
  const endLat = toRadians(to.latitude);

  const haversine =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(startLat) *
      Math.cos(endLat) *
      Math.sin(lonDelta / 2) *
      Math.sin(lonDelta / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function getRounds(log) {
  return Number(
    log.rounds ||
      log.round ||
      log.totalRounds ||
      log.completedRounds ||
      0
  );
}

function createEmptyForm() {
  return {
    category: "",
    type: "",
    subtype: "",
    customType: "",
    minutes: "",
    rounds: "",
    date: getTodayString(),
    difficulty: "normal",
    condition: "normal",
    memo: "",
    publicComment: "",
    metrics: {},
  };
}

function getFinalExerciseName(formData) {
  if (formData.category === "weights") {
    return String(
      formData.customType || formData.metrics?.exerciseName || ""
    ).trim();
  }

  if (formData.type === CUSTOM_EXERCISE_VALUE) {
    return formData.customType.trim();
  }

  return formData.type;
}

function getCorePrompt(categoryId) {
  if (categoryId === "boxing") return "라운드만 고르면 됩니다";
  if (categoryId === "running") return "GPS로 채우거나 직접 입력하세요";
  if (categoryId === "weights") return "운동명과 세트·횟수를 적으세요";
  if (categoryId === "walking") return "GPS로 채우거나 시간을 적으세요";
  return "끝난 종류를 고르세요";
}

function getStepOneStatus(formData) {
  if (!formData.category) {
    return {
      isComplete: false,
      label: "종류를 고르세요",
      buttonLabel: "기록 저장",
    };
  }

  if (formData.category === "weights") {
    const exerciseName = getFinalExerciseName(formData);
    const hasSets = Number(formData.metrics?.sets || 0) > 0;
    const hasReps = Number(formData.metrics?.reps || 0) > 0;

    if (!exerciseName) {
      return {
        isComplete: false,
        label: "운동명을 입력하세요",
        buttonLabel: "기록 저장",
      };
    }

    if (!hasSets) {
      return {
        isComplete: false,
        label: "세트를 입력하세요",
        buttonLabel: "기록 저장",
      };
    }

    if (!hasReps) {
      return {
        isComplete: false,
        label: "횟수를 입력하세요",
        buttonLabel: "기록 저장",
      };
    }

    return {
      isComplete: true,
      label: "저장 가능",
      buttonLabel: "기록 저장",
    };
  }

  if (formData.category === "boxing") {
    if (!formData.rounds || Number(formData.rounds) <= 0) {
      return {
        isComplete: false,
        label: "라운드를 고르세요",
        buttonLabel: "기록 저장",
      };
    }

    return {
      isComplete: true,
      label: "저장 가능",
      buttonLabel: "기록 저장",
    };
  }

  if (
    ["running", "walking"].includes(formData.category) &&
    !formData.minutes &&
    !formData.metrics?.distanceKm
  ) {
    return {
      isComplete: false,
      label: "GPS로 측정하거나 직접 입력하세요",
      buttonLabel: "기록 저장",
    };
  }

  if (!formData.minutes || Number(formData.minutes) <= 0) {
    return {
      isComplete: false,
      label: "시간을 입력하세요",
      buttonLabel: "기록 저장",
    };
  }

  if (
    formData.category === "running" &&
    (!formData.metrics?.distanceKm || Number(formData.metrics.distanceKm) <= 0)
  ) {
    return {
      isComplete: false,
      label: "거리를 입력하세요",
      buttonLabel: "기록 저장",
    };
  }

  return {
    isComplete: true,
    label: "저장 가능",
    buttonLabel: "기록 저장",
  };
}

function isInPeriod(log, period, now = new Date()) {
  const date = new Date(`${log.date || ""}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (period === "year" ? 364 : period === "month" ? 29 : 6));
  return date >= start && date <= now;
}

function buildTrend(logs, period, now = new Date()) {
  const days = period === "year" ? 12 : period === "month" ? 8 : 7;
  const stepDays = period === "year" ? 30 : period === "month" ? 4 : 1;

  return Array.from({ length: days }, (_, index) => {
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    end.setDate(now.getDate() - (days - 1 - index) * stepDays);
    const start = new Date(end);
    start.setHours(0, 0, 0, 0);
    start.setDate(end.getDate() - (stepDays - 1));
    const value = logs
      .filter((log) => {
        const date = new Date(`${log.date || ""}T00:00:00`);
        return date >= start && date <= end;
      })
      .reduce(
        (sum, log) =>
          sum + Math.max(getLogRounds(log), Number(log.minutes || log.duration || 0) / 3),
        0
      );

    return {
      label:
        period === "year"
          ? `${end.getMonth() + 1}월`
          : `${end.getMonth() + 1}/${end.getDate()}`,
      value: Math.round(value),
    };
  });
}

export default function LogPage({ onGoProfileCardMaker, onGoProfile } = {}) {
  const {
    logs,
    addLog,
    updateLog,
    deleteLog,
    resetAllLogs,
  } = useTraining();

  const [form, setForm] = useState(createEmptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(createEmptyForm);
  const [reward, setReward] = useState(null);
  const [historyLimit, setHistoryLimit] = useState(5);
  const [historyCategory, setHistoryCategory] = useState("all");
  const [historyPeriod, setHistoryPeriod] = useState("week");
  const [autoTracking, setAutoTracking] = useState(null);
  const watchIdRef = useRef(null);

  const selectedCategory = form.category ? getLogCategory(form.category) : null;
  const stepOneStatus = getStepOneStatus(form);
  const canSave = stepOneStatus.isComplete;
  const gpsPhase = autoTracking?.phase || null;
  const gpsIsActive = gpsPhase === "active";
  const gpsIsFailed = gpsPhase === "failed";
  const gpsIsCompleted = gpsPhase === "completed";
  const showGpsControls = ["running", "walking"].includes(form.category);
  const gpsDistanceKm = gpsIsActive
    ? autoTracking?.distanceKm
      ? Number(autoTracking.distanceKm).toFixed(2)
      : form.metrics.distanceKm
    : form.metrics.distanceKm;
  const gpsMinutes = form.minutes;
  const hasGpsValues =
    Boolean(gpsDistanceKm && Number(gpsDistanceKm) > 0) ||
    Boolean(gpsMinutes && Number(gpsMinutes) > 0);
  const showGpsMetrics = gpsIsActive || gpsIsCompleted || hasGpsValues;
  const latestLog = useMemo(
    () => logs.find((log) => !isDevSurfaceLog(log)) || null,
    [logs]
  );
  const historyCategoryLogs = useMemo(
    () =>
      logs.filter(
        (log) =>
          !isDevSurfaceLog(log) &&
          (historyCategory === "all" ||
            inferLogCategory(log) === historyCategory)
      ),
    [historyCategory, logs]
  );
  const historyLogs = useMemo(
    () => historyCategoryLogs.filter((log) => isInPeriod(log, historyPeriod)),
    [historyCategoryLogs, historyPeriod]
  );
  const historySummary = useMemo(
    () => ({
      count: historyCategoryLogs.length,
      rounds: historyCategoryLogs.reduce((sum, log) => sum + getLogRounds(log), 0),
      minutes: historyCategoryLogs.reduce(
        (sum, log) => sum + Number(log.minutes || log.duration || 0),
        0
      ),
    }),
    [historyCategoryLogs]
  );
  const historyTrend = useMemo(
    () => buildTrend(historyLogs, historyPeriod),
    [historyLogs, historyPeriod]
  );
  const historyTrendMax = Math.max(...historyTrend.map((item) => item.value), 1);

  function updateFormField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function updateFormMetrics(nextMetrics) {
    setForm((prev) => ({
      ...prev,
      metrics: {
        ...prev.metrics,
        ...nextMetrics,
      },
    }));
  }

  function updateEditField(field, value) {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function updateEditMetrics(nextMetrics) {
    setEditForm((prev) => ({
      ...prev,
      metrics: {
        ...prev.metrics,
        ...nextMetrics,
      },
    }));
  }

  function handleTypeChange(value) {
    setForm((prev) => ({
      ...prev,
      type: value,
      subtype: value,
      customType: value === CUSTOM_EXERCISE_VALUE ? prev.customType : "",
    }));
  }

  function handleCategoryChange(categoryId) {
    const category = getLogCategory(categoryId);
    clearAutoTracking();
    const isWeights = category.id === "weights";
    setForm((prev) => ({
      ...prev,
      category: category.id,
      type: isWeights ? CUSTOM_EXERCISE_VALUE : category.subtypes[0],
      subtype: category.subtypes[0],
      customType: "",
      rounds: "",
      minutes: "",
      metrics: {},
    }));
  }

  function clearAutoTrackingWatch() {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = null;
  }

  function clearAutoTracking() {
    clearAutoTrackingWatch();
    setAutoTracking(null);
  }

  function handleStartAutoTracking() {
    if (!["running", "walking"].includes(form.category)) return;

    if (!navigator.geolocation) {
      setAutoTracking({
        phase: "failed",
        category: form.category,
        startedAt: null,
        distanceKm: 0,
        lastPosition: null,
        status: "이 브라우저에서는 GPS를 쓸 수 없어요",
      });
      return;
    }

    clearAutoTrackingWatch();

    const startTime = new Date().getTime();
    setAutoTracking({
      phase: "active",
      category: form.category,
      startedAt: startTime,
      distanceKm: 0,
      lastPosition: null,
      status: "측정 준비 중",
    });

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const nextPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };

        setAutoTracking((current) => {
          if (!current || current.phase !== "active") return current;
          const addedDistance = getDistanceKm(current.lastPosition, nextPosition);
          const nextDistance = current.distanceKm + addedDistance;
          const elapsedMinutes = Math.max(
            1,
            Math.round((new Date().getTime() - current.startedAt) / 60000)
          );

          setForm((prev) => ({
            ...prev,
            minutes: String(elapsedMinutes),
            metrics: {
              ...prev.metrics,
              distanceKm: nextDistance
                ? nextDistance.toFixed(2)
                : prev.metrics.distanceKm || "",
              autoSignals: ["GPS", "시간"],
              autoAccuracyM: Math.round(nextPosition.accuracy || 0),
            },
          }));

          return {
            ...current,
            phase: "active",
            distanceKm: nextDistance,
            lastPosition: nextPosition,
            status: "측정 중",
          };
        });
      },
      () => {
        clearAutoTrackingWatch();
        setAutoTracking({
          phase: "failed",
          category: form.category,
          startedAt: null,
          distanceKm: 0,
          lastPosition: null,
          status: "GPS 권한이 필요해요",
        });
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );
  }

  function handleStopAutoTracking() {
    const current = autoTracking;
    clearAutoTrackingWatch();
    if (!current || current.phase !== "active" || !current.startedAt) {
      setAutoTracking(null);
      return;
    }

    const elapsedMinutes = Math.max(
      1,
      Math.round((new Date().getTime() - current.startedAt) / 60000)
    );
    const distanceKm = current.distanceKm
      ? current.distanceKm.toFixed(2)
      : "";
    setForm((prev) => ({
      ...prev,
      minutes: prev.minutes || String(elapsedMinutes),
      metrics: {
        ...prev.metrics,
        distanceKm: prev.metrics.distanceKm || distanceKm,
        autoSignals: ["GPS", "시간"],
        autoStoppedAt: new Date().toISOString(),
      },
    }));
    setAutoTracking({
      phase: "completed",
      category: current.category,
      startedAt: current.startedAt,
      distanceKm: current.distanceKm,
      lastPosition: current.lastPosition,
      status: "측정 완료",
    });
  }

  function handleDockPrimaryAction() {
    if (!canSave) return;
    handleSubmit();
  }

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      watchIdRef.current = null;
    };
  }, []);

  function handleEditTypeChange(value) {
    setEditForm((prev) => ({
      ...prev,
      type: value,
      subtype: value,
      customType: value === CUSTOM_EXERCISE_VALUE ? prev.customType : "",
    }));
  }

  function handleSubmit(event) {
    event?.preventDefault?.();

    const finalExerciseName = getFinalExerciseName(form);

    if (!finalExerciseName) {
      alert("운동을 먼저 선택해줘!");
      return;
    }

    if (form.category !== "weights" && (!form.minutes || Number(form.minutes) <= 0)) {
      alert("운동 시간을 입력해줘!");
      return;
    }

    if (
      form.category === "running" &&
      (!form.metrics.distanceKm || Number(form.metrics.distanceKm) <= 0)
    ) {
      alert("러닝 거리를 입력해줘!");
      return;
    }

    if (
      form.category === "weights" &&
      (!form.metrics.sets || !form.metrics.reps)
    ) {
      alert("웨이트 세트와 횟수를 입력해줘!");
      return;
    }

    if (form.category === "weights" && !finalExerciseName) {
      alert("운동명을 입력해줘!");
      return;
    }

    const savedLog = addLog({
      type: finalExerciseName,
      minutes: Number(form.minutes),
      duration: Number(form.minutes),
      rounds: Number(form.rounds || 0),
      totalRounds: Number(form.rounds || 0),
      completedRounds: Number(form.rounds || 0),
      date: form.date || getTodayString(),
      difficulty: form.difficulty,
      condition: form.condition,
      memo: form.memo,
      publicComment: form.publicComment,
      category: form.category,
      subtype: form.subtype || (form.category === "weights" ? "웨이트" : form.type),
      metrics:
        form.category === "weights"
          ? { ...form.metrics, exerciseName: finalExerciseName }
          : form.metrics,
      source: form.metrics?.autoSignals?.length ? "auto" : "manual",
    });

    track("log_save", {
      source: form.metrics?.autoSignals?.length ? "auto" : "manual",
      rounds: Number(form.rounds || 0),
    });

    clearAutoTracking();
    const delta = getCompletionDelta(logs, savedLog);
    setForm(createEmptyForm());
    setHistoryLimit(5);
    setReward({
      type: "growth",
      delta,
      logId: savedLog.id,
      minutes: Number(form.minutes),
      rounds: Number(form.rounds || 0),
      message: form.publicComment.trim() || null,
    });
  }

  function handleStartEdit(log) {
    setEditingId(log.id);

    const normalizedLog = normalizeLogCategory(log);
    const isWeights = normalizedLog.category === "weights";
    const weightTags = ["웨이트", "상체", "하체", "코어"];
    const storedName = String(
      log.metrics?.exerciseName || normalizedLog.type || ""
    ).trim();
    const weightName =
      storedName && !weightTags.includes(storedName) ? storedName : "";

    setEditForm({
      category: normalizedLog.category,
      type: isWeights
        ? CUSTOM_EXERCISE_VALUE
        : EXERCISE_OPTIONS.includes(normalizedLog.type)
          ? normalizedLog.type
          : CUSTOM_EXERCISE_VALUE,
      subtype: normalizedLog.subtype || normalizedLog.type || "복싱",
      customType: isWeights
        ? weightName
        : EXERCISE_OPTIONS.includes(normalizedLog.type)
          ? ""
          : normalizedLog.type || "",
      minutes: String(log.minutes || log.duration || ""),
      rounds: String(getRounds(log) || ""),
      date: log.date || getTodayString(),
      difficulty: log.difficulty || "normal",
      condition: log.condition || "normal",
      memo: log.memo || "",
      publicComment: log.publicComment || "",
      metrics: normalizedLog.metrics,
    });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditForm(createEmptyForm());
  }

  function handleSaveEdit(logId) {
    const finalExerciseName = getFinalExerciseName(editForm);

    if (!finalExerciseName) {
      alert("운동 종류를 입력해줘!");
      return;
    }

    if (
      editForm.category !== "weights" &&
      (!editForm.minutes || Number(editForm.minutes) <= 0)
    ) {
      alert("운동 시간을 입력해줘!");
      return;
    }

    if (
      editForm.category === "running" &&
      (!editForm.metrics.distanceKm || Number(editForm.metrics.distanceKm) <= 0)
    ) {
      alert("러닝 거리를 입력해줘!");
      return;
    }

    if (
      editForm.category === "weights" &&
      (!editForm.metrics.sets || !editForm.metrics.reps)
    ) {
      alert("웨이트 세트와 횟수를 입력해줘!");
      return;
    }

    if (editForm.category === "weights" && !finalExerciseName) {
      alert("운동명을 입력해줘!");
      return;
    }

    updateLog(logId, {
      type: finalExerciseName,
      minutes: Number(editForm.minutes),
      duration: Number(editForm.minutes),
      rounds: Number(editForm.rounds || 0),
      totalRounds: Number(editForm.rounds || 0),
      completedRounds: Number(editForm.rounds || 0),
      date: editForm.date || getTodayString(),
      difficulty: editForm.difficulty,
      condition: editForm.condition,
      memo: editForm.memo,
      publicComment: editForm.publicComment,
      category: editForm.category,
      subtype:
        editForm.subtype ||
        (editForm.category === "weights" ? "웨이트" : editForm.type),
      metrics:
        editForm.category === "weights"
          ? { ...editForm.metrics, exerciseName: finalExerciseName }
          : editForm.metrics,
    });

    setReward({
      type: "edit",
      title: "기록 수정 완료",
      message: "변경 내용이 저장됐습니다.",
    });

    handleCancelEdit();
  }

  function handleDeleteLog(logId) {
    const ok = window.confirm("이 운동 기록을 삭제할까요?");
    if (!ok) return;

    deleteLog(logId);
    setReward(null);
  }

  function handleResetAllLogs() {
    const ok = window.confirm(
      "모든 운동 기록을 삭제할까요?\n이 작업은 되돌릴 수 없습니다."
    );
    if (!ok) return;

    resetAllLogs();
    setReward(null);
    setEditingId(null);
  }

  function handleOpenCardFromReward(logId) {
    const goCardMaker = onGoProfileCardMaker || onGoProfile;

    if (typeof goCardMaker === "function") {
      goCardMaker(logId);
      return;
    }

    alert("프로필 탭의 카드 만들기로 이동해 주세요.");
  }

  function handleMakeCard(logId) {
    handleOpenCardFromReward(logId);
  }

  return (
    <main
      className={`log-page${selectedCategory ? " has-write-dock" : ""}`}
    >
      <div className="log-container">
        <header className="log-hero">
          <h1 className="log-title">기록</h1>
          <p className="log-subtitle">끝난 운동을 직접 남깁니다</p>
        </header>

        {reward?.type === "growth" && reward.delta ? (
          <section className="log-save-notice" aria-live="polite">
            <div>
              <strong>
                {reward.delta.didLevelUp
                  ? "레벨이 올랐습니다"
                  : "기록이 남았습니다"}
              </strong>
              <p>
                {[
                  reward.rounds ? `${reward.rounds}R` : "",
                  reward.minutes ? `${reward.minutes}분` : "",
                  reward.delta.gainedExp
                    ? `성장 +${reward.delta.gainedExp}`
                    : "",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <button type="button" onClick={() => setReward(null)}>
              닫기
            </button>
          </section>
        ) : null}

        {reward?.type === "edit" ? (
          <section className="log-save-notice" aria-live="polite">
            <div>
              <strong>{reward.title}</strong>
              <p>{reward.message}</p>
            </div>
            <button type="button" onClick={() => setReward(null)}>
              닫기
            </button>
          </section>
        ) : null}

        <section className="log-card log-form-card">
          <form onSubmit={handleSubmit}>
            <div className="log-form-block">
              <div className="log-step-heading">
                <p className="log-step-kicker">오늘</p>
                <h2>운동 기록</h2>
                <span>{getCorePrompt(form.category)}</span>
              </div>

              <div className="log-category-pills" role="group" aria-label="운동 종류">
                {LOG_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    className={form.category === category.id ? "is-active" : ""}
                    aria-pressed={form.category === category.id}
                    onClick={() => handleCategoryChange(category.id)}
                  >
                    {category.label}
                  </button>
                ))}
              </div>

              {selectedCategory ? (
                <section
                  className="log-core-panel"
                  aria-label={`${selectedCategory.label} 기록 입력`}
                >
                  {showGpsControls ? (
                    <section
                      className={`log-auto-panel${gpsIsFailed ? " is-failed" : ""}${gpsIsActive ? " is-active" : ""}${gpsIsCompleted ? " is-done" : ""}`}
                      aria-label="GPS 자동 측정"
                    >
                      <div>
                        <strong>
                          {gpsIsFailed
                            ? autoTracking.status
                            : gpsIsActive
                              ? "측정 중"
                              : gpsIsCompleted
                                ? "측정 완료"
                                : "GPS로 채우기"}
                        </strong>
                        <p>
                          {gpsIsFailed
                            ? "권한을 허용한 뒤 다시 시도하거나, 아래에서 직접 입력하세요."
                            : gpsIsActive
                              ? "측정이 끝나면 종료하세요. 저장은 아래에서 합니다."
                              : gpsIsCompleted
                                ? "값을 확인한 뒤 아래에서 저장하세요."
                                : "시작하면 거리와 시간이 들어갑니다."}
                        </p>
                      </div>
                      <button
                        type="button"
                        className={`log-gps-panel-action${gpsIsCompleted ? " is-secondary" : ""}`}
                        onClick={() => {
                          if (gpsIsActive) {
                            handleStopAutoTracking();
                            return;
                          }
                          if (gpsIsCompleted) {
                            clearAutoTracking();
                          }
                          handleStartAutoTracking();
                        }}
                      >
                        {gpsIsActive
                          ? "측정 종료"
                          : gpsIsCompleted
                            ? "다시 측정"
                            : gpsIsFailed
                              ? "다시 시도"
                              : "GPS 시작"}
                      </button>
                    </section>
                  ) : null}

                  {form.category === "boxing" ? (
                    <>
                      <RoundStepper
                        value={form.rounds}
                        onChange={(rounds) => {
                          updateFormField("rounds", String(rounds));
                          updateFormField(
                            "minutes",
                            String(rounds * BOXING_MINUTES_PER_ROUND)
                          );
                        }}
                      />
                      {form.rounds ? (
                        <p className="log-derived-minutes">
                          약{" "}
                          {form.minutes ||
                            Number(form.rounds) * BOXING_MINUTES_PER_ROUND}
                          분 · 라운드당 {BOXING_MINUTES_PER_ROUND}분
                        </p>
                      ) : (
                        <p className="log-derived-minutes is-hint">
                          라운드를 선택하세요
                        </p>
                      )}
                      <label className="log-toggle-row">
                        <input
                          type="checkbox"
                          checked={Boolean(form.metrics.sparring)}
                          onChange={(event) =>
                            updateFormMetrics({ sparring: event.target.checked })
                          }
                        />
                        <span>스파링 포함</span>
                      </label>
                    </>
                  ) : null}

                  {form.category === "running" || form.category === "walking" ? (
                    <>
                      {showGpsMetrics ? (
                        <div
                          className={`log-gps-summary${form.category === "walking" ? " is-walk" : ""}`}
                          aria-label={gpsIsActive ? "측정 중" : "측정 요약"}
                        >
                          {gpsDistanceKm && Number(gpsDistanceKm) > 0 ? (
                            <div>
                              <span>거리</span>
                              <strong>{gpsDistanceKm}km</strong>
                            </div>
                          ) : null}
                          {gpsMinutes && Number(gpsMinutes) > 0 ? (
                            <div>
                              <span>시간</span>
                              <strong>{gpsMinutes}분</strong>
                            </div>
                          ) : null}
                          {form.category === "running" &&
                          getRunningPaceLabel(gpsDistanceKm, gpsMinutes) ? (
                            <div>
                              <span>페이스</span>
                              <strong>
                                {getRunningPaceLabel(gpsDistanceKm, gpsMinutes)}
                              </strong>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                      <details className="log-manual-details">
                        <summary>직접 입력</summary>
                        <div className="log-grid-2">
                          <div className="log-field">
                            <label className="log-label">거리(km)</label>
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={form.metrics.distanceKm || ""}
                              onChange={(event) =>
                                updateFormMetrics({
                                  distanceKm: event.target.value,
                                })
                              }
                              placeholder={
                                form.category === "running" ? "5" : "2"
                              }
                              className="log-input"
                            />
                          </div>
                          <div className="log-field">
                            <label className="log-label">시간(분)</label>
                            <input
                              type="number"
                              min="1"
                              value={form.minutes}
                              onChange={(event) =>
                                updateFormField("minutes", event.target.value)
                              }
                              placeholder={
                                form.category === "running" ? "30" : "40"
                              }
                              className="log-input"
                            />
                          </div>
                        </div>
                      </details>
                    </>
                  ) : null}

                  {form.category === "weights" ? (
                    <div className="log-weights-fields">
                      <div className="log-field">
                        <label className="log-label" htmlFor="log-weight-name">
                          운동명
                        </label>
                        <input
                          id="log-weight-name"
                          value={form.customType}
                          onChange={(event) =>
                            updateFormField("customType", event.target.value)
                          }
                          placeholder="예: 벤치프레스, 스쿼트, 데드리프트"
                          className="log-input"
                          autoComplete="off"
                        />
                      </div>
                      <div className="log-grid-2">
                        <div className="log-field">
                          <label className="log-label">세트</label>
                          <input
                            type="number"
                            min="1"
                            value={form.metrics.sets || ""}
                            onChange={(event) =>
                              updateFormMetrics({ sets: event.target.value })
                            }
                            placeholder="3"
                            className="log-input"
                          />
                        </div>
                        <div className="log-field">
                          <label className="log-label">횟수</label>
                          <input
                            type="number"
                            min="1"
                            value={form.metrics.reps || ""}
                            onChange={(event) =>
                              updateFormMetrics({ reps: event.target.value })
                            }
                            placeholder="10"
                            className="log-input"
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <details className="log-subtype-details">
                    <summary>세부 · 직접 입력 · 메모</summary>
                    {form.category === "boxing" ? (
                      <div className="log-field">
                        <label className="log-label">시간(분) · 직접 수정</label>
                        <input
                          type="number"
                          min="1"
                          value={form.minutes}
                          onChange={(event) =>
                            updateFormField("minutes", event.target.value)
                          }
                          placeholder="30"
                          className="log-input"
                        />
                      </div>
                    ) : null}
                    {form.category === "weights" ? (
                      <div className="log-field">
                        <label className="log-label">무게(kg) · 선택</label>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={form.metrics.weightKg || ""}
                          onChange={(event) =>
                            updateFormMetrics({
                              weightKg: event.target.value,
                            })
                          }
                          placeholder="40"
                          className="log-input"
                        />
                      </div>
                    ) : null}
                    {form.category === "weights" ? (
                      <div className="log-subtype-grid" role="group" aria-label="부위 분류">
                        {selectedCategory.subtypes.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            className={form.subtype === tag ? "is-active" : ""}
                            onClick={() => updateFormField("subtype", tag)}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <>
                        <div className="log-subtype-grid">
                          {selectedCategory.subtypes.map((exercise) => (
                            <button
                              key={exercise}
                              type="button"
                              className={form.type === exercise ? "is-active" : ""}
                              onClick={() => handleTypeChange(exercise)}
                            >
                              {exercise}
                            </button>
                          ))}
                          <button
                            type="button"
                            className={
                              form.type === CUSTOM_EXERCISE_VALUE ? "is-active" : ""
                            }
                            onClick={() => handleTypeChange(CUSTOM_EXERCISE_VALUE)}
                          >
                            직접 입력
                          </button>
                        </div>
                        {form.type === CUSTOM_EXERCISE_VALUE ? (
                          <div className="log-field log-subtype-custom">
                            <label className="log-label">운동 이름</label>
                            <input
                              value={form.customType}
                              onChange={(event) =>
                                updateFormField("customType", event.target.value)
                              }
                              placeholder="예: 샌드백 집중 훈련"
                              className="log-input"
                            />
                          </div>
                        ) : null}
                      </>
                    )}
                    <div className="log-field">
                      <label className="log-label" htmlFor="log-form-date">
                        날짜
                      </label>
                      <LogDateField
                        id="log-form-date"
                        value={form.date}
                        onChange={(next) => updateFormField("date", next)}
                      />
                    </div>
                    <div className="log-field">
                      <label className="log-label">메모</label>
                      <input
                        value={form.memo}
                        onChange={(event) =>
                          updateFormField("memo", event.target.value)
                        }
                        placeholder="짧게 남겨도 됩니다"
                        className="log-input"
                      />
                    </div>
                  </details>
                </section>
              ) : null}
            </div>
          </form>
        </section>

        {selectedCategory ? (
          <div className={`log-write-dock${canSave ? " is-save" : " is-final"}`}>
            {!canSave ? (
              <p className="log-write-dock-hint">{stepOneStatus.label}</p>
            ) : null}
            <button
              type="button"
              className="log-submit"
              onClick={handleDockPrimaryAction}
              disabled={!canSave}
            >
              기록 저장
            </button>
          </div>
        ) : null}

        <section className="log-list-section" aria-label="기록 목록">
          <div className="log-recent-peek">
            <div className="log-recent-head">
              <h2>최근 전체 기록</h2>
            </div>
            {!latestLog ? (
              <p className="log-empty log-peek-empty">
                위에서 오늘 운동을 남기면 여기에 보입니다.
              </p>
            ) : (
              <div className="log-peek-item">
                <div>
                  <p className="log-history-date">
                    {formatDotDate(latestLog.date)}
                  </p>
                  <p className="log-item-type">
                    {inferLogCategory(latestLog) === "weights"
                      ? getWeightsExerciseTitle(latestLog)
                      : latestLog.type}
                  </p>
                  {latestLog.workoutDetails ? (
                    <p className="log-history-details">
                      {latestLog.workoutDetails}
                    </p>
                  ) : null}
                </div>
                <p className="log-history-metrics">{getLogSummary(latestLog)}</p>
              </div>
            )}
          </div>

          <details className="log-history-fold">
            <summary>
              전체 기록 보기
              <strong>{historySummary.count}회</strong>
            </summary>

          <div
            className="log-history-category-row"
            role="group"
            aria-label="운동 카테고리"
          >
            <button
              type="button"
              className={historyCategory === "all" ? "is-active" : ""}
              onClick={() => {
                setHistoryCategory("all");
                setHistoryLimit(5);
              }}
            >
              전체
            </button>
            {LOG_CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                className={historyCategory === category.id ? "is-active" : ""}
                onClick={() => {
                  setHistoryCategory(category.id);
                  setHistoryLimit(5);
                }}
              >
                {category.label}
              </button>
            ))}
          </div>

          <details className="log-stats-fold">
            <summary>
              요약 · 그래프
              <strong>
                {historySummary.rounds}R · {historySummary.minutes}분
              </strong>
            </summary>
            <section className="log-record-summary" aria-label="기록 요약">
              <div>
                <span>총 라운드</span>
                <strong>
                  {historySummary.rounds.toLocaleString()}
                  <small>R</small>
                </strong>
              </div>
              <div>
                <span>총 시간</span>
                <strong>
                  {historySummary.minutes.toLocaleString()}
                  <small>분</small>
                </strong>
              </div>
              <div className="log-record-summary-wide">
                <span>총 횟수</span>
                <strong>
                  {historySummary.count.toLocaleString()}
                  <small>회</small>
                </strong>
              </div>
            </section>

            <section className="log-history-trend" aria-label="훈련 추이">
              <div className="log-history-trend-head">
                <h2>{historyPeriod === "week" ? "이번 주" : "훈련 흐름"}</h2>
                <div
                  className="log-history-period-row"
                  role="group"
                  aria-label="기간 선택"
                >
                  {[
                    ["week", "주"],
                    ["month", "월"],
                    ["year", "년"],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      className={historyPeriod === id ? "is-active" : ""}
                      onClick={() => {
                        setHistoryPeriod(id);
                        setHistoryLimit(5);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div
                className="log-history-chart"
                aria-label="훈련량 막대 그래프"
                style={{
                  gridTemplateColumns: `repeat(${historyTrend.length}, minmax(0, 1fr))`,
                }}
              >
                {historyTrend.map((item) => (
                  <div key={item.label}>
                    <span className="log-history-chart-value">
                      {item.value > 0 ? item.value : ""}
                    </span>
                    <i
                      style={{
                        height: `${Math.max(
                          item.value ? 12 : 3,
                          (item.value / historyTrendMax) * 100
                        )}%`,
                      }}
                    />
                    <small>{item.label}</small>
                  </div>
                ))}
              </div>
            </section>
          </details>

          {historyLogs.length === 0 ? (
            <div className="log-empty-state">
              <p className="log-empty">
                {logs.length === 0
                  ? "위에서 오늘 운동을 남기면 여기에 쌓입니다."
                  : "이 조건에 맞는 기록이 없습니다."}
              </p>
            </div>
          ) : (
            <div className="log-list">
              {historyLogs.slice(0, historyLimit).map((log) => {
                const isEditing = editingId === log.id;

                return (
                  <div key={log.id} className="log-item">
                    {!isEditing ? (
                      <>
                        <div className="log-history-row">
                          <div>
                            <p className="log-history-date">
                              {formatDotDate(log.date)}
                            </p>
                            <p className="log-item-type">
                              {inferLogCategory(log) === "weights"
                                ? getWeightsExerciseTitle(log)
                                : log.type}
                            </p>
                          </div>
                          <div className="log-history-row-right">
                            <p className="log-history-metrics">
                              {getLogSummary(log)}
                            </p>
                            <details className="log-item-menu">
                              <summary aria-label={`${log.type} 기록 메뉴`}>
                                ⋯
                              </summary>
                              <div>
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(log)}
                                >
                                  수정
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMakeCard(log.id)}
                                >
                                  카드
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLog(log.id)}
                                >
                                  삭제
                                </button>
                              </div>
                            </details>
                          </div>
                        </div>
                        {log.workoutDetails ? (
                          <p className="log-history-details">
                            {log.workoutDetails}
                          </p>
                        ) : null}
                        {log.publicComment || log.memo || log.note ? (
                          <p className="log-history-note">
                            {log.publicComment || log.memo || log.note}
                          </p>
                        ) : null}
                      </>
                    ) : (
                      <div>
                        <p className="log-edit-head">기록 수정</p>
                        {editForm.category === "weights" ? (
                          <div className="log-field">
                            <label className="log-label">운동명</label>
                            <input
                              value={editForm.customType}
                              onChange={(event) =>
                                updateEditField("customType", event.target.value)
                              }
                              placeholder="예: 벤치프레스"
                              className="log-input"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="log-field">
                              <label className="log-label">운동 종류</label>
                              <select
                                value={editForm.type}
                                onChange={(event) =>
                                  handleEditTypeChange(event.target.value)
                                }
                                className="log-input"
                              >
                                {EXERCISE_OPTIONS.map((exercise) => (
                                  <option key={exercise} value={exercise}>
                                    {exercise}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {editForm.type === CUSTOM_EXERCISE_VALUE ? (
                              <div className="log-field">
                                <label className="log-label">운동 이름</label>
                                <input
                                  value={editForm.customType}
                                  onChange={(event) =>
                                    updateEditField(
                                      "customType",
                                      event.target.value
                                    )
                                  }
                                  className="log-input"
                                />
                              </div>
                            ) : null}
                          </>
                        )}
                        {editForm.category === "weights" ? (
                          <div className="log-grid-3">
                            <div className="log-field">
                              <label className="log-label">세트</label>
                              <input
                                type="number"
                                min="1"
                                value={editForm.metrics.sets || ""}
                                onChange={(event) =>
                                  updateEditMetrics({
                                    sets: event.target.value,
                                  })
                                }
                                className="log-input"
                              />
                            </div>
                            <div className="log-field">
                              <label className="log-label">무게</label>
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={editForm.metrics.weightKg || ""}
                                onChange={(event) =>
                                  updateEditMetrics({
                                    weightKg: event.target.value,
                                  })
                                }
                                className="log-input"
                              />
                            </div>
                            <div className="log-field">
                              <label className="log-label">횟수</label>
                              <input
                                type="number"
                                min="1"
                                value={editForm.metrics.reps || ""}
                                onChange={(event) =>
                                  updateEditMetrics({
                                    reps: event.target.value,
                                  })
                                }
                                className="log-input"
                              />
                            </div>
                          </div>
                        ) : editForm.category === "running" ||
                          editForm.category === "walking" ? (
                          <div className="log-grid-2">
                            <div className="log-field">
                              <label className="log-label">거리(km)</label>
                              <input
                                type="number"
                                min="0"
                                step="0.1"
                                value={editForm.metrics.distanceKm || ""}
                                onChange={(event) =>
                                  updateEditMetrics({
                                    distanceKm: event.target.value,
                                  })
                                }
                                className="log-input"
                              />
                            </div>
                            <div className="log-field">
                              <label className="log-label">시간(분)</label>
                              <input
                                type="number"
                                min="1"
                                value={editForm.minutes}
                                onChange={(event) =>
                                  updateEditField("minutes", event.target.value)
                                }
                                className="log-input"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="log-grid-2">
                            <div className="log-field">
                              <label className="log-label">라운드</label>
                              <input
                                type="number"
                                min="0"
                                value={editForm.rounds}
                                onChange={(event) => {
                                  const rounds = event.target.value;
                                  updateEditField("rounds", rounds);
                                  if (Number(rounds) > 0) {
                                    updateEditField(
                                      "minutes",
                                      String(Number(rounds) * 3)
                                    );
                                  }
                                }}
                                className="log-input"
                              />
                            </div>
                            <div className="log-field">
                              <label className="log-label">시간(분)</label>
                              <input
                                type="number"
                                min="1"
                                value={editForm.minutes}
                                onChange={(event) =>
                                  updateEditField("minutes", event.target.value)
                                }
                                className="log-input"
                              />
                            </div>
                          </div>
                        )}
                        <div className="log-field">
                          <label className="log-label" htmlFor={`edit-date-${log.id}`}>
                            날짜
                          </label>
                          <LogDateField
                            id={`edit-date-${log.id}`}
                            value={editForm.date}
                            onChange={(next) => updateEditField("date", next)}
                          />
                        </div>
                        <div className="log-edit-actions">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(log.id)}
                            className="log-submit"
                          >
                            수정 저장
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="log-btn-cancel"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {historyLogs.length > historyLimit ? (
            <button
              type="button"
              className="log-load-more"
              onClick={() => setHistoryLimit((prev) => prev + 5)}
            >
              더 보기 ({historyLimit}/{historyLogs.length})
            </button>
          ) : null}

          {logs.some((log) => !isDevSurfaceLog(log)) ? (
            <details className="log-danger-fold">
              <summary>
                <span>기록 관리</span>
                <strong>전체 삭제</strong>
              </summary>
              <p className="log-danger-copy">
                저장된 운동 기록을 모두 지웁니다. 백업이 없다면 복구할 수 없습니다.
              </p>
              <button
                type="button"
                onClick={handleResetAllLogs}
                className="log-reset-btn log-reset-inline"
              >
                전체 초기화
              </button>
            </details>
          ) : null}
          </details>
        </section>
      </div>
    </main>
  );
}
