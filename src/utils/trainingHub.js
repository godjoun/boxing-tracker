import { isDevSurfaceLog } from "./devMode";
import {
  DEFAULT_BOXING_WORK_SECONDS,
  MATCH_TIMER_PRESETS,
} from "./timerPresets";
import { normalizeWorkoutDetails } from "./workoutDetails";

export const TRAINING_CATEGORY = {
  BOXING: "boxing",
  RUNNING: "running",
};

export const DEFAULT_BOXING_KIND_ID = "round";
export const DEFAULT_ROUND_PRESET_ID = MATCH_TIMER_PRESETS[0]?.id || "match3";

export const BOXING_KINDS = [
  { id: "round", title: "라운드", logType: null },
  { id: "shadow", title: "쉐도우", logType: "쉐도우" },
  { id: "bag", title: "샌드백", logType: "샌드백" },
  { id: "mitt", title: "미트", logType: "미트 훈련" },
  { id: "sparring", title: "스파링", logType: "스파링" },
];

export const PRIMARY_TRAINING_CHOICES = [
  {
    id: "standard",
    icon: "round",
    label: "기본",
    title: "3R 시작",
    meta: "기본 라운드",
    action: "start-standard",
  },
  {
    id: "minimum",
    icon: "ring",
    label: "가볍게",
    title: "바로 1R",
    meta: "10초 준비 후 시작",
    action: "start-minimum",
  },
  {
    id: "technique",
    icon: "skill",
    label: "복습",
    title: "기술 연습",
    meta: "자세와 가드 확인",
    action: "open-techniques",
  },
  {
    id: "program",
    icon: "log",
    label: "코스",
    title: "4주 코스",
    meta: "순서대로 이어가기",
    action: "open-program",
  },
];

export function getTodayString(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}

export function getLogRounds(log) {
  return Number(log?.rounds || log?.totalRounds || log?.completedRounds || 0);
}

export function formatRestLabel(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  if (safeSeconds >= 60) {
    const minutes = Math.floor(safeSeconds / 60);
    const remain = safeSeconds % 60;
    return remain ? `${minutes}분 ${remain}초` : `${minutes}분`;
  }
  return `${safeSeconds}초`;
}

export function buildTodayTrainingSummary(logs = [], now = new Date()) {
  const todayKey = getTodayString(now);
  const todayLogs = logs.filter(
    (log) => log?.date === todayKey && !isDevSurfaceLog(log)
  );

  return {
    rounds: todayLogs.reduce((sum, log) => sum + getLogRounds(log), 0),
    minutes: todayLogs.reduce(
      (sum, log) => sum + Number(log.minutes || log.duration || 0),
      0
    ),
  };
}

export function resolveRoundPreset(roundPresetId) {
  return (
    MATCH_TIMER_PRESETS.find((preset) => preset.id === roundPresetId) ||
    MATCH_TIMER_PRESETS[0] ||
    null
  );
}

export function resolveBoxingKind(boxingKindId) {
  return (
    BOXING_KINDS.find((kind) => kind.id === boxingKindId) || BOXING_KINDS[0]
  );
}

export function buildRoundSummary(preset) {
  if (!preset) return "";
  const rounds = Number(preset.rounds || 3);
  const workSeconds = Number(preset.workSeconds || DEFAULT_BOXING_WORK_SECONDS);
  const restSeconds = Number(preset.restSeconds || 30);
  const workMinutes = Math.round(workSeconds / 60);
  return `${rounds}R · 운동 ${workMinutes}분 · 휴식 ${formatRestLabel(
    restSeconds
  )}`;
}

export function buildBoxingPreset({
  boxingKind,
  preset,
  workoutDetails = "",
}) {
  if (!preset) return null;

  const logType = boxingKind?.logType;
  const rounds = Number(preset.rounds || 3);

  return {
    ...preset,
    title: logType || preset.title,
    logType: logType || undefined,
    routineTitle: logType ? `${logType} · ${rounds}R` : `${rounds}R 라운드 훈련`,
    workoutDetails: normalizeWorkoutDetails(workoutDetails),
  };
}

export function buildTrainingStage({
  categoryId,
  boxingKind,
  runningGoalMinutes,
  roundPreset,
  todaySummary,
}) {
  const rounds = Number(roundPreset?.rounds || 3);
  const workSeconds = Number(roundPreset?.workSeconds || DEFAULT_BOXING_WORK_SECONDS);
  const restSeconds = Number(roundPreset?.restSeconds || 30);
  const workMinutes = Math.round(workSeconds / 60);
  const todayValue =
    todaySummary.rounds > 0 || todaySummary.minutes > 0
      ? `${todaySummary.rounds}R · ${todaySummary.minutes}분`
      : "0분";

  if (categoryId === TRAINING_CATEGORY.RUNNING) {
    return {
      kicker: "ROAD WORK",
      title: `${runningGoalMinutes}분 러닝`,
      summary: `로드워크를 시간 목표 ${runningGoalMinutes}분으로 남깁니다.`,
      ctaLabel: "러닝 시작",
      ctaDetail: `시간 목표 · ${runningGoalMinutes}분`,
      stats: [
        { label: "목표", value: `${runningGoalMinutes}분` },
        { label: "러닝", value: `${runningGoalMinutes}분` },
        { label: "오늘", value: todayValue },
      ],
    };
  }

  const kindTitle = boxingKind?.title || "라운드";

  return {
    kicker: "NEXT ROUND",
    title: kindTitle === "라운드" ? `오늘 ${rounds}R` : `${kindTitle} ${rounds}R`,
    summary:
      kindTitle === "라운드"
        ? "체육관을 못 가는 날에도 기본 라운드는 기록으로 남깁니다."
        : `${kindTitle} 중심으로 오늘 할 라운드를 남깁니다.`,
    ctaLabel: kindTitle === "라운드" ? `${rounds}R 시작` : "훈련 시작",
    ctaDetail: `${kindTitle} · ${buildRoundSummary(roundPreset)}`,
    stats: [
      { label: "분량", value: `${rounds}R` },
      { label: "운동", value: `${workMinutes}분` },
      { label: "오늘", value: todayValue },
    ],
    restLabel: formatRestLabel(restSeconds),
  };
}
