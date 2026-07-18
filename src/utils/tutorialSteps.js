export const TUTORIAL_TARGETS = {
  homeStart: "home-start",
  navTimer: "nav-timer",
  navLog: "nav-log",
  navGrowth: "nav-growth",
  navCategory: "nav-category",
};

export const TUTORIAL_STEPS = [
  {
    id: "welcome",
    kicker: "WELCOME",
    title: "복싱 처음이어도 괜찮아요",
    body: "집에서 섀도우만 해도 됩니다. 라운드를 남기면 당신의 훈련 흔적이 쌓입니다.",
    icon: "🥊",
    mode: "center",
  },
  {
    id: "home-start",
    kicker: "TODAY",
    title: "오늘 한 가지부터",
    body: "홈의 큰 버튼으로 오늘 레슨을 열거나, 바로 타이머 훈련을 시작하세요.",
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
    body: "타이머·커리큘럼·훈련법 추천이 여기에 있어요. 훈련의 출발점입니다.",
    mode: "spotlight",
    target: TUTORIAL_TARGETS.navTimer,
    placement: "top",
  },
  {
    id: "nav-category",
    kicker: "MORE",
    title: "더보기 메뉴",
    body: "명패·체육관 찾기·데이터 백업이 여기 있습니다. 앱 사용법은 튜토리얼로 다시 볼 수 있어요.",
    mode: "spotlight",
    target: TUTORIAL_TARGETS.navCategory,
    placement: "top",
  },
  {
    id: "nav-growth",
    kicker: "GROWTH",
    title: "성장 탭",
    body: "주간 목표와 지금까지의 라운드 흐름을 여기서 확인하세요.",
    mode: "spotlight",
    target: TUTORIAL_TARGETS.navGrowth,
    placement: "top",
  },
  {
    id: "nav-log",
    kicker: "LOG",
    title: "기록 탭",
    body: "완료한 라운드와 메모가 여기에 쌓입니다. 타이머를 쓰면 자동으로 남겨져요.",
    mode: "spotlight",
    target: TUTORIAL_TARGETS.navLog,
    placement: "top",
  },
  {
    id: "finish",
    kicker: "READY",
    title: "이제 시작해 볼까요?",
    body: "오늘 버튼으로 바로 들어가거나, 훈련 탭에서 타이머를 열어보세요.",
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
