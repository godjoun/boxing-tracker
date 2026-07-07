const SAVED_COMBOS_KEY = "fitness-league-saved-combos";

export const PUNCH_MOVES = [
  { id: "jab", label: "잽", short: "J", combo: "잽" },
  { id: "cross", label: "크로스", short: "C", combo: "크로스" },
  { id: "lead-hook", label: "리드 훅", short: "LH", combo: "리드 훅" },
  { id: "rear-hook", label: "리어 훅", short: "RH", combo: "리어 훅" },
  { id: "lead-upper", label: "리드 어퍼", short: "LU", combo: "리드 어퍼" },
  { id: "rear-upper", label: "리어 어퍼", short: "RU", combo: "리어 어퍼" },
  { id: "slip", label: "슬립", short: "S", combo: "슬립" },
  { id: "roll", label: "롤", short: "R", combo: "롤" },
  { id: "step", label: "스텝", short: "ST", combo: "스텝" },
];

export function formatComboChain(moves) {
  if (!Array.isArray(moves) || moves.length === 0) return "";

  return moves.map((move) => move.combo || move.label).join(" → ");
}

export function formatComboNotation(moves) {
  if (!Array.isArray(moves) || moves.length === 0) return "";

  return moves.map((move) => move.short).join("-");
}

export function buildComboDrill(name, moves, rounds = 4) {
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
        combos: [notation],
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

export function saveComboPreset({ name, moves, rounds = 4 }) {
  const notation = formatComboNotation(moves);
  const preset = {
    id: `combo-preset-${Date.now()}`,
    name: name || notation,
    moves,
    notation,
    chain: formatComboChain(moves),
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
  return buildComboDrill(preset.name, preset.moves, preset.rounds);
}
