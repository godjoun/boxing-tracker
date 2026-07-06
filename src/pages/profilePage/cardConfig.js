export const CARD_FILTERS = [
  {
    id: "levelup",
    name: "LEVEL UP GOLD",
    description: "사진 위에 레벨업 카드 느낌",
  },
  {
    id: "red",
    name: "RED CORNER",
    description: "빨간 링 코너 느낌",
  },
  {
    id: "dark",
    name: "DARK GYM",
    description: "어두운 체육관 느낌",
  },
  {
    id: "gold",
    name: "CHAMPION GOLD",
    description: "승리 카드 느낌",
  },
  {
    id: "blue",
    name: "BLUE CORNER",
    description: "파란 코너 느낌",
  },
  {
    id: "mono",
    name: "CLASSIC MONO",
    description: "흑백 복싱 다큐 느낌",
  },
  {
    id: "chrome",
    name: "CHROME CARD",
    description: "반짝이는 트레이딩 카드 느낌",
  },
  {
    id: "future",
    name: "FUTURE STAR",
    description: "신예 파이터 카드 느낌",
  },
  {
    id: "vintage",
    name: "VINTAGE RINGSIDE",
    description: "올드 복싱 포스터 느낌",
  },
  {
    id: "semipro",
    name: "SEMI-PRO GOLD",
    description: "베테랑 전용 · 세미프로 링 골드",
    veteranLevel: 36,
  },
  {
    id: "champion",
    name: "CHAMPION BELT",
    description: "베테랑 전용 · 챔피언 벨트 골드",
    veteranLevel: 76,
  },
  {
    id: "goat",
    name: "BOXING GOAT",
    description: "베테랑 전용 · 백 단계 전설 필터",
    veteranLevel: 100,
  },
];

export const CARD_STYLES = [
  {
    id: "basic",
    name: "LEVEL UP",
    description: "사진 위에 레벨/문구/기록을 올리는 카드",
  },
  {
    id: "social",
    name: "STORY",
    description: "인스타 스토리 9:16 비율",
  },
  {
    id: "poster",
    name: "POSTER",
    description: "한 사람 주인공 포스터",
  },
];

const IMAGE_FILTER_PROFILES = {
  levelup: {
    contrast: [1.04, 1.22],
    saturate: [1.04, 1.28],
    sepia: [0.02, 0.42],
    brightness: [1, 0.92],
    hueRotate: [0, 0],
    grayscale: [0, 0],
    tint: { r: 1.04, g: 0.98, b: 0.88 },
  },
  red: {
    contrast: [1.04, 1.2],
    saturate: [1.06, 1.32],
    sepia: [0.02, 0.32],
    brightness: [1, 0.94],
    hueRotate: [0, -10],
    grayscale: [0, 0],
    tint: { r: 1.06, g: 0.95, b: 0.92 },
  },
  dark: {
    contrast: [1.04, 1.2],
    saturate: [1, 0.72],
    sepia: [0, 0.08],
    brightness: [1, 0.82],
    hueRotate: [0, 0],
    grayscale: [0, 0],
  },
  gold: {
    contrast: [1.04, 1.22],
    saturate: [1.04, 1.24],
    sepia: [0.04, 0.52],
    brightness: [1, 0.92],
    hueRotate: [0, 0],
    grayscale: [0, 0],
    tint: { r: 1.05, g: 0.96, b: 0.86 },
  },
  blue: {
    contrast: [1.04, 1.2],
    saturate: [1.04, 1.26],
    sepia: [0, 0.1],
    brightness: [1, 0.94],
    hueRotate: [0, 62],
    grayscale: [0, 0],
    tint: { r: 0.9, g: 0.96, b: 1.1 },
  },
  mono: {
    contrast: [1.04, 1.28],
    saturate: [1, 0],
    sepia: [0, 0],
    brightness: [1, 0.9],
    hueRotate: [0, 0],
    grayscale: [0.15, 1],
  },
  chrome: {
    contrast: [1.05, 1.22],
    saturate: [1.02, 1.18],
    sepia: [0, 0.1],
    brightness: [1, 1.08],
    hueRotate: [0, 0],
    grayscale: [0, 0],
  },
  future: {
    contrast: [1.04, 1.2],
    saturate: [1.06, 1.34],
    sepia: [0, 0],
    brightness: [1, 0.95],
    hueRotate: [0, 22],
    grayscale: [0, 0],
    tint: { r: 0.96, g: 0.94, b: 1.08 },
  },
  vintage: {
    contrast: [1.04, 1.18],
    saturate: [1, 0.78],
    sepia: [0.04, 0.58],
    brightness: [1, 0.9],
    hueRotate: [0, 0],
    grayscale: [0, 0],
  },
  semipro: {
    contrast: [1.05, 1.24],
    saturate: [1.06, 1.3],
    sepia: [0.06, 0.48],
    brightness: [1, 0.94],
    hueRotate: [0, 8],
    grayscale: [0, 0],
    tint: { r: 1.08, g: 0.94, b: 0.78 },
  },
  champion: {
    contrast: [1.06, 1.28],
    saturate: [1.08, 1.36],
    sepia: [0.08, 0.62],
    brightness: [1, 0.9],
    hueRotate: [0, 0],
    grayscale: [0, 0],
    tint: { r: 1.12, g: 0.92, b: 0.62 },
  },
  goat: {
    contrast: [1.08, 1.32],
    saturate: [1.1, 1.42],
    sepia: [0.1, 0.72],
    brightness: [1, 0.88],
    hueRotate: [0, -6],
    grayscale: [0, 0],
    tint: { r: 1.14, g: 0.98, b: 0.72 },
  },
};

