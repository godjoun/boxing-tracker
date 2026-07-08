export const TUTORIAL_TARGETS = {
  homeStart: "home-start",
  navTimer: "nav-timer",
  navLog: "nav-log",
  navJourney: "nav-journey",
  navCategory: "nav-category",
};

export const TUTORIAL_STEPS = [
  {
    id: "welcome",
    kicker: "WELCOME",
    title: "복싱 처음이어도 괜찮아요",
    body: "집에서 섀도우박싱만 해도 됩니다. 훈련할수록 파이터가 성장하고, 기록이 쌓입니다.",
    icon: "🥊",
    mode: "center",
  },
  {
    id: "home-start",
    kicker: "QUICK START",
    title: "오늘 훈련 시작",
    body: "홈에서 바로 타이머로 갈 수 있어요. 3R·6R 라운드 훈련이 가장 빠른 시작입니다.",
    hint: "복싱 한 세트 = 1라운드(R)",
    mode: "spotlight",
    target: TUTORIAL_TARGETS.homeStart,
    placement: "top",
    ensurePage: "home",
  },
  {
    id: "nav-timer",
    kicker: "TRAIN",
    title: "훈련 탭",
    body: "라운드 시간·휴식·알림음을 직접 고를 수 있어요. 에어팟을 쓰면 화면이 꺼져도 종이 울립니다.",
    mode: "spotlight",
    target: TUTORIAL_TARGETS.navTimer,
    placement: "top",
  },
  {
    id: "nav-category",
    kicker: "GUIDE",
    title: "더보기 메뉴",
    body: "홈 커리큘럼·훈련법 추천·성장 분석이 여기 있습니다. 뭘 해야 할지 모를 땐 커리큘럼부터.",
    mode: "spotlight",
    target: TUTORIAL_TARGETS.navCategory,
    placement: "top",
  },
  {
    id: "nav-log",
    kicker: "GROWTH",
    title: "기록 · 여정",
    body: "훈련하면 기록 탭에 라운드가 쌓이고 EXP로 레벨이 올라요. 여정 탭에서 다음 해금도 확인하세요.",
    mode: "spotlight",
    target: TUTORIAL_TARGETS.navLog,
    placement: "top",
    secondaryTarget: TUTORIAL_TARGETS.navJourney,
  },
  {
    id: "finish",
    kicker: "READY",
    title: "이제 시작해 볼까요?",
    body: "타이머로 바로 훈련하거나, 홈 커리큘럼 DAY 1부터 따라가도 좋아요.",
    mode: "center",
    isFinish: true,
  },
];

export function getTutorialTargetSelector(targetId) {
  if (!targetId) {
    return null;
  }

  return `[data-tutorial-target="${targetId}"]`;
}
