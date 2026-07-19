export const TIMER_MENU_CARD = {
  id: "timer",
  icon: "◷",
  title: "라운드 타이머",
  description: "3R · 6R · 9R 경기식 라운드",
  route: "timer",
  accent: "red",
};

export const MENU_GROUPS = [
  {
    id: "fighter",
    title: "프로필",
    items: [
      {
        id: "card",
        icon: "◆",
        title: "포스터 카드",
        description: "오늘의 장면",
        action: "card-maker",
        accent: "gold",
      },
      {
        id: "profile",
        icon: "F",
        title: "명패",
        description: "스펙 · 사진",
        route: "profile",
        accent: "red",
      },
      {
        id: "growth",
        icon: "↗",
        title: "성장",
        description: "주간 목표 · 마일스톤",
        route: "growth",
        accent: "gold",
      },
    ],
  },
  {
    id: "match",
    title: "매칭",
    items: [
      {
        id: "gyms",
        icon: "M",
        title: "주변 체육관",
        description: "체육관 찾기",
        route: "gym",
        gymView: "gyms",
        accent: "red",
      },
      {
        id: "sparring",
        icon: "S",
        title: "스파링 찾기",
        description: "체급 · 경력 매칭",
        route: "gym",
        gymView: "sparring",
        accent: "orange",
        featureId: "sparring",
      },
    ],
  },
  {
    id: "more",
    title: "설정",
    items: [
      {
        id: "backup",
        icon: "↓",
        title: "데이터 백업",
        description: "저장 · 복원",
        route: "backup",
        accent: "slate",
      },
    ],
  },
];

export function getAllMenuItems() {
  return [
    TIMER_MENU_CARD,
    ...MENU_GROUPS.flatMap((group) => group.items),
  ];
}

/** 홈 대시보드에서 고를 수 있는 바로가기 풀 */
export const DASHBOARD_SHORTCUT_POOL = [
  {
    id: "timer",
    icon: TIMER_MENU_CARD.icon,
    title: TIMER_MENU_CARD.title,
    route: "timer",
  },
  {
    id: "fighter-card",
    icon: "◆",
    title: "포스터 카드",
    action: "card-maker",
  },
  {
    id: "training-log",
    icon: "R",
    title: "훈련 로그",
    route: "log",
  },
  {
    id: "curriculum",
    icon: "C",
    title: "커리큘럼",
    route: "curriculum",
  },
  {
    id: "strength",
    icon: "B",
    title: "훈련법 추천",
    route: "strength",
  },
  {
    id: "profile",
    icon: "F",
    title: "명패",
    route: "profile",
  },
  {
    id: "gyms",
    icon: "M",
    title: "주변 체육관",
    route: "gym",
    gymView: "gyms",
  },
  {
    id: "sparring",
    icon: "S",
    title: "스파링 찾기",
    route: "gym",
    gymView: "sparring",
    featureId: "sparring",
  },
  {
    id: "backup",
    icon: "↓",
    title: "데이터 백업",
    route: "backup",
  },
];

export const DEFAULT_HOME_SHORTCUTS = [
  "fighter-card",
  "training-log",
  "curriculum",
];

export function getDashboardShortcut(id) {
  return DASHBOARD_SHORTCUT_POOL.find((item) => item.id === id) || null;
}
