export const STRENGTH_WARMUP = {
  title: "공통 워밍업",
  description: "모든 운동 전 필수",
  rounds: 3,
  workSeconds: 180,
  restSeconds: 30,
  steps: [
    {
      name: "줄넘기",
      duration: "3분",
      note: "발목·손목 풀고 라운드 리듬에 맞춰 가볍게",
    },
  ],
};

export const STRENGTH_TIPS = [
  {
    title: "수분 섭취",
    body: "땀이 나는 루틴입니다. 갈증 나기 전에 소량씩 자주 마시세요.",
  },
  {
    title: "폭발적으로",
    body: "웨이트는 천천히 버티기보다, 밀 때(수축) 펀치를 뻗듯 빠르고 깔끔하게 움직이세요.",
  },
  {
    title: "장비 없으면",
    body: "메디신볼 → 가방 밀치기, 풀업 → 밴드 풀다운, 러닝머신 → 야외 로드워크로 바꿔도 됩니다.",
  },
];

export const STRENGTH_WEEK = [
  {
    id: "mon",
    day: "월요일",
    shortDay: "월",
    theme: "전신 폭발력 & 하체 파워",
    focus: "헬스장 위주",
    tone: "red",
    timer: { rounds: 5, workSeconds: 180, restSeconds: 90 },
    blocks: [
      {
        title: "메인 리프트",
        items: [
          {
            name: "파워 클린 (또는 덤벨 스나이치)",
            prescription: "5회 × 5세트",
            note: "전신 폭발력",
          },
          {
            name: "바벨 스쿼트 (또는 덤벨 런지)",
            prescription: "8회 × 4세트",
            note: "하체 지지력",
          },
          {
            name: "바벨 벤치프레스",
            prescription: "8회 × 4세트",
            note: "밀어내는 힘",
          },
        ],
      },
      {
        title: "전환 슈퍼세트",
        items: [
          {
            name: "벤치프레스 1세트 → 맨몸 원투 펀치",
            prescription: "30초 전력 뻗기 · 4세트",
            note: "세트 사이 휴식 없이 바로 펀치",
          },
        ],
      },
    ],
  },
  {
    id: "tue",
    day: "화요일",
    shortDay: "화",
    theme: "무산소 심폐 서킷 & 코어",
    focus: "맨몸 위주",
    tone: "blue",
    timer: { rounds: 5, workSeconds: 180, restSeconds: 60 },
    blocks: [
      {
        title: "서킷 (1라운드 = 3분)",
        prescription: "5라운드 · 라운드 간 휴식 1분",
        items: [
          { name: "버피", prescription: "45초", note: "" },
          { name: "점프 스쿼트", prescription: "45초", note: "" },
          {
            name: "박수 푸시업 (또는 빠른 푸시업)",
            prescription: "45초",
            note: "",
          },
          { name: "마운틴 클라이머", prescription: "45초", note: "" },
        ],
      },
      {
        title: "코어 마무리",
        items: [
          { name: "플랭크", prescription: "45~60초 × 3세트", note: "" },
          {
            name: "러시안 트위스트",
            prescription: "좌우 합 40회 × 3세트",
            note: "복부 회전 · 훅 회전력",
          },
        ],
      },
    ],
  },
  {
    id: "wed",
    day: "수요일",
    shortDay: "수",
    theme: "협응력 & 펀치 스피드",
    focus: "헬스장 + 맨몸",
    tone: "red",
    timer: { rounds: 4, workSeconds: 180, restSeconds: 60 },
    blocks: [
      {
        title: "스피드 & 백",
        items: [
          {
            name: "덤벨 섀도우복싱",
            prescription: "3분 × 3라운드",
            note: "1~2kg · 원투·훅·어퍼 연속",
          },
          {
            name: "풀업 (턱걸이)",
            prescription: "가능한 만큼 × 4세트",
            note: "등·클린치 버티는 힘",
          },
          {
            name: "케틀벨 스윙 (또는 덤벨 스윙)",
            prescription: "20회 × 4세트",
            note: "고관절 탄력 · 회전력",
          },
          {
            name: "메디신볼 벽 던지기 (또는 샌드백 밀치기)",
            prescription: "12~15회 × 3세트",
            note: "전신 폭발 · 장비 없으면 생략 가능",
          },
        ],
      },
    ],
  },
  {
    id: "thu",
    day: "목요일",
    shortDay: "목",
    theme: "로드워크 인터벌 & 코어",
    focus: "야외 · 줄넘기 · 맨몸",
    tone: "blue",
    timer: { rounds: 10, workSeconds: 60, restSeconds: 60 },
    blocks: [
      {
        title: "로드워크 인터벌",
        prescription: "10라운드 · 라운드 = 하드 1분 + 회복 1분",
        items: [
          {
            name: "하드 페이스 (러닝 또는 줄넘기 전력)",
            prescription: "1분",
            note: "말할 수 없을 만큼 빠르게 · 본인 체력에 맞게",
          },
          {
            name: "회복 페이스 (걷기~가벼운 조깅)",
            prescription: "1분",
            note: "숨만 고르기 · 멈추지 말고 계속 움직이기",
          },
        ],
      },
      {
        title: "코어 · 목",
        items: [
          {
            name: "넥 브릿지 대체 (누워서 고개만 살짝)",
            prescription: "각 방향 8~10회",
            note: "손으로 가벼운 저항만 · 통증 있으면 생략",
          },
          {
            name: "행잉 레그레이즈 (또는 레그레이즈)",
            prescription: "10~15회 × 3세트",
            note: "복부 · 가드 유지에 쓰는 힘",
          },
          {
            name: "플랭크",
            prescription: "45~60초 × 3세트",
            note: "",
          },
        ],
      },
    ],
  },
  {
    id: "fri",
    day: "금요일",
    shortDay: "금",
    theme: "전신 스트렝스 & 피로 누적 극복",
    focus: "헬스장",
    tone: "red",
    timer: { rounds: 5, workSeconds: 180, restSeconds: 90 },
    blocks: [
      {
        title: "스트렝스",
        items: [
          {
            name: "데드리프트",
            prescription: "6회 × 4세트",
            note: "뒷근육 전체",
          },
          {
            name: "오버헤드 프레스",
            prescription: "8회 × 4세트",
            note: "가드 유지 · 어깨 지구력",
          },
          {
            name: "덤벨 로우 (또는 랫풀다운)",
            prescription: "10회 × 4세트",
            note: "",
          },
          {
            name: "푸시업 바 서킷",
            prescription: "3세트 연속",
            note: "푸시업 20회 + 인앤아웃 점프 20회",
          },
        ],
      },
    ],
  },
  {
    id: "sat",
    day: "토요일",
    shortDay: "토",
    theme: "로드워크 & 회복",
    focus: "야외 또는 러닝머신",
    tone: "blue",
    timer: { rounds: 8, workSeconds: 180, restSeconds: 30 },
    blocks: [
      {
        title: "유산소 베이스",
        items: [
          {
            name: "로드워크",
            prescription: "40~50분 · 편한 페이스",
            note: "대화 가능한 속도 · 거리보다 꾸준함이 중요",
          },
          {
            name: "전신 스트레칭",
            prescription: "15~20분",
            note: "한 주 피로 풀기 · 고관절·어깨·발목",
          },
        ],
      },
    ],
  },
];

