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
];

export const CARD_STYLES = [
  {
    id: "basic",
    name: "LEVEL UP",
    description: "사진 위에 레벨/문구/기록을 올리는 카드",
  },
  {
    id: "social",
    name: "SOCIAL",
    description: "사진 중심 공유 카드",
  },
  {
    id: "poster",
    name: "POSTER",
    description: "한 사람 주인공 포스터",
  },
];

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

export function getImageFilter(filterId, intensity) {
  const strength = Math.max(0, Math.min(1.15, (intensity / 100) * 1.15));

  if (filterId === "levelup") {
    return `contrast(${1.18 + 0.5 * strength}) saturate(${0.86 + 0.22 * strength}) sepia(${0.26 + 0.36 * strength}) brightness(${0.9 - 0.14 * strength})`;
  }

  if (filterId === "gold") {
    return `contrast(${1.08 + 0.42 * strength}) saturate(${
      1.14 + 0.34 * strength
    }) sepia(${0.3 + 0.44 * strength}) brightness(${
      0.98 - 0.04 * strength
    })`;
  }

  if (filterId === "blue") {
    return `contrast(${1.08 + 0.42 * strength}) saturate(${
      1.12 + 0.34 * strength
    }) hue-rotate(${170 * strength}deg) brightness(${
      0.98 - 0.05 * strength
    })`;
  }

  if (filterId === "mono") {
    return `grayscale(${0.65 + 0.35 * strength}) contrast(${
      1.18 + 0.42 * strength
    }) brightness(${1 - 0.04 * strength})`;
  }

  if (filterId === "dark") {
    return `contrast(${1.12 + 0.52 * strength}) brightness(${
      0.94 - 0.2 * strength
    }) saturate(${0.92 - 0.18 * strength})`;
  }

  if (filterId === "chrome") {
    return `contrast(${1.24 + 0.5 * strength}) saturate(${
      1.02 + 0.22 * strength
    }) brightness(${1.06 + 0.1 * strength}) sepia(${
      0.08 * strength
    })`;
  }

  if (filterId === "future") {
    return `contrast(${1.18 + 0.48 * strength}) saturate(${
      1.36 + 0.56 * strength
    }) hue-rotate(${30 * strength}deg) brightness(${
      1.01 - 0.02 * strength
    })`;
  }

  if (filterId === "vintage") {
    return `contrast(${1.16 + 0.44 * strength}) sepia(${
      0.42 + 0.56 * strength
    }) saturate(${0.86 - 0.08 * strength}) brightness(${
      0.97 - 0.05 * strength
    })`;
  }

  return `contrast(${1.16 + 0.5 * strength}) saturate(${
    1.2 + 0.48 * strength
  }) brightness(${0.98 - 0.05 * strength}) sepia(${
    0.12 + 0.28 * strength
  })`;
}

export function getOverlayStyle(filterId, intensity) {
  const strength = Math.max(0, Math.min(1.15, (intensity / 100) * 1.15));

  if (filterId === "levelup") {
    return `linear-gradient(90deg, rgba(0, 0, 0, ${0.72 + 0.1 * strength}) 0%, rgba(0, 0, 0, ${0.42 + 0.18 * strength}) 48%, rgba(0, 0, 0, ${0.06 + 0.1 * strength}) 100%), linear-gradient(180deg, rgba(0, 0, 0, ${0.08 + 0.12 * strength}), rgba(0, 0, 0, ${0.72 + 0.18 * strength})), radial-gradient(circle at 80% 18%, rgba(214, 162, 52, ${0.08 + 0.18 * strength}), transparent 42%)`;
  }

  if (filterId === "chrome") {
    return `linear-gradient(135deg, rgba(255, 255, 255, ${
      0.05 + 0.16 * strength
    }), transparent 22%, rgba(255, 51, 51, ${
      0.04 + 0.12 * strength
    }) 48%, transparent 68%, rgba(255, 255, 255, ${
      0.06 + 0.14 * strength
    })), linear-gradient(180deg, rgba(0, 0, 0, ${
      0.18 + 0.12 * strength
    }), rgba(0, 0, 0, ${0.46 + 0.18 * strength}))`;
  }

  if (filterId === "future") {
    return `linear-gradient(180deg, rgba(88, 28, 135, ${
      0.06 + 0.16 * strength
    }), rgba(0, 0, 0, ${
      0.42 + 0.22 * strength
    })), linear-gradient(135deg, rgba(14, 165, 233, ${
      0.04 + 0.12 * strength
    }), transparent 42%, rgba(255, 51, 51, ${0.04 + 0.08 * strength}))`;
  }

  if (filterId === "vintage") {
    return `linear-gradient(180deg, rgba(255, 214, 150, ${
      0.04 + 0.1 * strength
    }), rgba(0, 0, 0, ${
      0.5 + 0.2 * strength
    })), radial-gradient(circle at center, transparent 42%, rgba(0, 0, 0, ${
      0.18 + 0.18 * strength
    }))`;
  }

  if (filterId === "gold") {
    return `linear-gradient(180deg, rgba(255, 180, 35, ${
      0.02 + 0.1 * strength
    }), rgba(0, 0, 0, ${0.42 + 0.24 * strength}))`;
  }

  if (filterId === "blue") {
    return `linear-gradient(180deg, rgba(35, 105, 255, ${
      0.03 + 0.12 * strength
    }), rgba(0, 0, 0, ${0.42 + 0.25 * strength}))`;
  }

  if (filterId === "mono") {
    return `linear-gradient(180deg, rgba(255, 255, 255, ${
      0.01 + 0.04 * strength
    }), rgba(0, 0, 0, ${0.44 + 0.24 * strength}))`;
  }

  if (filterId === "dark") {
    return `linear-gradient(180deg, rgba(0, 0, 0, ${
      0.04 + 0.12 * strength
    }), rgba(0, 0, 0, ${0.5 + 0.25 * strength}))`;
  }

  return `linear-gradient(180deg, rgba(255, 35, 35, ${
    0.03 + 0.14 * strength
  }), rgba(0, 0, 0, ${0.44 + 0.24 * strength}))`;
}
