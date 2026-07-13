const SAVED_COMBOS_KEY = "fitness-league-saved-combos";

export const MOVE_GROUPS = [
  {
    id: "basic",
    label: "기본",
    moves: [
      { id: "jab", label: "잽", short: "J", combo: "잽" },
      { id: "cross", label: "크로스", short: "C", combo: "크로스" },
      { id: "lead-hook", label: "리드 훅", short: "LH", combo: "리드 훅" },
      { id: "rear-hook", label: "리어 훅", short: "RH", combo: "리어 훅" },
      { id: "lead-upper", label: "리드 어퍼", short: "LU", combo: "리드 어퍼" },
      { id: "rear-upper", label: "리어 어퍼", short: "RU", combo: "리어 어퍼" },
      { id: "overhand", label: "오버핸드", short: "OH", combo: "오버핸드" },
    ],
  },
  {
    id: "power",
    label: "파워",
    moves: [
      { id: "power-jab", label: "파워 잽", short: "PJ", combo: "파워 잽" },
      { id: "power-cross", label: "파워 크로스", short: "PC", combo: "파워 크로스" },
      { id: "power-hook", label: "파워 훅", short: "PH", combo: "파워 훅" },
      { id: "power-upper", label: "파워 어퍼", short: "PU", combo: "파워 어퍼" },
      { id: "overhand-hook", label: "오버핸드 훅", short: "OHH", combo: "오버핸드 훅" },
    ],
  },
  {
    id: "body",
    label: "바디",
    moves: [
      { id: "light-body", label: "라이트 바디", short: "ltB", combo: "라이트 바디" },
      { id: "left-body", label: "레프트 바디", short: "LBd", combo: "레프트 바디" },
      { id: "right-body", label: "리어 바디", short: "RBd", combo: "리어 바디" },
      { id: "body-jab", label: "바디 잽", short: "BJ", combo: "바디 잽" },
      { id: "body-cross", label: "바디 크로스", short: "BC", combo: "바디 크로스" },
      { id: "body-hook", label: "바디 훅", short: "BH", combo: "바디 훅" },
    ],
  },
  {
    id: "defense",
    label: "디펜스·풋워크",
    moves: [
      { id: "slip", label: "슬립", short: "S", combo: "슬립" },
      { id: "roll", label: "롤", short: "R", combo: "롤" },
      { id: "duck", label: "덕", short: "D", combo: "덕" },
      { id: "parry", label: "패리", short: "P", combo: "패리" },
      { id: "step", label: "스텝", short: "ST", combo: "스텝" },
      { id: "pivot", label: "피벗", short: "PV", combo: "피벗" },
    ],
  },
];

/** flat list for lookup / legacy imports */
export const PUNCH_MOVES = MOVE_GROUPS.flatMap((group) => group.moves);

const MOVE_LOOKUP = new Map();

for (const move of PUNCH_MOVES) {
  MOVE_LOOKUP.set(move.id, move);
  MOVE_LOOKUP.set(move.short.toLowerCase(), move);
  MOVE_LOOKUP.set(move.short, move);
  MOVE_LOOKUP.set(move.label, move);
  MOVE_LOOKUP.set(move.label.replace(/\s/g, ""), move);
  MOVE_LOOKUP.set(move.combo, move);
}

MOVE_LOOKUP.set("파워잽", MOVE_LOOKUP.get("power-jab"));
MOVE_LOOKUP.set("pj", MOVE_LOOKUP.get("power-jab"));
MOVE_LOOKUP.set("right-body", MOVE_LOOKUP.get("right-body"));
MOVE_LOOKUP.set("오른바디", MOVE_LOOKUP.get("right-body"));
MOVE_LOOKUP.set("왼바디", MOVE_LOOKUP.get("left-body"));
MOVE_LOOKUP.set("가볍게바디", MOVE_LOOKUP.get("light-body"));
MOVE_LOOKUP.set("오버핸드훅", MOVE_LOOKUP.get("overhand-hook"));
MOVE_LOOKUP.set("ohh", MOVE_LOOKUP.get("overhand-hook"));
MOVE_LOOKUP.set("2", MOVE_LOOKUP.get("cross"));
MOVE_LOOKUP.set("투", MOVE_LOOKUP.get("cross"));
MOVE_LOOKUP.set("l바디", MOVE_LOOKUP.get("left-body"));
MOVE_LOOKUP.set("L바디", MOVE_LOOKUP.get("left-body"));

