export const TIMER_MENU_CARD = {
  id: "timer",
  icon: "round",
  title: "라운드",
  description: "3R · 6R · 9R",
  route: "timer",
  accent: "red",
};

/** 홈 대시보드 · 더보기에서 공유하는 바로가기 정의 */
const SHORTCUTS = {
  timer: TIMER_MENU_CARD,
  "fighter-card": {
    id: "fighter-card",
    icon: "card",
    title: "훈련 카드",
    description: "카드 만들기",
    action: "card-maker",
    accent: "gold",
  },
  "training-log": {
    id: "training-log",
    icon: "log",
    title: "기록",
    description: "로그 · 캘린더",
    route: "log",
    accent: "slate",
  },
  curriculum: {
    id: "curriculum",
    icon: "skill",
    title: "기술",
    description: "4주 코스",
    route: "curriculum",
    accent: "red",
  },
  strength: {
    id: "strength",
    icon: "body",
    title: "신체",
    description: "몸 만들기",
    route: "strength",
    accent: "orange",
  },
  "combo-creator": {
    id: "combo-creator",
    icon: "combo",
    title: "콤보 만들기",
    description: "내 콤보 · 선수 콤보",
    route: "combo-creator",
    accent: "gold",
    featureId: "combo-creator",
  },
  profile: {
    id: "profile",
    icon: "nameplate",
    title: "내 명패",
    description: "스펙 · 사진",
    route: "profile",
    accent: "red",
  },
  growth: {
    id: "growth",
    icon: "growth",
    title: "성장",
    description: "주간 목표 · 마일스톤",
    route: "growth",
    accent: "gold",
  },
  gyms: {
    id: "gyms",
    icon: "dojo",
    title: "짐",
    description: "체육관 지도 · 라이벌 · 찜",
    route: "gym",
    gymView: "gyms",
    accent: "slate",
  },
  backup: {
    id: "backup",
    icon: "backup",
    title: "데이터 백업",
    description: "저장 · 복원",
    route: "backup",
    accent: "slate",
  },
};

export const MENU_GROUPS = [
  {
    id: "trace",
    title: "흔적",
    items: [SHORTCUTS["training-log"]],
  },
  {
    id: "train",
    title: "링",
    items: [
      SHORTCUTS.timer,
      SHORTCUTS.curriculum,
      SHORTCUTS.strength,
      SHORTCUTS["combo-creator"],
    ],
  },
  {
    id: "fighter",
    title: "명패",
    items: [SHORTCUTS["fighter-card"], SHORTCUTS.profile, SHORTCUTS.growth],
  },
  {
    id: "outside",
    title: "바깥",
    items: [SHORTCUTS.gyms],
  },
  {
    id: "tools",
    title: "도구",
    items: [SHORTCUTS.backup],
  },
];

export function getAllMenuItems() {
  return MENU_GROUPS.flatMap((group) => group.items);
}

/** 홈 대시보드에서 고를 수 있는 바로가기 풀 */
export const DASHBOARD_SHORTCUT_POOL = [
  SHORTCUTS.timer,
  SHORTCUTS["fighter-card"],
  SHORTCUTS["training-log"],
  SHORTCUTS.curriculum,
  SHORTCUTS.strength,
  SHORTCUTS["combo-creator"],
  SHORTCUTS.profile,
  SHORTCUTS.growth,
  SHORTCUTS.gyms,
  SHORTCUTS.backup,
];

export const DEFAULT_HOME_SHORTCUTS = [
  "fighter-card",
  "training-log",
  "curriculum",
];

export function getDashboardShortcut(id) {
  return DASHBOARD_SHORTCUT_POOL.find((item) => item.id === id) || null;
}
