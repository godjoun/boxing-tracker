export const TUTORIAL_TARGETS = {
  homeStart: "home-start",
  navTimer: "nav-timer",
  navDojo: "nav-dojo",
  navLog: "nav-log",
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
    title: "훈련 — 오늘 움직인다",
    body: "타이머·기술·신체 훈련을 여는 곳입니다. 라운드를 끝내면 기록이 남아요.",
    mode: "spotlight",
    target: TUTORIAL_TARGETS.navTimer,
    placement: "top",
  },
  {
    id: "nav-dojo",
    kicker: "PROFILE",
    title: "프로필 — 나의 흔적",
    body: "사진·닉네임·스펙을 보고, 쌓인 라운드와 장면을 확인하는 곳입니다.",
    mode: "spotlight",
    target: TUTORIAL_TARGETS.navDojo,
    placement: "top",
  },
  {
    id: "nav-log",
    kicker: "LOG",
    title: "기록 — 한눈에 확인한다",
    body: "완료한 라운드와 수동 기록을 바로 확인합니다. 타이머 없이 운동한 날도 여기서 남겨요.",
    mode: "spotlight",
    target: TUTORIAL_TARGETS.navLog,
    placement: "top",
  },
  {
    id: "nav-category",
    kicker: "MENU",
    title: "메뉴 — 나머지를 찾는다",
    body: "커뮤니티·체육관·성장·백업 같은 보조 도구를 모아 두었습니다.",
    mode: "spotlight",
    target: TUTORIAL_TARGETS.navCategory,
    placement: "top",
  },
  {
    id: "finish",
    kicker: "READY",
    title: "이제 시작해 볼까요?",
    body: "준비가 되었습니다. 홈에서 오늘의 훈련을 시작하세요.",
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
