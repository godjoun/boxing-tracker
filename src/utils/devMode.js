import {
  getCumulativeExpForLevel,
  getFighterLevel,
  getTotalExp,
} from "./fighterProgress";

export const DEV_USER_ID = "dev-local-user";
export const DEV_LEVEL_BOOST_LOG_ID = "dev-level-boost";

export const DEV_DEFAULT_PROFILE = {
  nickname: "개발자",
  bio: "개발 모드 테스트 계정",
  heightCm: 175,
  weightKg: 70,
  reachCm: 178,
  weightClass: "라이트급",
  experience: "1년차",
  area: "로컬",
  onboardingComplete: true,
};

export function isDevMode() {
  return import.meta.env.DEV;
}

export function getDevUserId() {
  return isDevMode() ? DEV_USER_ID : null;
}

function buildLevelBoostLog(targetLevel, boostScore) {
  const now = new Date().toISOString();

  return {
    id: DEV_LEVEL_BOOST_LOG_ID,
    date: now.slice(0, 10),
    type: "개발 부스트",
    minutes: 0,
    duration: 0,
    rounds: 0,
    totalRounds: 0,
    completedRounds: 0,
    difficulty: "normal",
    difficultyLabel: "보통",
    condition: "normal",
    conditionLabel: "보통",
    memo: `개발 모드 LV.${targetLevel} 부스트`,
    publicComment: "",
    source: "dev",
    sourceLabel: "개발",
    isEdited: false,
    score: boostScore,
    createdAt: now,
    updatedAt: now,
  };
}

export function applyLevelBoost(logs = [], targetLevel = 10) {
  const safeLevel = Math.max(1, Math.floor(Number(targetLevel) || 10));
  const otherLogs = logs.filter((log) => log.id !== DEV_LEVEL_BOOST_LOG_ID);
  const targetExp = getCumulativeExpForLevel(safeLevel);
  const currentExp = getTotalExp(otherLogs);
  const boostScore = Math.max(0, targetExp - currentExp);
  const nextTotal = currentExp + boostScore;

  if (boostScore === 0 && getFighterLevel(nextTotal) >= safeLevel) {
    return logs;
  }

  return [buildLevelBoostLog(safeLevel, boostScore), ...otherLogs];
}