export function createCustomMove(token) {
  const label = String(token || "").trim();
  if (!label) return null;

  return {
    id: `custom-${label}-${Date.now()}`,
    label,
    short: label.slice(0, 4).toUpperCase(),
    combo: label,
    isCustom: true,
  };
}

export function parseComboInput(text, { allowCustom = true } = {}) {
  const trimmed = String(text || "").trim();
  if (!trimmed) {
    return { moves: [], errors: [] };
  }

  const tokens = trimmed.split(/[\s,\-→+]+/).filter(Boolean);
  const moves = [];
  const errors = [];

  for (const token of tokens) {
    const normalized = token.trim();
    if (!normalized) continue;

    const move =
      MOVE_LOOKUP.get(normalized) ||
      MOVE_LOOKUP.get(normalized.toLowerCase()) ||
      MOVE_LOOKUP.get(normalized.replace(/\s/g, ""));

    if (move) {
      moves.push(move);
      continue;
    }

    if (allowCustom) {
      const customMove = createCustomMove(normalized);
      if (customMove) {
        moves.push(customMove);
        continue;
      }
    }

    errors.push(normalized);
  }

  return { moves, errors };
}

export function formatComboChain(moves) {
  if (!Array.isArray(moves) || moves.length === 0) return "";

  return moves.map((move) => move.combo || move.label).join(" → ");
}

export function formatComboNotation(moves) {
  if (!Array.isArray(moves) || moves.length === 0) return "";

  return moves.map((move) => move.short).join("-");
}

function resolveMoves(movesOrPreset) {
  if (Array.isArray(movesOrPreset) && movesOrPreset[0]?.moves) {
    return movesOrPreset.flatMap((zone) =>
      Array.isArray(zone.moves) ? zone.moves : []
    );
  }

  return Array.isArray(movesOrPreset) ? movesOrPreset : [];
}

export function buildComboDrill(name, movesOrZones, rounds = 4) {
  const moves = resolveMoves(movesOrZones);
  const chain = formatComboChain(moves);
  const notation = formatComboNotation(moves);

  return {
    id: `combo-${Date.now()}`,
    title: name || `콤보 · ${notation}`,
    goal: `${notation} 콤보 반복`,
    rounds,
    workSeconds: 120,
    restSeconds: 30,
    isCustom: true,
    code: "COMBO",
    drills: [
      {
        name: "워밍업",
        duration: "3분",
        description: "가벼운 섀도우로 어깨와 손목을 푸십시오.",
      },
      {
        name: name || notation,
        duration: "라운드당",
        description: chain,
        combos: notation ? [notation] : [],
      },
      {
        name: "쿨다운",
        duration: "3분",
        description: "호흡을 고르고 어깨를 스트레칭하십시오",
      },
    ],
  };
}

function readSavedCombos() {
  try {
    const raw = localStorage.getItem(SAVED_COMBOS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getSavedCombos() {
  return readSavedCombos();
}

export function saveComboPreset({ name, moves, zones, rounds = 4 }) {
  const resolvedMoves = resolveMoves(zones || moves);
  const notation = formatComboNotation(resolvedMoves);
  const preset = {
    id: `combo-preset-${Date.now()}`,
    name: name || notation,
    moves: resolvedMoves,
    notation,
    chain: formatComboChain(resolvedMoves),
    rounds,
    savedAt: new Date().toISOString(),
  };

  const next = [preset, ...readSavedCombos()].slice(0, 12);
  localStorage.setItem(SAVED_COMBOS_KEY, JSON.stringify(next));
  return preset;
}

export function deleteComboPreset(presetId) {
  const next = readSavedCombos().filter((preset) => preset.id !== presetId);
  localStorage.setItem(SAVED_COMBOS_KEY, JSON.stringify(next));
  return next;
}

export function comboPresetToSession(preset) {
  return buildComboDrill(
    preset.name,
    preset.moves || preset.zones,
    preset.rounds
  );
}
