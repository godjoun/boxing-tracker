export const TUTORIAL_TARGETS = {
  homeStart: "home-start",
  navTimer: "nav-timer",
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
    title: "훈련 — 지금 한다",
    body: "타이머·커리큘럼·훈련법·콤보가 여기 있습니다. 체육관 문을 여는 탭이에요.",
    mode: "spotlight",
    target: TUTORIAL_TARGETS.navTimer,
    placement: "top",
  },
  {
    id: "nav-profile",
    kicker: "NAMEPLATE",
    title: "명패 — 나는 복서다",
    body: "스펙·사진·레벨이 담긴 당신의 증명입니다. 성장과 훈련 카드도 여기서 이어집니다.",
    mode: "spotlight",
    target: TUTORIAL_TARGETS.navProfile,
    placement: "top",
  },
  {
    id: "nav-category",
    kicker: "MORE",
    title: "더보기 — 다 찾기",
    body: "기록·체육관·스파링·백업은 더보기에 모아 두었습니다. 탭을 늘리지 않고 필요할 때 찾으면 됩니다.",
    mode: "spotlight",
    target: TUTORIAL_TARGETS.navCategory,
    placement: "top",
  },
  {
    id: "finish",
    kicker: "READY",
    title: "이제 시작해 볼까요?",
    body: "홈의 오늘 버튼으로 바로 들어가거나, 훈련 탭에서 타이머를 열어보세요.",
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
