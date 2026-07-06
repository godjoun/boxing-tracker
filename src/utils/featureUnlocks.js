/**
 * 스파링 상대찾기만 성장 마일스톤으로 해금.
 * LV.7 링 도전자 — 일반인 단계에서 실전 스파링에 들어가는 문턱.
 */
export const SPARRING_UNLOCK_LEVEL = 7;

export const FEATURE_UNLOCKS = [
  {
    id: "sparring",
    level: SPARRING_UNLOCK_LEVEL,
    label: "스파링 상대찾기",
    description: "체급·경력 기반 스파링 매칭",
    route: "gym",
    gymView: "sparring",
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

export function getSparringUnlockProgress(level) {
  const currentLevel = Number(level || 1);
  const unlockLevel = SPARRING_UNLOCK_LEVEL;

  if (currentLevel >= unlockLevel) {
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

export function getFeaturesUnlockedAtLevel(level) {
  return FEATURE_UNLOCKS.filter((feature) => feature.level === level);
}

export function getNextFeatureUnlock(level) {
  const current = Number(level || 1);
  if (current >= SPARRING_UNLOCK_LEVEL) return null;
  return FEATURE_UNLOCKS[0];
}
