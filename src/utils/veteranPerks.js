/**
 * 장기·상위권 파이터 혜택 — 커리어 마일스톤에서 해금.
 * 기존 기능은 막지 않고, 베테랑 전용 보상을 추가한다.
 */
import { MAX_FIGHTER_LEVEL } from "./fighterTitles";

export const VETERAN_PERKS = [
  {
    id: "amateur_badge",
    level: 16,
    kind: "badge",
    label: "아마추어 인증",
    description: "명패에 아마추어 인증 배지가 표시됩니다.",
    badgeLabel: "AMATEUR",
  },
  {
    id: "card_semipro",
    level: 36,
    kind: "card_filter",
    filterId: "semipro",
    label: "세미프로 카드",
    description: "세미프로 전용 링 골드 카드 필터가 해금됩니다.",
  },
  {
    id: "pro_badge",
    level: 51,
    kind: "badge",
    label: "프로 인증",
    description:
      "명패·스파링 모집글에 프로 배지가 표시되고, 상대 찾기에서 우선 노출됩니다.",
    badgeLabel: "PRO",
  },
  {
    id: "card_champion",
    level: 76,
    kind: "card_filter",
    filterId: "champion",
    label: "챔피언 카드",
    description: "챔피언 구간 전용 벨트 골드 필터가 해금됩니다.",
  },
  {
    id: "champion_frame",
    level: 85,
    kind: "frame",
    label: "챔피언 명패",
    description: "명패 골드 테두리가 강화됩니다.",
  },
  {
    id: "card_goat",
    level: 100,
    kind: "card_filter",
    filterId: "goat",
    label: "GOAT 카드",
    description: "백 단계 정점만 쓸 수 있는 전설 카드 필터.",
  },
  {
    id: "hall_of_fame",
    level: 100,
    kind: "badge",
    label: "명예의 전당",
    description: "레전드 인증 배지가 영구 표시됩니다.",
    badgeLabel: "GOAT",
  },
];

function clampLevel(level) {
  return Math.min(
    MAX_FIGHTER_LEVEL,
    Math.max(1, Math.floor(Number(level) || 1))
  );
}

export function isVeteranPerkUnlocked(perkId, level) {
  const perk = VETERAN_PERKS.find((item) => item.id === perkId);
  if (!perk) return false;

  return clampLevel(level) >= perk.level;
}

export function getVeteranPerkCollection(currentLevel) {
  const safeLevel = clampLevel(currentLevel);
  const next = getNextVeteranPerk(safeLevel);

  return VETERAN_PERKS.map((perk) => {
    const unlocked = safeLevel >= perk.level;
    const isNext = next?.id === perk.id;

    let status = "locked";

    if (unlocked) {
      status = "unlocked";
    } else if (isNext) {
      status = "next";
    }

    return {
      ...perk,
      unlocked,
      isNext,
      status,
    };
  });
}

export function getUnlockedVeteranPerks(level) {
  const safeLevel = clampLevel(level);

  return VETERAN_PERKS.filter((perk) => safeLevel >= perk.level);
}

export function getNextVeteranPerk(level) {
  const safeLevel = clampLevel(level);

  return VETERAN_PERKS.find((perk) => perk.level > safeLevel) || null;
}

export function getVeteranBadges(level) {
  return getUnlockedVeteranPerks(level)
    .filter((perk) => perk.kind === "badge" && perk.badgeLabel)
    .map((perk) => perk.badgeLabel);
}

export function getNameplateTier(level) {
  const safeLevel = clampLevel(level);

  if (safeLevel >= 100) return "goat";
  if (safeLevel >= 85) return "champion-gold";
  if (safeLevel >= 76) return "champion";
  if (safeLevel >= 51) return "pro";
  if (safeLevel >= 16) return "amateur";

  return "base";
}

export function getUnlockedVeteranFilterIds(level) {
  return getUnlockedVeteranPerks(level)
    .filter((perk) => perk.kind === "card_filter" && perk.filterId)
    .map((perk) => perk.filterId);
}

export function isVeteranFilterUnlocked(filterId, level) {
  if (!filterId) return true;

  const perk = VETERAN_PERKS.find(
    (item) => item.kind === "card_filter" && item.filterId === filterId
  );

  if (!perk) return true;

  return clampLevel(level) >= perk.level;
}

export function getVeteranFilterUnlockLevel(filterId) {
  const perk = VETERAN_PERKS.find(
    (item) => item.kind === "card_filter" && item.filterId === filterId
  );

  return perk?.level ?? null;
}

export const SPARRING_PRIORITY_LEVEL = 51;

export function getSparringPriorityBoostKm(level) {
  const safeLevel = clampLevel(level);

  if (safeLevel >= 100) return 2;
  if (safeLevel >= 76) return 1.5;
  if (safeLevel >= SPARRING_PRIORITY_LEVEL) return 0.8;

  return 0;
}

export function hasSparringPriority(level) {
  return clampLevel(level) >= SPARRING_PRIORITY_LEVEL;
}

export function getSparringEffectiveDistanceKm(partner) {
  const distanceKm = Math.max(0, Number(partner?.distanceKm) || 0);
  const boostKm = getSparringPriorityBoostKm(partner?.fighterLevel);

  return Math.max(0, distanceKm - boostKm);
}

export function enrichSparringPartner(partner, fighterLevel) {
  const safeLevel = clampLevel(
    fighterLevel ?? partner?.fighterLevel ?? partner?.level ?? 1
  );

  return {
    ...partner,
    fighterLevel: safeLevel,
    veteranBadges: getVeteranBadges(safeLevel),
    sparringPriorityBoostKm: getSparringPriorityBoostKm(safeLevel),
    hasSparringPriority: hasSparringPriority(safeLevel),
  };
}

export function sortSparringPartners(partners = []) {
  return [...partners].sort((a, b) => {
    if (a.isMine) return -1;
    if (b.isMine) return 1;

    const distanceDiff =
      getSparringEffectiveDistanceKm(a) - getSparringEffectiveDistanceKm(b);

    if (distanceDiff !== 0) {
      return distanceDiff;
    }

    return (Number(a.distanceKm) || 0) - (Number(b.distanceKm) || 0);
  });
}
