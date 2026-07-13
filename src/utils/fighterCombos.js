import { PUNCH_MOVES, formatComboChain, formatComboNotation } from "./comboCreator";

const MOVE_BY_ID = new Map(PUNCH_MOVES.map((move) => [move.id, move]));

function resolveMoveIds(ids = []) {
  return ids.map((id) => MOVE_BY_ID.get(id)).filter(Boolean);
}

/**
 * 선수 시그니처 콤보 — 홈복싱 연습용 단순화 버전.
 * 실제 경기 콤보를 초보가 따라 하기 쉽게 줄인 프리셋입니다.
 */
export const FIGHTER_COMBO_LIBRARY = [
  {
    id: "mayweather",
    name: "플로이드 메이웨더",
    nameEn: "Mayweather",
    style: "디펜스 · 카운터",
    combos: [
      {
        id: "mayweather-1",
        title: "체크 훅 셋업",
        moves: ["jab", "jab", "slip", "lead-hook"],
        note: "잽으로 거리를 재고 슬립 후 리드 훅",
      },
      {
        id: "mayweather-2",
        title: "숄더 롤 카운터",
        moves: ["parry", "roll", "cross"],
        note: "패리·롤 후 바로 크로스",
      },
      {
        id: "mayweather-3",
        title: "바디 후 헤드",
        moves: ["body-jab", "body-cross", "lead-hook"],
        note: "바디를 먼저 준 뒤 헤드로 올림",
      },
    ],
  },
  {
    id: "pacquiao",
    name: "매니 파퀴아오",
    nameEn: "Pacquiao",
    style: "스피드 · 앵글",
    combos: [
      {
        id: "pacquiao-1",
        title: "더블 잽 · 크로스",
        moves: ["jab", "jab", "cross"],
        note: "빠른 1-1-2",
      },
      {
        id: "pacquiao-2",
        title: "사우스퍼 훅",
        moves: ["jab", "lead-hook", "cross", "lead-hook"],
        note: "잽 후 훅·크로스·훅 연타",
      },
      {
        id: "pacquiao-3",
        title: "피벗 탈출",
        moves: ["cross", "lead-hook", "pivot"],
        note: "공격 후 피벗으로 각도 변경",
      },
    ],
  },
  {
    id: "tyson",
    name: "마이크 타이슨",
    nameEn: "Tyson",
    style: "피크어부 · 파워",
    combos: [
      {
        id: "tyson-1",
        title: "바디 · 헤드 훅",
        moves: ["left-body", "lead-hook", "rear-upper"],
        note: "바디 훅 → 헤드 훅 → 어퍼",
      },
      {
        id: "tyson-2",
        title: "피크어부 진입",
        moves: ["duck", "lead-hook", "rear-hook"],
        note: "덕 후 양 훅",
      },
      {
        id: "tyson-3",
        title: "파워 피니시",
        moves: ["jab", "power-cross", "power-hook"],
        note: "잽으로 열고 파워로 마무리",
      },
    ],
  },
  {
    id: "canelo",
    name: "카넬로 알바레스",
    nameEn: "Canelo",
    style: "바디 · 미들",
    combos: [
      {
        id: "canelo-1",
        title: "바디 크로스 시그니처",
        moves: ["jab", "body-cross", "lead-hook"],
        note: "잽 후 리어 바디 크로스",
      },
      {
        id: "canelo-2",
        title: "체크 훅",
        moves: ["step", "lead-hook", "cross"],
        note: "스텝 아웃하며 훅·크로스",
      },
      {
        id: "canelo-3",
        title: "라이트 바디 레이어",
        moves: ["light-body", "left-body", "cross"],
        note: "가벼운 바디 → 레프트 바디 → 크로스",
      },
    ],
  },
  {
    id: "inoue",
    name: "이노우에 나오야",
    nameEn: "Inoue",
    style: "클린 · 밸런스",
    combos: [
      {
        id: "inoue-butler",
        title: "버틀러전 피니시",
        moves: ["jab", "jab", "cross", "left-body", "overhand-hook"],
        note: "폴 버틀러전 · 잽-잽-투-L바디-오버핸드 훅",
      },
      {
        id: "inoue-1",
        title: "원투 · 훅",
        moves: ["jab", "cross", "lead-hook"],
        note: "기본 1-2-3",
      },
      {
        id: "inoue-2",
        title: "바디 오프닝",
        moves: ["body-jab", "cross", "lead-upper"],
        note: "바디 잽으로 열어 크로스·어퍼",
      },
      {
        id: "inoue-3",
        title: "슬립 카운터",
        moves: ["slip", "cross", "lead-hook"],
        note: "슬립 후 카운터 2타",
      },
    ],
  },
  {
    id: "loma",
    name: "바실리 로마첸코",
    nameEn: "Lomachenko",
    style: "풋워크 · 앵글",
    combos: [
      {
        id: "loma-1",
        title: "스텝 아웃 1-2",
        moves: ["jab", "cross", "step", "lead-hook"],
        note: "원투 후 스텝·훅",
      },
      {
        id: "loma-2",
        title: "피벗 연속",
        moves: ["jab", "pivot", "cross", "lead-hook"],
        note: "피벗으로 각도 만들어 공격",
      },
      {
        id: "loma-3",
        title: "롤 후 바디",
        moves: ["roll", "left-body", "cross"],
        note: "롤 후 바디·헤드",
      },
    ],
  },
];

export function getFighterLibrary() {
  return FIGHTER_COMBO_LIBRARY.map((fighter) => ({
    ...fighter,
    combos: fighter.combos.map((combo) => {
      const moves = resolveMoveIds(combo.moves);
      return {
        ...combo,
        moves,
        notation: formatComboNotation(moves),
        chain: formatComboChain(moves),
      };
    }),
  }));
}

export function getFavoriteFighterIds() {
  try {
    const raw = localStorage.getItem("fitness-league-favorite-fighters");
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function toggleFavoriteFighter(fighterId) {
  const current = getFavoriteFighterIds();
  const next = current.includes(fighterId)
    ? current.filter((id) => id !== fighterId)
    : [...current, fighterId];

  localStorage.setItem(
    "fitness-league-favorite-fighters",
    JSON.stringify(next)
  );

  return next;
}
