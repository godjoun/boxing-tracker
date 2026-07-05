// 프로 복싱 체급표 (상한 체중 kg 기준)
export const PRO_BOXING_WEIGHT_CLASSES = [
  { id: "미니 플라이급", maxKg: 47.6, displayKg: "47.60kg 이하" },
  { id: "라이트 플라이급", maxKg: 48.98, displayKg: "48.98kg" },
  { id: "플라이급", maxKg: 50.8, displayKg: "50.80kg" },
  { id: "슈퍼 플라이급", maxKg: 52.16, displayKg: "52.16kg" },
  { id: "밴텀급", maxKg: 53.52, displayKg: "53.52kg" },
  { id: "슈퍼 밴텀급", maxKg: 55.34, displayKg: "55.34kg" },
  { id: "페더급", maxKg: 57.15, displayKg: "57.15kg" },
  { id: "슈퍼 페더급", maxKg: 58.97, displayKg: "58.97kg" },
  { id: "라이트급", maxKg: 61.23, displayKg: "61.23kg" },
  { id: "슈퍼 라이트급", maxKg: 63.5, displayKg: "63.50kg" },
  { id: "웰터급", maxKg: 66.68, displayKg: "66.68kg" },
  { id: "슈퍼 웰터급", maxKg: 69.85, displayKg: "69.85kg" },
  { id: "미들급", maxKg: 72.57, displayKg: "72.57kg" },
  { id: "슈퍼 미들급", maxKg: 76.2, displayKg: "76.20kg" },
  { id: "라이트 헤비급", maxKg: 79.3, displayKg: "79.30kg" },
  { id: "크루저급", maxKg: 86, displayKg: "86.00kg 이하" },
  { id: "헤비급", minKg: 86, displayKg: "86.00kg 이상" },
];

export const WEIGHT_CLASS_ANY = "상관없음";

const LEGACY_WEIGHT_CLASS_MAP = {
  벤텀급: "밴텀급",
  라이트헤비: "라이트 헤비급",
  "라이트헤비급": "라이트 헤비급",
};

export const WEIGHT_CLASSES = [
  ...PRO_BOXING_WEIGHT_CLASSES.map((item) => item.id),
  WEIGHT_CLASS_ANY,
];

export function normalizeWeightClass(weightClass) {
  if (!weightClass) return "라이트급";

  return LEGACY_WEIGHT_CLASS_MAP[weightClass] || weightClass;
}

export function formatWeightClassOption(weightClass) {
  const normalized = normalizeWeightClass(weightClass);

  if (normalized === WEIGHT_CLASS_ANY) {
    return "상관없음 (체급 무관)";
  }

  const found = PRO_BOXING_WEIGHT_CLASSES.find((item) => item.id === normalized);

  if (!found) {
    return normalized;
  }

  return `${found.id} (${found.displayKg})`;
}

export function getWeightClassDisplayKg(weightClass) {
  const normalized = normalizeWeightClass(weightClass);
  const found = PRO_BOXING_WEIGHT_CLASSES.find((item) => item.id === normalized);

  return found?.displayKg || null;
}

export function suggestWeightClass(weightKg) {
  const weight = Number(weightKg);

  if (!Number.isFinite(weight) || weight <= 0) {
    return "라이트급";
  }

  if (weight > 86) {
    return "헤비급";
  }

  for (const weightClass of PRO_BOXING_WEIGHT_CLASSES) {
    if (weightClass.id === "헤비급") {
      continue;
    }

    if (weight <= weightClass.maxKg) {
      return weightClass.id;
    }
  }

  return "크루저급";
}

export function isValidWeightClass(weightClass) {
  return WEIGHT_CLASSES.includes(normalizeWeightClass(weightClass));
}