export function getStrengthDay(id) {
  return STRENGTH_WEEK.find((day) => day.id === id) || STRENGTH_WEEK[0];
}

export function getTodayStrengthDay() {
  const dayIndex = new Date().getDay();
  const map = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const id = map[dayIndex];
  return getStrengthDay(id === "sun" ? "mon" : id);
}

export function buildStrengthWarmupLaunch() {
  return {
    presetId: "strength-warmup",
    rounds: STRENGTH_WARMUP.rounds,
    workSeconds: STRENGTH_WARMUP.workSeconds,
    restSeconds: STRENGTH_WARMUP.restSeconds,
    prepSeconds: 10,
    routineTitle: "몸강화 · 줄넘기 워밍업",
    logType: "몸강화 · 줄넘기 워밍업",
  };
}

/**
 * 요일 본운동 타이머. skipWarmup이면 줄넘기 라운드 없이 본운동만.
 * strengthPlan = 타이머 옆에 띄울 요일 운동 전체(블록·종목).
 */
export function buildStrengthDayLaunch(day, { skipWarmup = false } = {}) {
  const plan = day || getTodayStrengthDay();
  const main = plan.timer || { rounds: 5, workSeconds: 180, restSeconds: 60 };
  const warmupRounds = skipWarmup ? 0 : STRENGTH_WARMUP.rounds;
  const totalRounds = warmupRounds + main.rounds;
  const warmupNote =
    STRENGTH_WARMUP.steps[0]?.note ||
    "발목·손목 풀고 라운드 리듬에 맞춰 가볍게";
  const drills = [];

  if (warmupRounds > 0) {
    drills.push({
      name: `줄넘기 워밍업`,
      duration: `${warmupRounds}R`,
      description: warmupNote,
      roundFrom: 1,
      roundTo: warmupRounds,
    });
  }

  const mainFrom = warmupRounds + 1;
  const exerciseLines = plan.blocks
    .flatMap((block) =>
      block.items.map(
        (item) => `${item.name}${item.prescription ? ` · ${item.prescription}` : ""}`
      )
    )
    .slice(0, 4);
  drills.push({
    name: plan.theme,
    duration: `${main.rounds}R`,
    description:
      exerciseLines.length > 0
        ? `${plan.focus}. 아래 목록을 따라가세요 · ${exerciseLines.join(" / ")}`
        : `${plan.focus} · 아래 요일 루틴을 따라가세요`,
    roundFrom: mainFrom,
    roundTo: totalRounds,
  });

  return {
    presetId: `strength-${plan.id}${skipWarmup ? "-nowarm" : ""}`,
    rounds: totalRounds,
    workSeconds: main.workSeconds,
    restSeconds: main.restSeconds,
    prepSeconds: 10,
    cooldownSeconds: 0,
    strengthDayId: plan.id,
    strengthSkipWarmup: skipWarmup,
    canSkipStrengthWarmup: !skipWarmup,
    strengthPlan: {
      id: plan.id,
      day: plan.day,
      shortDay: plan.shortDay,
      theme: plan.theme,
      focus: plan.focus,
      warmupRounds,
      warmupTitle: STRENGTH_WARMUP.title,
      warmupNote,
      blocks: plan.blocks,
      mainRounds: main.rounds,
      workSeconds: main.workSeconds,
      restSeconds: main.restSeconds,
    },
    routineTitle: `${plan.day} · ${plan.theme}`,
    logType: `신체 · ${plan.day}`,
    curriculumTitle: plan.theme,
    curriculumGoal: plan.focus,
    curriculumSessionCode: plan.shortDay,
    curriculumWeekLabel: plan.day,
    curriculumDrills: drills,
  };
}
