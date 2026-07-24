export const TUTORIAL_TARGETS = {
  homeStart: "home-start",
  navTimer: "nav-timer",
  navDojo: "nav-dojo",
  navProfile: "nav-profile",
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
    title: "오늘의 한 장면",
    body: "홈은 메뉴판이 아닙니다. 큰 버튼 하나로 오늘 레슨을 열거나, 바로 훈련을 시작하세요.",
    hint: "복싱 한 세트 = 1라운드(R)",
    mode: "spotlight",
    target: TUTORIAL_TARGETS.homeStart,
    placement: "top",
    ensurePage: "home",
  },
  {
    id: "nav-timer",
    kicker: "TRAIN",
    title: "링 — 훈련을 시작한다",
    body: "타이머·기술·신체 훈련을 여는 곳입니다. 라운드를 끝내면 기록이 남아요.",
    mode: "spotlight",
    target: TUTORIAL_TARGETS.navTimer,
    placement: "top",
  },
  {
    id: "nav-dojo",
    kicker: "GYM",
    title: "짐 — 체육관과 상대를 찾는다",
    body: "지도에서 체육관을 찾고, 라이벌과 찜한 체육관을 한곳에서 확인합니다.",
    mode: "spotlight",
    target: TUTORIAL_TARGETS.navDojo,
    placement: "top",
  },
  {
    id: "nav-profile",
    kicker: "NAMEPLATE",
    title: "명패 — 내 복싱의 흔적",
    body: "스펙·사진·누적 훈련이 담긴 프로필입니다. 훈련 카드도 여기서 만들어요.",
    mode: "spotlight",
    target: TUTORIAL_TARGETS.navProfile,
    placement: "top",
  },
  {
    id: "nav-category",
    kicker: "MORE",
    title: "더보기 — 다 찾기",
    body: "수동 기록·데이터 백업·테마 같은 보조 도구를 모아 두었습니다.",
    mode: "spotlight",
    target: TUTORIAL_TARGETS.navCategory,
    placement: "top",
  },
  {
    id: "finish",
    kicker: "READY",
    title: "이제 시작해 볼까요?",
    body: "홈의 오늘 버튼으로 바로 들어가거나, 링에서 라운드를 열어보세요.",
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
