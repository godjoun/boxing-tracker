/**
 * 복싱 커리어 칭호 — 마일스톤 LV에서만 새 칭호 획득.
 * 레벨은 자주 오르지만, 칭호는 희귀하게 유지된다.
 */
export const MAX_FIGHTER_LEVEL = 100;

const CAREER_STAGE_RANGES = [
  { from: 1, to: 15, stageKo: "일반인", stageEn: "CIVILIAN" },
  { from: 16, to: 35, stageKo: "아마추어", stageEn: "AMATEUR" },
  { from: 36, to: 50, stageKo: "세미프로", stageEn: "SEMI-PRO" },
  { from: 51, to: 75, stageKo: "프로", stageEn: "PROFESSIONAL" },
  { from: 76, to: 95, stageKo: "챔피언", stageEn: "CHAMPION" },
  { from: 96, to: 100, stageKo: "레전드", stageEn: "LEGEND" },
];

/** 획득 가능한 칭호 — 총 22개 / LV.100 */
export const TITLE_MILESTONES = [
  {
    level: 1,
    ko: "일반인",
    en: "CIVILIAN",
    flavor: "모두의 출발점이지만, 여기서 버틴 사람은 많지 않다",
  },
  {
    level: 5,
    ko: "복싱 입문",
    en: "BOXING STARTER",
    flavor: "링 바깥에서 복싱을 선택한 소수",
  },
  {
    level: 7,
    ko: "링 도전자",
    en: "RING ASPIRANT",
    flavor: "스파링 무대에 설 자격을 얻었다",
  },
  {
    level: 10,
    ko: "일반인 정점",
    en: "TOP CIVILIAN",
    flavor: "일반인 단계의 마지막 문턱을 넘었다",
  },
  {
    level: 16,
    ko: "아마추어 입문",
    en: "AMATEUR ENTRANT",
    flavor: "공식 아마추어 무대에 들어섰다",
  },
  {
    level: 20,
    ko: "아마추어 선수",
    en: "AMATEUR FIGHTER",
    flavor: "체육관에서 이름을 알리기 시작했다",
  },
  {
    level: 25,
    ko: "아마추어 랭커",
    en: "AMATEUR RANKED",
    flavor: "동급 중에서도 위로 올라선 소수",
  },
  {
    level: 30,
    ko: "아마추어 챔피언",
    en: "AMATEUR CHAMP",
    flavor: "아마추어 무대의 상위권",
  },
  {
    level: 35,
    ko: "프로 입성 준비",
    en: "TURNING PRO",
    flavor: "프로의 문 앞까지 왔다",
  },
  {
    level: 36,
    ko: "세미프로",
    en: "SEMI-PRO",
    flavor: "프로 데뷔를 앞둔 전환기",
  },
  {
    level: 40,
    ko: "루키 프로",
    en: "ROOKIE PRO",
    flavor: "유급 경기의 문을 두드리는 단계",
  },
  {
    level: 45,
    ko: "세미프로 에이스",
    en: "SEMI-PRO ACE",
    flavor: "세미프로 무대의 대표급",
  },
  {
    level: 50,
    ko: "세미프로 정점",
    en: "TOP SEMI-PRO",
    flavor: "세미프로 단계의 마지막 문턱",
  },
  {
    level: 51,
    ko: "프로 데뷔",
    en: "PRO DEBUT",
    flavor: "복싱이 직업이 된 날",
  },
  {
    level: 60,
    ko: "프로 랭커",
    en: "PRO RANKED",
    flavor: "랭킹에 이름을 올린 프로",
  },
  {
    level: 70,
    ko: "프로 컨텐더",
    en: "PRO CONTENDER",
    flavor: "타이틀 전을 앞둔 프로",
  },
  {
    level: 75,
    ko: "프로 정점",
    en: "PEAK PROFESSIONAL",
    flavor: "프로 커리어의 정상부",
  },
  {
    level: 80,
    ko: "챔피언 도전자",
    en: "CHAMPION CONTENDER",
    flavor: "벨트를 향한 마지막 도전",
  },
  {
    level: 85,
    ko: "챔피언",
    en: "CHAMPION",
    flavor: "체급의 정상에 선 소수",
  },
  {
    level: 90,
    ko: "P4P",
    en: "POUND FOR POUND",
    flavor: "체급을 넘어 강함을 인정받았다",
  },
  {
    level: 95,
    ko: "명예의 전당급",
    en: "HALL OF FAME",
    flavor: "이름이 남는 단계",
  },
  {
    level: 100,
    ko: "복싱 GOAT",
    en: "BOXING GOAT",
    flavor: "백 단계 정점, 극소수만 도달",
  },
];

