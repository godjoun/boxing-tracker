/**
 * 스파링 상대찾기만 성장 마일스톤으로 해금.
 * LV.7 링 도전자 — 일반인 단계에서 실전 스파링에 들어가는 문턱.
 */
export const SPARRING_UNLOCK_LEVEL = 7;

/** LV.10 일반인 정점 — 기본 커리큘럼을 마친 뒤 콤보 크리에이터 해금 */
export const COMBO_CREATOR_UNLOCK_LEVEL = 10;

export const FEATURE_UNLOCKS = [
  {
    id: "sparring",
    level: SPARRING_UNLOCK_LEVEL,
    label: "라이벌 찾기",
    description: "체급·경력 기반 스파링 매칭",
    route: "gym",
    gymView: "sparring",
    kicker: "SPARRING READY",
    cta: "훈련하러 가기",
    lockedHint: (levelsToGo) =>
      `훈련을 이어가면 ${levelsToGo}레벨 후 스파링 매칭이 열립니다.`,
  },
  {
    id: "combo-creator",
    level: COMBO_CREATOR_UNLOCK_LEVEL,
    label: "콤보 크리에이터",
    description: "잽·크로스·훅을 조합해 나만의 섀도우 루틴 만들기",
    route: "combo-creator",
    kicker: "COMBO LAB",
    cta: "기술로 훈련하기",
    lockedHint: (levelsToGo) =>
      `홈복싱 입문을 마치고 LV.${COMBO_CREATOR_UNLOCK_LEVEL}에 도달하면 콤보 크리에이터가 열립니다. ${levelsToGo}레벨 남음.`,
  },
];

export function getFeatureUnlock(featureId) {
  return FEATURE_UNLOCKS.find((feature) => feature.id === featureId) || null;
}

export function getUnlockLevel(featureId) {
  return getFeatureUnlock(featureId)?.level ?? 1;
}

export function isFeatureUnlocked(featureId, level) {
  if (!featureId) return true;

  const feature = getFeatureUnlock(featureId);
  if (!feature) return true;

  return Number(level || 1) >= feature.level;
}

export function isSparringUnlocked(level) {
  return isFeatureUnlocked("sparring", level);
}

export function isComboCreatorUnlocked(level) {
  return isFeatureUnlocked("combo-creator", level);
}

export function getFeatureUnlockProgress(featureId, level) {
  const feature = getFeatureUnlock(featureId);
  const currentLevel = Number(level || 1);
  const unlockLevel = feature?.level ?? 1;

  if (!feature || currentLevel >= unlockLevel) {
    return {
      unlocked: true,
      currentLevel,
      unlockLevel,
      progressPercent: 100,
      levelsToGo: 0,
    };
  }

  return {
    unlocked: false,
    currentLevel,
    unlockLevel,
    progressPercent: Math.round((currentLevel / unlockLevel) * 100),
    levelsToGo: unlockLevel - currentLevel,
  };
}

export function getSparringUnlockProgress(level) {
  return getFeatureUnlockProgress("sparring", level);
}

export function getComboCreatorUnlockProgress(level) {
  return getFeatureUnlockProgress("combo-creator", level);
}

export function getFeaturesUnlockedAtLevel(level) {
  return FEATURE_UNLOCKS.filter((feature) => feature.level === level);
}

export function getNextFeatureUnlock(level) {
  const current = Number(level || 1);
  return (
    FEATURE_UNLOCKS.find((feature) => current < feature.level) || null
  );
}
