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
    title: "3R 바로 시작",
    body: "홈에서 바로 타이머를 켤 수 있어요. 아래 레벨업 메뉴에서 커리큘럼·훈련법도 골라볼 수 있습니다.",
    hint: "복싱 한 세트 = 1라운드(R)",
    mode: "spotlight",
    target: TUTORIAL_TARGETS.homeStart,
    placement: "top",
    ensurePage: "home",
  },
  {
    id: "nav-timer",
    kicker: "LEVEL UP",
    title: "레벨업 탭",
    body: "훈련을 완료하면 EXP가 쌓이고 레벨이 올라요. 타이머·커리큘럼·훈련법 추천을 여기서 고를 수 있습니다.",
    mode: "spotlight",
    target: TUTORIAL_TARGETS.navTimer,
    placement: "top",
  },
  {
    id: "nav-category",
    kicker: "MORE",
    title: "더보기 메뉴",
    body: "파이터 카드·체육관 찾기·데이터 백업이 여기 있습니다. 앱 사용법은 튜토리얼로 다시 볼 수 있어요.",
    mode: "spotlight",
    target: TUTORIAL_TARGETS.navCategory,
    placement: "top",
  },
  {
    id: "nav-log",
    kicker: "GROWTH",
    title: "기록 · 성장",
    body: "훈련하면 기록 탭에 라운드가 쌓이고 EXP로 레벨이 올라요. 성장 탭에서 분석·여정·칭호도 확인하세요.",
    mode: "spotlight",
    target: TUTORIAL_TARGETS.navLog,
    placement: "top",
    secondaryTarget: TUTORIAL_TARGETS.navJourney,
  },
  {
    id: "finish",
    kicker: "READY",
    title: "이제 시작해 볼까요?",
    body: "타이머로 바로 훈련하거나, 레벨업 탭에서 커리큘럼 DAY 1부터 따라가도 좋아요.",
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