function clampStrength(intensity) {
  return Math.max(0, Math.min(1, intensity / 100));
}

function getEffectiveStrength(intensity) {
  const raw = clampStrength(intensity);
  return Math.min(1, raw * 1.08 + 0.04);
}

function resolveProfileValues(profile, strength) {
  const resolve = ([min, max]) => min + (max - min) * strength;

  return {
    contrast: resolve(profile.contrast),
    saturate: resolve(profile.saturate),
    sepia: resolve(profile.sepia),
    brightness: resolve(profile.brightness),
    hueRotate: resolve(profile.hueRotate),
    grayscale: resolve(profile.grayscale),
    tint: profile.tint || null,
  };
}

export function getImageFilterProfile(filterId, intensity) {
  const strength = getEffectiveStrength(intensity);
  const profile =
    IMAGE_FILTER_PROFILES[filterId] || IMAGE_FILTER_PROFILES.red;

  return resolveProfileValues(profile, strength);
}

export function getStoryFilterIntensity(intensity) {
  return Math.round(getEffectiveStrength(intensity) * 100);
}

export function getImageFilter(filterId, intensity) {
  const profile = getImageFilterProfile(filterId, intensity);

  const parts = [
    profile.grayscale > 0 ? `grayscale(${profile.grayscale})` : null,
    `contrast(${profile.contrast})`,
    `saturate(${profile.saturate})`,
    profile.sepia > 0 ? `sepia(${profile.sepia})` : null,
    profile.hueRotate ? `hue-rotate(${profile.hueRotate}deg)` : null,
    `brightness(${profile.brightness})`,
  ].filter(Boolean);

  return parts.join(" ");
}

function clampPixel(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

export function applyPixelImageFilter(
  ctx,
  x,
  y,
  width,
  height,
  filterId,
  intensity
) {
  const strength = getEffectiveStrength(intensity);

  if (!strength) return;

  let imageData;

  try {
    imageData = ctx.getImageData(x, y, width, height);
  } catch (error) {
    console.warn("픽셀 필터 적용 실패:", error);
    return;
  }

  const profile = getImageFilterProfile(filterId, intensity);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    r *= profile.brightness;
    g *= profile.brightness;
    b *= profile.brightness;

    r = (r - 128) * profile.contrast + 128;
    g = (g - 128) * profile.contrast + 128;
    b = (b - 128) * profile.contrast + 128;

    const gray = r * 0.299 + g * 0.587 + b * 0.114;

    if (profile.grayscale >= 1) {
      r = gray;
      g = gray;
      b = gray;
    } else {
      r = gray + (r - gray) * profile.saturate;
      g = gray + (g - gray) * profile.saturate;
      b = gray + (b - gray) * profile.saturate;
    }

    if (profile.sepia > 0) {
      const sr = r * 0.393 + g * 0.769 + b * 0.189;
      const sg = r * 0.349 + g * 0.686 + b * 0.168;
      const sb = r * 0.272 + g * 0.534 + b * 0.131;

      r = r * (1 - profile.sepia) + sr * profile.sepia;
      g = g * (1 - profile.sepia) + sg * profile.sepia;
      b = b * (1 - profile.sepia) + sb * profile.sepia;
    }

    if (profile.tint) {
      r *= profile.tint.r;
      g *= profile.tint.g;
      b *= profile.tint.b;
    }

    data[i] = clampPixel(r);
    data[i + 1] = clampPixel(g);
    data[i + 2] = clampPixel(b);
  }

  ctx.putImageData(imageData, x, y);
}