const MILESTONE_BY_LEVEL = new Map(
  TITLE_MILESTONES.map((title) => [title.level, title])
);

function clampLevel(level) {
  return Math.min(
    MAX_FIGHTER_LEVEL,
    Math.max(1, Math.floor(Number(level) || 1))
  );
}

export function getCareerStage(level) {
  const safeLevel = clampLevel(level);

  return (
    CAREER_STAGE_RANGES.find(
      (stage) => safeLevel >= stage.from && safeLevel <= stage.to
    ) || CAREER_STAGE_RANGES[0]
  );
}

export function isTitleMilestoneLevel(level) {
  return MILESTONE_BY_LEVEL.has(clampLevel(level));
}

export function getTitleAwardedAtLevel(level) {
  const milestone = MILESTONE_BY_LEVEL.get(clampLevel(level));

  if (!milestone) {
    return null;
  }

  const stage = getCareerStage(milestone.level);

  return {
    ...milestone,
    stageKo: stage.stageKo,
    stageEn: stage.stageEn,
  };
}

export function getNextTitleMilestone(level) {
  const safeLevel = clampLevel(level);
  const next = TITLE_MILESTONES.find((title) => title.level > safeLevel);

  if (!next) {
    return null;
  }

  const stage = getCareerStage(next.level);

  return {
    ...next,
    stageKo: stage.stageKo,
    stageEn: stage.stageEn,
  };
}

export function getLevelTitle(level) {
  const safeLevel = clampLevel(level);
  const stage = getCareerStage(safeLevel);
  const milestone = [...TITLE_MILESTONES]
    .reverse()
    .find((title) => title.level <= safeLevel);

  if (!milestone) {
    return {
      ...TITLE_MILESTONES[0],
      level: safeLevel,
      stageKo: stage.stageKo,
      stageEn: stage.stageEn,
    };
  }

  return {
    ...milestone,
    level: safeLevel,
    stageKo: stage.stageKo,
    stageEn: stage.stageEn,
  };
}

export function getFighterTitleKo(level) {
  return getLevelTitle(level).ko;
}

export function getFighterTitleEn(level) {
  return getLevelTitle(level).en;
}

export function getEquippedMilestoneLevel(level) {
  const safeLevel = clampLevel(level);
  const milestone = [...TITLE_MILESTONES]
    .reverse()
    .find((title) => title.level <= safeLevel);

  return milestone?.level ?? TITLE_MILESTONES[0].level;
}

export function getTitleCollection(currentLevel) {
  const safeLevel = clampLevel(currentLevel);
  const equippedLevel = getEquippedMilestoneLevel(safeLevel);
  const next = getNextTitleMilestone(safeLevel);

  return TITLE_MILESTONES.map((milestone) => {
    const unlocked = safeLevel >= milestone.level;
    const isCurrent = milestone.level === equippedLevel;
    const isNext = next?.level === milestone.level;
    const stage = getCareerStage(milestone.level);

    let status = "locked";

    if (isCurrent) {
      status = "current";
    } else if (unlocked) {
      status = "unlocked";
    } else if (isNext) {
      status = "next";
    }

    return {
      ...milestone,
      stageKo: stage.stageKo,
      stageEn: stage.stageEn,
      unlocked,
      isCurrent,
      isNext,
      status,
    };
  });
}
