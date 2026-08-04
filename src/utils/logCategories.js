export const LOG_CATEGORIES = [
  {
    id: "boxing",
    label: "복싱",
    description: "라운드와 시간을 남겨요",
    subtypes: ["복싱", "쉐도우복싱", "샌드백", "미트 훈련", "줄넘기", "풋워크", "스파링"],
  },
  {
    id: "running",
    label: "러닝",
    description: "거리와 시간으로 페이스를 계산해요",
    subtypes: ["러닝", "조깅", "인터벌 러닝"],
  },
  {
    id: "weights",
    label: "웨이트",
    description: "세트·무게·횟수만 남겨요",
    subtypes: ["웨이트", "상체", "하체", "코어"],
  },
  {
    id: "walking",
    label: "걷기",
    description: "가볍게 걸은 시간을 남겨요",
    subtypes: ["걷기", "회복 걷기"],
  },
];

export const CATEGORY_IDS = LOG_CATEGORIES.map((category) => category.id);

const CATEGORY_PATTERNS = {
  running: /러닝|조깅|run/i,
  walking: /걷기|walking|회복 페이스/i,
  weights: /웨이트|근력|신체 ·|몸강화|덤벨|스쿼트|벤치|데드리프트/i,
  boxing: /스파링|sparring|복싱|샌드백|쉐도우|미트|줄넘기|풋워크|기술 ·|커스텀 훈련|라운드 훈련|인터벌/i,
};

export function getLogCategory(categoryId) {
  return LOG_CATEGORIES.find((category) => category.id === categoryId) || LOG_CATEGORIES[0];
}

export function inferLogCategory(log = {}) {
  if (CATEGORY_IDS.includes(log.category)) return log.category;

  const type = String(log.type || "");
  if (CATEGORY_PATTERNS.running.test(type)) return "running";
  if (CATEGORY_PATTERNS.walking.test(type)) return "walking";
  if (CATEGORY_PATTERNS.weights.test(type)) return "weights";
  return "boxing";
}

export function normalizeLogCategory(log = {}) {
  const category = inferLogCategory(log);
  return {
    ...log,
    category,
    subtype: log.subtype || log.type || getLogCategory(category).subtypes[0],
    metrics: log.metrics && typeof log.metrics === "object" ? log.metrics : {},
  };
}

export function getLogSummary(log = {}) {
  const category = inferLogCategory(log);
  const metrics = log.metrics || {};
  const minutes = Number(log.minutes || log.duration || 0);

  if (category === "running") {
    const distanceKm = Number(metrics.distanceKm || 0);
    return [distanceKm ? `${distanceKm}km` : "", minutes ? `${minutes}분` : ""]
      .filter(Boolean)
      .join(" · ");
  }

  if (category === "weights") {
    const sets = Number(metrics.sets || 0);
    const weightKg = Number(metrics.weightKg || 0);
    const reps = Number(metrics.reps || 0);
    return [
      metrics.exerciseName || log.type,
      sets ? `${sets}세트` : "",
      weightKg ? `${weightKg}kg` : "",
      reps ? `${reps}회` : "",
    ]
      .filter(Boolean)
      .join(" · ");
  }

  if (category === "walking") {
    const distanceKm = Number(metrics.distanceKm || 0);
    return [minutes ? `${minutes}분` : "", distanceKm ? `${distanceKm}km` : ""]
      .filter(Boolean)
      .join(" · ");
  }

  const rounds = Number(log.rounds || log.totalRounds || log.completedRounds || 0);
  return [rounds ? `${rounds}R` : "", minutes ? `${minutes}분` : ""]
    .filter(Boolean)
    .join(" · ");
}

export function getRunningPaceLabel(distanceKm, minutes) {
  const distance = Number(distanceKm || 0);
  const totalMinutes = Number(minutes || 0);
  if (!distance || !totalMinutes) return "";

  const seconds = Math.round((totalMinutes * 60) / distance);
  return `${Math.floor(seconds / 60)}'${String(seconds % 60).padStart(2, "0")}" /km`;
}
