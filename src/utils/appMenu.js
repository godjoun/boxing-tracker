import { RELEASE_SCOPE } from "./releaseScope";

export const TIMER_MENU_CARD = {
  id: "timer",
  icon: "round",
  title: "라운드 타이머",
  description: "3R · 6R · 9R 타이머",
  route: "timer",
  accent: "red",
};

/** 전체 메뉴 바로가기 정의 */
const SHORTCUTS = {
  timer: TIMER_MENU_CARD,
  "fighter-card": {
    id: "fighter-card",
    icon: "card",
    title: "훈련 명패 만들기",
    description: "사진 · 문구 · 스타일",
    action: "card-maker",
    accent: "gold",
  },
  "training-log": {
    id: "training-log",
    icon: "log",
    title: "운동 기록하기",
    description: "복싱 · 러닝 · 웨이트 · 걷기",
    route: "log",
    accent: "slate",
  },
  curriculum: {
    id: "curriculum",
    icon: "skill",
    title: "루틴 보기",
    description: "4주 기술 코스",
    route: "curriculum",
    accent: "red",
  },
  strength: {
    id: "strength",
    icon: "body",
    title: "몸 만들기",
    description: "근력 · 워밍업",
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
    title: "프로필 보기",
    description: "사진 · 닉네임 · 스펙",
    route: "profile",
    accent: "red",
  },
  growth: {
    id: "growth",
    icon: "growth",
    title: "내 성장 보기",
    description: "커리어 · 마일스톤",
    route: "growth",
    accent: "gold",
  },
  rivals: {
    id: "rivals",
    icon: "combo",
    title: "라이벌 찾기",
    description: "복서 카드 · 스파링",
    route: "gym",
    gymView: "sparring",
    accent: "gold",
  },
  hub: {
    id: "hub",
    icon: "dojo",
    title: "교류",
    description: "모임 · 라이벌 · 내 관",
    route: "gym",
    gymView: "hub",
    accent: "slate",
  },
  gyms: {
    id: "gyms",
    icon: "dojo",
    title: "체육관 찾기",
    description: "지도 · 문의 · 찜",
    route: "gym",
    gymView: "gyms",
    accent: "slate",
  },
  backup: {
    id: "backup",
    icon: "backup",
    title: "백업 관리",
    description: "저장 · 복원 · 초기화",
    route: "backup",
    accent: "slate",
  },
};

export const MENU_GROUPS = [
  {
    id: "training",
    title: "운동하기",
    items: [
      SHORTCUTS["training-log"],
      SHORTCUTS.timer,
      SHORTCUTS.curriculum,
      SHORTCUTS.strength,
      SHORTCUTS["combo-creator"],
    ],
  },
  {
    id: "profile",
    title: "나를 보기",
    items: [SHORTCUTS.profile, SHORTCUTS.growth, SHORTCUTS["fighter-card"]],
  },
  {
    id: "community",
    title: "함께하기",
    items: [
      SHORTCUTS.hub,
      SHORTCUTS.gyms,
      ...(RELEASE_SCOPE.rivals ? [SHORTCUTS.rivals] : []),
    ],
  },
  {
    id: "app",
    title: "앱 관리",
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
