/** 복싱 체력 — 집·무도구 10분 보조 루틴 (route id: strength 유지) */

export const STRENGTH_SEGMENT = {
  workSeconds: 40,
  restSeconds: 20,
  laps: 2,
  exerciseCount: 5,
};

/** 10구간 = 동작 5 × 2바퀴 */
export const STRENGTH_TOTAL_SEGMENTS =
  STRENGTH_SEGMENT.exerciseCount * STRENGTH_SEGMENT.laps;

export const STRENGTH_ROUTINES = [
  {
    id: "core",
    title: "10분 코어",
    purpose: "가드를 유지하고 펀치를 낼 때 몸통이 흔들리지 않도록 돕는 보조 루틴",
    durationLabel: "약 10분",
    tone: "blue",
    beginners: [
      "플랭크 → 무릎 플랭크",
      "사이드 플랭크 → 무릎을 바닥에 댄 사이드 플랭크",
      "동작 범위와 속도를 줄일 수 있음",
    ],
    cautions: [
      "허리가 과하게 뜨거나 꺾이지 않게 합니다.",
      "목이나 허리에 통증이 생기면 중단합니다.",
      "숨을 참지 않습니다.",
    ],
    exercises: [
      { id: "dead-bug", name: "데드버그", cue: "40초 · 반대쪽 손·발" },
      { id: "plank", name: "플랭크", cue: "40초 · 몸통 일직선" },
      {
        id: "side-plank",
        name: "사이드 플랭크",
        cue: "1바퀴 왼쪽 · 2바퀴 오른쪽",
        lapNames: {
          1: "사이드 플랭크 왼쪽",
          2: "사이드 플랭크 오른쪽",
        },
        lapCues: {
          1: "40초 · 왼쪽",
          2: "40초 · 오른쪽",
        },
      },
      { id: "bird-dog", name: "버드독", cue: "40초 · 천천히 뻗고 유지" },
      { id: "heel-tap", name: "힐 탭", cue: "40초 · 가볍게 옆 터치" },
    ],
  },
  {
    id: "legs",
    title: "10분 하체",
    purpose: "복싱 스탠스를 유지하고 앞뒤로 이동할 때 필요한 하체 지구력을 돕는 루틴",
    durationLabel: "약 10분",
    tone: "red",
    beginners: [
      "스쿼트 깊이를 줄일 수 있음",
      "런지 → 넓은 스탠스에서 좌우 체중 이동",
      "스쿼트 홀드 시간을 줄일 수 있음",
    ],
    cautions: [
      "무릎이 안쪽으로 무너지지 않게 합니다.",
      "미끄럽지 않은 바닥에서 진행합니다.",
      "무릎이나 허리에 통증이 생기면 중단합니다.",
    ],
    exercises: [
      { id: "squat", name: "맨몸 스쿼트", cue: "40초 · 무릎·발끝 정렬" },
      {
        id: "reverse-lunge",
        name: "제자리 리버스 런지",
        cue: "40초 · 좌우 번갈아",
      },
      { id: "glute-bridge", name: "글루트 브릿지", cue: "40초 · 엉덩이 들어 올리기" },
      { id: "calf-raise", name: "카프 레이즈", cue: "40초 · 천천히 올리고 내리기" },
      { id: "squat-hold", name: "스쿼트 홀드", cue: "40초 · 중간 깊이에서 유지" },
    ],
  },
  {
    id: "upper",
    title: "10분 상체·어깨",
    purpose: "가드를 유지하고 펀치를 뻗었다 되돌리는 상체·어깨 지구력을 돕는 루틴",
    durationLabel: "약 10분",
    tone: "orange",
    beginners: [
      "푸시업 → 무릎 푸시업 또는 벽 푸시업",
      "견갑 푸시업 → 벽에서 수행",
      "가드 홀드 시간을 줄일 수 있음",
    ],
    cautions: [
      "도구·가구를 당기는 동작은 하지 않습니다.",
      "잽은 힘껏 휘두르지 않고 가볍게 뻗고 복귀합니다.",
      "어깨에 통증이나 찌릿함이 생기면 중단합니다.",
    ],
    exercises: [
      { id: "push-up", name: "푸시업", cue: "40초 · 가슴·어깨 정렬" },
      {
        id: "scapular-push-up",
        name: "견갑 푸시업",
        cue: "40초 · 팔꿈치는 편 채 어깨만",
      },
      {
        id: "yt-raise",
        name: "엎드린 레이즈",
        cue: "1바퀴 Y · 2바퀴 T",
        lapNames: {
          1: "엎드린 Y 레이즈",
          2: "엎드린 T 레이즈",
        },
        lapCues: {
          1: "40초 · Y",
          2: "40초 · T",
        },
      },
      { id: "guard-hold", name: "가드 홀드", cue: "40초 · 손·팔꿈치 가드 유지" },
      {
        id: "jab-shadow",
        name: "가벼운 잽 섀도우",
        cue: "40초 · 가볍게 뻗고 바로 복귀",
      },
    ],
  },
];

