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
    body: "땀이 많이 나는 루틴입니다. 갈증 날 때 소량씩 자주 마시십시오.",
  },
  {
    title: "속도가 생명",
    body: "웨이트는 천천히 버티기보다, 밀 때(수축할 때) 펀치를 뻗듯 빠르고 폭발적으로 움직이세요.",
  },
  {
    title: "현실 대체 운동",
    body: "메디신볼 대신 타이어 때리기, 풀업 대신 밴드 풀다운, 러닝머신 대신 야외 로드워크로 바꿔도 됩니다.",
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
        title: "근전환 슈퍼세트",
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
    blocks: [
      {
        title: "서킷 (1라운드 = 3분)",
        prescription: "5라운드 · 라운드 간 휴식 1분",
        items: [
          { name: "버피 테스트", prescription: "45초", note: "" },
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
          { name: "플랭크", prescription: "2분", note: "" },
          {
            name: "러시안 트위스트",
            prescription: "50회",
            note: "복부 회전 · 펀치 회전력",
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
            name: "메디신볼 벽 던지기 (또는 타이어 때리기)",
            prescription: "15회 × 4세트",
            note: "전신 폭발 · 현실 대체 가능",
          },
        ],
      },
    ],
  },
  {
    id: "thu",
    day: "목요일",
    shortDay: "목",
    theme: "지옥의 6분 인터벌 & 맷집",
    focus: "러닝머신 + 맨몸",
    tone: "blue",
    blocks: [
      {
        title: "6분 인터벌 러닝",
        prescription: "4세트 · 세트 간 2분 가볍게 걷기",
        items: [
          {
            name: "전력 질주",
            prescription: "3분",
            note: "시속 13~15km (시합 체력)",
          },
          {
            name: "가벼운 조깅",
            prescription: "1분",
            note: "시속 6km",
          },
          {
            name: "최고 속도 질주",
            prescription: "2분",
            note: "시속 14~16km",
          },
        ],
      },
      {
        title: "복서 맷집",
        items: [
          {
            name: "넥 익스텐션 (목 운동, 선택)",
            prescription: "가볍게 각 10~15회",
            note: "손으로 가볍게 저항만 주고, 목을 세게 밀지 마십시오. 불편하면 생략",
          },
          {
            name: "행잉 레그레이즈 (또는 레그레이즈)",
            prescription: "20회 × 4세트",
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
    theme: "아침 로드워크 챌린지",
    focus: "야외 또는 러닝머신",
    tone: "blue",
    blocks: [
      {
        title: "유산소 베이스",
        items: [
          {
            name: "5km 타임 어택",
            prescription: "가능한 빠른 페이스",
            note: "심폐 지구력 베이스",
          },
          {
            name: "전신 스트레칭",
            prescription: "20분",
            note: "한 주 피로 해소",
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
