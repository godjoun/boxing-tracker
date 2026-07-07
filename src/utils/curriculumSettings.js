const SETTINGS_KEY = "fitness-league-curriculum-settings";
const CUSTOM_WORKOUTS_KEY = "fitness-league-curriculum-custom-workouts";

export const INTENSITY_OPTIONS = [
  {
    id: "light",
    label: "가볍게",
    description: "라운드 -1 · 휴식 +15초",
    workMultiplier: 0.9,
    restBonus: 15,
    roundsDelta: -1,
  },
  {
    id: "normal",
    label: "보통",
    description: "기본 프로그램 그대로",
    workMultiplier: 1,
    restBonus: 0,
    roundsDelta: 0,
  },
  {
    id: "hard",
    label: "강하게",
    description: "라운드 +1 · 휴식 -5초",
    workMultiplier: 1.1,
    restBonus: -5,
    roundsDelta: 1,
  },
];

const DEFAULT_SETTINGS = {
  intensityId: "normal",
  sessionOverrides: {},
};

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function clampRounds(value) {
  return Math.max(2, Math.min(12, Number(value) || 2));
}

export function clampWorkSeconds(value) {
  return Math.max(60, Math.min(600, Number(value) || 120));
}

export function clampRestSeconds(value) {
  return Math.max(15, Math.min(180, Number(value) || 30));
}

export function getCurriculumSettings() {
  const saved = readJson(SETTINGS_KEY, DEFAULT_SETTINGS);
  const intensityId = INTENSITY_OPTIONS.some(
    (option) => option.id === saved.intensityId
  )
    ? saved.intensityId
    : "normal";

  return {
    intensityId,
    sessionOverrides:
      saved.sessionOverrides && typeof saved.sessionOverrides === "object"
        ? saved.sessionOverrides
        : {},
  };
}

export function saveCurriculumSettings(nextSettings) {
  const current = getCurriculumSettings();
  const merged = {
    ...current,
    ...nextSettings,
    sessionOverrides: {
      ...current.sessionOverrides,
      ...(nextSettings.sessionOverrides || {}),
    },
  };

  writeJson(SETTINGS_KEY, merged);
  return merged;
}

export function saveSessionOverride(sessionId, override) {
  if (!sessionId) return getCurriculumSettings();

  return saveCurriculumSettings({
    sessionOverrides: {
      [sessionId]: {
        rounds: clampRounds(override.rounds),
        workSeconds: clampWorkSeconds(override.workSeconds),
        restSeconds: clampRestSeconds(override.restSeconds),
      },
    },
  });
}

export function clearSessionOverride(sessionId) {
  const settings = getCurriculumSettings();
  const { [sessionId]: _removed, ...rest } = settings.sessionOverrides;

  return saveCurriculumSettings({ sessionOverrides: rest });
}

function getIntensityOption(intensityId) {
  return (
    INTENSITY_OPTIONS.find((option) => option.id === intensityId) ||
    INTENSITY_OPTIONS[1]
  );
}

export function applyTrainingSettings(session, settings = getCurriculumSettings()) {
  if (!session) return null;

  const intensity = getIntensityOption(settings.intensityId);
  const override = settings.sessionOverrides?.[session.id];

  const baseRounds = session.rounds + intensity.roundsDelta;
  const baseWorkSeconds = Math.round(
    session.workSeconds * intensity.workMultiplier
  );
  const baseRestSeconds = session.restSeconds + intensity.restBonus;

  return {
    ...session,
    rounds: clampRounds(override?.rounds ?? baseRounds),
    workSeconds: clampWorkSeconds(override?.workSeconds ?? baseWorkSeconds),
    restSeconds: clampRestSeconds(override?.restSeconds ?? baseRestSeconds),
  };
}

export function getCustomWorkouts() {
  const workouts = readJson(CUSTOM_WORKOUTS_KEY, []);
  return Array.isArray(workouts) ? workouts : [];
}

export function saveCustomWorkout(workout) {
  const workouts = getCustomWorkouts();
  const nextWorkout = {
    id: workout.id || `custom-${Date.now()}`,
    title: workout.title?.trim() || "내 커스텀 훈련",
    goal: workout.goal?.trim() || "직접 만든 홈복싱 루틴",
    rounds: clampRounds(workout.rounds),
    workSeconds: clampWorkSeconds(workout.workSeconds),
    restSeconds: clampRestSeconds(workout.restSeconds),
    drills: Array.isArray(workout.drills)
      ? workout.drills
          .filter((drill) => drill?.name?.trim())
          .map((drill) => ({
            name: drill.name.trim(),
            duration: drill.duration?.trim() || "라운드당",
            description: drill.description?.trim() || "",
          }))
      : [],
    isCustom: true,
    savedAt: new Date().toISOString(),
  };

  const existingIndex = workouts.findIndex((item) => item.id === nextWorkout.id);
  const nextWorkouts =
    existingIndex >= 0
      ? workouts.map((item, index) =>
          index === existingIndex ? nextWorkout : item
        )
      : [nextWorkout, ...workouts].slice(0, 8);

  writeJson(CUSTOM_WORKOUTS_KEY, nextWorkouts);
  return nextWorkout;
}

export function deleteCustomWorkout(workoutId) {
  const nextWorkouts = getCustomWorkouts().filter(
    (workout) => workout.id !== workoutId
  );
  writeJson(CUSTOM_WORKOUTS_KEY, nextWorkouts);
  return nextWorkouts;
}

export function createCustomSessionFromForm(form) {
  const drills = (form.drills || [])
    .filter((drill) => drill.name?.trim())
    .map((drill, index) => ({
      name: drill.name.trim(),
      duration: drill.duration?.trim() || "라운드당",
      description:
        drill.description?.trim() ||
        `${index + 1}번째 드릴 — 설정한 라운드마다 따라 하십시오.`,
    }));

  if (drills.length === 0) {
    drills.push({
      name: "섀도우 복싱",
      duration: "라운드당",
      description: "가드를 유지하며 펀치와 풋워크를 자유롭게 연습하십시오.",
    });
  }

  return {
    id: `custom-${Date.now()}`,
    code: "CUSTOM",
    title: form.title?.trim() || "내 커스텀 훈련",
    goal: form.goal?.trim() || "직접 만든 홈복싱 루틴",
    rounds: clampRounds(form.rounds),
    workSeconds: clampWorkSeconds(form.workSeconds),
    restSeconds: clampRestSeconds(form.restSeconds),
    drills,
    isCustom: true,
  };
}
