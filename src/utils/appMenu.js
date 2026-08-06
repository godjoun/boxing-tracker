export const TIMER_MENU_CARD = {
  id: "timer",
  icon: "round",
  title: "라운드 타이머",
  description: "3R · 6R · 9R 타이머",
  route: "timer",
  accent: "red",
};

/** 메뉴·바로가기 항목 정의 (라우트·기능은 유지, 전체 노출은 MENU_GROUPS만) */
const SHORTCUTS = {
  timer: TIMER_MENU_CARD,
  "fighter-card": {
    id: "fighter-card",
    icon: "card",
    title: "훈련 카드 만들기",
    description: "훈련을 한 장면으로 남기기",
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
    description: "저장한 훈련 루틴을 확인합니다.",
    route: "curriculum",
    accent: "red",
  },
  strength: {
    id: "strength",
    icon: "body",
    title: "몸 만들기",
    description: "복싱을 위한 보조 운동을 봅니다.",
    route: "strength",
    accent: "orange",
  },
  "combo-creator": {
    id: "combo-creator",
    icon: "combo",
    title: "콤보 만들기",
    description: "나만의 복싱 콤보를 구성합니다.",
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
    description: "누적 훈련 흐름을 확인합니다.",
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
    title: "함께하기",
    description: "체육관과 다른 복서 만나기",
    route: "gym",
    gymView: "feed",
    accent: "slate",
  },
  gyms: {
    id: "gyms",
    icon: "dojo",
    title: "체육관 찾기",
    description: "주변 복싱 체육관을 찾습니다.",
    route: "gym",
    gymView: "gyms",
    accent: "slate",
  },
  backup: {
    id: "backup",
    icon: "backup",
    title: "백업 관리",
    description: "저장 · 복원 · 초기화를 관리합니다.",
    route: "backup",
    accent: "slate",
  },
  settings: {
    id: "settings",
    icon: "more",
    title: "앱 설정",
    description: "테마, 백업, 도움말 관리",
    action: "settings",
    accent: "slate",
  },
};

/**
 * 전체 메뉴 최상위 — 선택지 3개만.
 * 루틴·몸·콤보·성장·체육관 단독·라이벌은 노출하지 않음 (라우트·다른 탭 진입은 유지).
 */
export const MENU_GROUPS = [
  {
    id: "primary",
    title: null,
    items: [SHORTCUTS.hub, SHORTCUTS["fighter-card"], SHORTCUTS.settings],
  },
];

/** 앱 설정 패널 — 백업 (테마·튜토리얼·약관은 UI에서 합침) */
export const SETTINGS_MENU_ITEMS = [SHORTCUTS.backup];

export function getAllMenuItems() {
  return MENU_GROUPS.flatMap((group) => group.items);
}

/** 홈 대시보드에서 고를 수 있는 바로가기 풀 (레거시 풀 유지) */
export const DASHBOARD_SHORTCUT_POOL = [
  TIMER_MENU_CARD,
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
