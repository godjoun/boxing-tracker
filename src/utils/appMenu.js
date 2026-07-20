export const TIMER_MENU_CARD = {
  id: "timer",
  icon: "◷",
  title: "라운드 타이머",
  description: "3R · 6R · 9R 경기식 라운드",
  route: "timer",
  accent: "red",
};

/** 홈 대시보드 · 더보기에서 공유하는 바로가기 정의 */
const SHORTCUTS = {
  timer: TIMER_MENU_CARD,
  "fighter-card": {
    id: "fighter-card",
    icon: "◆",
    title: "훈련 카드",
    description: "카드 만들기",
    action: "card-maker",
    accent: "gold",
  },
  "training-log": {
    id: "training-log",
    icon: "R",
    title: "기록",
    description: "로그 · 캘린더",
    route: "log",
    accent: "slate",
  },
  curriculum: {
    id: "curriculum",
    icon: "C",
    title: "커리큘럼",
    description: "4주 코스",
    route: "curriculum",
    accent: "red",
  },
  strength: {
    id: "strength",
    icon: "B",
    title: "훈련법 추천",
    description: "몸 만들기",
    route: "strength",
    accent: "orange",
  },
  "combo-creator": {
    id: "combo-creator",
    icon: "※",
    title: "콤보 만들기",
    description: "내 콤보 · 선수 콤보",
    route: "combo-creator",
    accent: "gold",
    featureId: "combo-creator",
  },
  profile: {
    id: "profile",
    icon: "◇",
    title: "내 명패",
    description: "스펙 · 사진",
    route: "profile",
    accent: "red",
  },
  growth: {
    id: "growth",
    icon: "↗",
    title: "성장",
    description: "주간 목표 · 마일스톤",
    route: "growth",
    accent: "gold",
  },
  gyms: {
    id: "gyms",
    icon: "M",
    title: "도장",
    description: "교류 · 체육관 문의·대여 · 라이벌 찾기",
    route: "gym",
    gymView: "hub",
    accent: "slate",
  },
  backup: {
    id: "backup",
    icon: "↓",
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
    title: "훈련",
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