export function getCardBackground(filterId) {
  if (filterId === "levelup") {
    return "radial-gradient(circle at 78% 12%, rgba(214, 162, 52, 0.36), transparent 34%), radial-gradient(circle at 18% 84%, rgba(255, 255, 255, 0.08), transparent 32%), linear-gradient(145deg, #151008, #020202)";
  }

  if (filterId === "chrome") {
    return "radial-gradient(circle at 18% 16%, rgba(255, 255, 255, 0.58), transparent 18%), radial-gradient(circle at 82% 12%, rgba(255, 51, 51, 0.45), transparent 30%), linear-gradient(135deg, rgba(255, 255, 255, 0.18), transparent 28%, rgba(255, 255, 255, 0.08) 42%, transparent 58%, rgba(255, 255, 255, 0.16) 76%), linear-gradient(145deg, #262626, #050505)";
  }

  if (filterId === "future") {
    return "radial-gradient(circle at 80% 12%, rgba(139, 92, 246, 0.48), transparent 34%), radial-gradient(circle at 15% 82%, rgba(14, 165, 233, 0.36), transparent 32%), linear-gradient(145deg, #120a2f, #050505)";
  }

  if (filterId === "vintage") {
    return "radial-gradient(circle at 20% 18%, rgba(255, 220, 140, 0.22), transparent 28%), linear-gradient(145deg, #2a1b10, #070504)";
  }

  if (filterId === "semipro") {
    return "radial-gradient(circle at 78% 14%, rgba(232, 180, 72, 0.44), transparent 34%), radial-gradient(circle at 16% 82%, rgba(255, 255, 255, 0.1), transparent 30%), linear-gradient(145deg, #241808, #060402)";
  }

  if (filterId === "champion") {
    return "radial-gradient(circle at 82% 10%, rgba(255, 214, 72, 0.52), transparent 36%), radial-gradient(circle at 12% 78%, rgba(255, 120, 40, 0.18), transparent 28%), linear-gradient(145deg, #2a1800, #050301)";
  }

  if (filterId === "goat") {
    return "radial-gradient(circle at 80% 12%, rgba(255, 228, 140, 0.58), transparent 34%), radial-gradient(circle at 18% 84%, rgba(239, 63, 54, 0.22), transparent 30%), linear-gradient(145deg, #1f1408, #020101)";
  }

  if (filterId === "gold") {
    return "radial-gradient(circle at 80% 12%, rgba(255, 198, 41, 0.42), transparent 34%), linear-gradient(145deg, #241800, #050505)";
  }

  if (filterId === "blue") {
    return "radial-gradient(circle at 82% 10%, rgba(54, 124, 255, 0.42), transparent 35%), linear-gradient(145deg, #07152f, #050505)";
  }

  if (filterId === "mono") {
    return "radial-gradient(circle at 82% 10%, rgba(255, 255, 255, 0.18), transparent 35%), linear-gradient(145deg, #202020, #050505)";
  }

  if (filterId === "dark") {
    return "radial-gradient(circle at 82% 10%, rgba(255, 255, 255, 0.1), transparent 35%), linear-gradient(145deg, #151515, #000000)";
  }

  return "radial-gradient(circle at 82% 10%, rgba(255, 51, 51, 0.46), transparent 35%), linear-gradient(145deg, #250909, #050505)";
}