/** @deprecated 요일 표는 제거됨. 호환용으로 루틴 목록을 가리킴 */
export const STRENGTH_WEEK = STRENGTH_ROUTINES;

export function getStrengthRoutine(id) {
  return (
    STRENGTH_ROUTINES.find((routine) => routine.id === id) || STRENGTH_ROUTINES[0]
  );
}

/** 레거시 이름 유지 — TimerPage / 테스트 호환 */
export function getStrengthDay(id) {
  return getStrengthRoutine(id);
}

export function getTodayStrengthRoutine() {
  const index = new Date().getDay() % STRENGTH_ROUTINES.length;
  return STRENGTH_ROUTINES[index];
}

export function getTodayStrengthDay() {
  return getTodayStrengthRoutine();
}

/**
 * 바퀴별 표시명·큐 (사이드 플랭크 좌/우, Y/T 등)
 * @param {object|null} exercise
 * @param {number} lap 1-based
 */
export function resolveExerciseForLap(exercise, lap) {
  if (!exercise) return null;
  const safeLap = lap === 2 ? 2 : 1;
  return {
    ...exercise,
    name: exercise.lapNames?.[safeLap] || exercise.name,
    cue: exercise.lapCues?.[safeLap] || exercise.cue || "",
  };
}

/**
 * 타이머 라운드(1~10) → 동작·바퀴 정보
 * @param {object} plan strengthPlan 또는 routine
 * @param {number} currentRound 1-based
 * @param {"prep"|"work"|"rest"|"cooldown"|"done"} [phase]
 */
export function resolveStrengthSegment(plan, currentRound, phase = "work") {
  const exercises = plan?.exercises || [];
  const count = exercises.length || STRENGTH_SEGMENT.exerciseCount;
  const total = plan?.totalSegments || STRENGTH_TOTAL_SEGMENTS;
  const round = Math.min(Math.max(Number(currentRound) || 1, 1), total);
  const exerciseIndex = (round - 1) % count;
  const lap = Math.floor((round - 1) / count) + 1;
  const exercise = resolveExerciseForLap(exercises[exerciseIndex] || null, lap);
  const nextRound = round < total ? round + 1 : null;
  const nextExerciseIndex =
    nextRound != null ? (nextRound - 1) % count : null;
  const nextLap =
    nextRound != null ? Math.floor((nextRound - 1) / count) + 1 : null;
  const nextExercise =
    nextExerciseIndex != null
      ? resolveExerciseForLap(exercises[nextExerciseIndex] || null, nextLap)
      : null;

  return {
    exercise,
    exerciseIndex,
    lap,
    totalLaps: STRENGTH_SEGMENT.laps,
    segmentIndex: round,
    totalSegments: total,
    nextExercise,
    isRest: phase === "rest",
    isPrep: phase === "prep",
  };
}

/**
 * 복싱 체력 루틴 → 기존 TimerPage 런치 페이로드
 * 10R × 40초 운동 / 20초 휴식 (준비 10초 유지)
 */
export function buildStrengthDayLaunch(routine) {
  const plan = routine || getTodayStrengthRoutine();
  const exercises = plan.exercises || [];
  const totalSegments = STRENGTH_TOTAL_SEGMENTS;
  const drills = exercises.map((item, index) => ({
    name: item.name,
    duration: "40초",
    description: item.cue || "",
    roundFrom: index + 1,
    roundTo: index + 1 + STRENGTH_SEGMENT.exerciseCount,
  }));

  return {
    presetId: `strength-${plan.id}`,
    rounds: totalSegments,
    workSeconds: STRENGTH_SEGMENT.workSeconds,
    restSeconds: STRENGTH_SEGMENT.restSeconds,
    prepSeconds: 10,
    cooldownSeconds: 0,
    strengthDayId: plan.id,
    strengthSkipWarmup: true,
    canSkipStrengthWarmup: false,
    strengthPlan: {
      id: plan.id,
      title: plan.title,
      purpose: plan.purpose,
      day: plan.title,
      shortDay: plan.title,
      theme: plan.title,
      focus: plan.purpose,
      warmupRounds: 0,
      warmupTitle: "",
      warmupNote: "",
      blocks: [],
      exercises,
      beginners: plan.beginners || [],
      cautions: plan.cautions || [],
      mainRounds: totalSegments,
      totalSegments,
      workSeconds: STRENGTH_SEGMENT.workSeconds,
      restSeconds: STRENGTH_SEGMENT.restSeconds,
      laps: STRENGTH_SEGMENT.laps,
    },
    routineTitle: plan.title,
    logType: `신체 · ${plan.title}`,
    curriculumTitle: plan.title,
    curriculumGoal: plan.purpose,
    curriculumSessionCode: plan.id,
    curriculumWeekLabel: "복싱 체력",
    curriculumDrills: drills,
  };
}

/** 워밍업 단독 런치는 제거됨 — 호환용 no-op 대체 */
export function buildStrengthWarmupLaunch() {
  return buildStrengthDayLaunch(getStrengthRoutine("core"));
}