export function getOverlayStyle(filterId, intensity) {
  const strength = clampStrength(intensity);

  if (filterId === "levelup") {
    return `linear-gradient(90deg, rgba(0, 0, 0, ${0.58 + 0.1 * strength}) 0%, rgba(0, 0, 0, ${0.32 + 0.14 * strength}) 48%, rgba(0, 0, 0, ${0.06 + 0.08 * strength}) 100%), linear-gradient(180deg, rgba(0, 0, 0, ${0.08 + 0.1 * strength}), rgba(0, 0, 0, ${0.58 + 0.16 * strength})), radial-gradient(circle at 80% 18%, rgba(214, 162, 52, ${0.1 + 0.16 * strength}), transparent 42%)`;
  }

  if (filterId === "chrome") {
    return `linear-gradient(135deg, rgba(255, 255, 255, ${0.06 + 0.14 * strength}), transparent 22%, rgba(255, 51, 51, ${0.05 + 0.1 * strength}) 48%, transparent 68%, rgba(255, 255, 255, ${0.06 + 0.14 * strength})), linear-gradient(180deg, rgba(0, 0, 0, ${0.16 + 0.1 * strength}), rgba(0, 0, 0, ${0.4 + 0.16 * strength}))`;
  }

  if (filterId === "future") {
    return `linear-gradient(180deg, rgba(88, 28, 135, ${0.06 + 0.14 * strength}), rgba(0, 0, 0, ${0.36 + 0.18 * strength})), linear-gradient(135deg, rgba(14, 165, 233, ${0.05 + 0.12 * strength}), transparent 42%, rgba(255, 51, 51, ${0.03 + 0.07 * strength}))`;
  }

  if (filterId === "vintage") {
    return `linear-gradient(180deg, rgba(255, 214, 150, ${0.05 + 0.1 * strength}), rgba(0, 0, 0, ${0.42 + 0.18 * strength})), radial-gradient(circle at center, transparent 42%, rgba(0, 0, 0, ${0.16 + 0.14 * strength}))`;
  }

  if (filterId === "semipro") {
    return `linear-gradient(180deg, rgba(232, 180, 72, ${0.06 + 0.14 * strength}), rgba(0, 0, 0, ${0.4 + 0.18 * strength})), radial-gradient(circle at 78% 18%, rgba(255, 220, 140, ${0.08 + 0.14 * strength}), transparent 42%)`;
  }

  if (filterId === "champion") {
    return `linear-gradient(180deg, rgba(255, 198, 64, ${0.08 + 0.16 * strength}), rgba(0, 0, 0, ${0.42 + 0.2 * strength})), radial-gradient(circle at 80% 16%, rgba(255, 214, 72, ${0.12 + 0.18 * strength}), transparent 40%)`;
  }

  if (filterId === "goat") {
    return `linear-gradient(180deg, rgba(255, 228, 140, ${0.1 + 0.18 * strength}), rgba(0, 0, 0, ${0.44 + 0.22 * strength})), radial-gradient(circle at 78% 14%, rgba(239, 63, 54, ${0.08 + 0.12 * strength}), transparent 38%), radial-gradient(circle at 18% 82%, rgba(255, 214, 72, ${0.06 + 0.12 * strength}), transparent 34%)`;
  }

  if (filterId === "gold") {
    return `linear-gradient(180deg, rgba(255, 180, 35, ${0.04 + 0.12 * strength}), rgba(0, 0, 0, ${0.38 + 0.2 * strength}))`;
  }

  if (filterId === "blue") {
    return `linear-gradient(180deg, rgba(35, 105, 255, ${0.05 + 0.14 * strength}), rgba(0, 0, 0, ${0.38 + 0.2 * strength}))`;
  }

  if (filterId === "mono") {
    return `linear-gradient(180deg, rgba(255, 255, 255, ${0.02 + 0.05 * strength}), rgba(0, 0, 0, ${0.4 + 0.18 * strength}))`;
  }

  if (filterId === "dark") {
    return `linear-gradient(180deg, rgba(0, 0, 0, ${0.1 + 0.1 * strength}), rgba(0, 0, 0, ${0.48 + 0.2 * strength}))`;
  }

  return `linear-gradient(180deg, rgba(255, 35, 35, ${0.04 + 0.08 * strength}), rgba(0, 0, 0, ${0.4 + 0.18 * strength}))`;
}

export function getCardPreviewOverlay(cardStyle, filterId, intensity) {
  if (cardStyle === "social") {
    const tint = getOverlayStyle(filterId, intensity * 0.92);
    return `${tint}, linear-gradient(180deg, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.12) 45%, rgba(0, 0, 0, 0.28))`;
  }

  if (cardStyle === "poster") {
    const tint = getOverlayStyle(filterId, intensity * 0.72);
    return `${tint}, radial-gradient(circle at center, transparent 46%, rgba(0, 0, 0, 0.28))`;
  }

  return getOverlayStyle(filterId, intensity);
}
