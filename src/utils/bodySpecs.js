import {
  isValidWeightClass,
  normalizeWeightClass,
  suggestWeightClass,
} from "../data/proBoxingWeightClasses";

export { suggestWeightClass };

export function needsOnboarding(profile) {
  if (!profile || typeof profile !== "object") {
    return true;
  }

  return profile.onboardingComplete !== true;
}

export function validateBodySpecs(form) {
  const specs = validateBodySpecFields(form);

  return {
    ...specs,
    onboardingComplete: true,
  };
}

/** 온보딩: 링네임만 필수. 스펙은 비워 두고 나중에 명패에서 채울 수 있다. */
export function validateOnboardingSpecs(form) {
  const nickname = String(form.nickname || "").trim();

  if (!nickname) {
    throw new Error("링네임을 입력해 주세요.");
  }

  if (nickname.length < 2 || nickname.length > 12) {
    throw new Error("이름은 2~12자로 입력해 주세요.");
  }

  const heightRaw = String(form.heightCm ?? "").trim();
  const weightRaw = String(form.weightKg ?? "").trim();
  const reachRaw = String(form.reachCm ?? "").trim();

  const heightCm = heightRaw === "" ? "" : Number(heightRaw);
  const weightKg = weightRaw === "" ? "" : Number(weightRaw);
  const reachCm = reachRaw === "" ? null : Number(reachRaw);

  if (heightCm !== "" && (!Number.isFinite(heightCm) || heightCm < 120 || heightCm > 230)) {
    throw new Error("키는 120~230cm 사이로 입력해 주세요.");
  }

  if (weightKg !== "" && (!Number.isFinite(weightKg) || weightKg < 35 || weightKg > 200)) {
    throw new Error("몸무게는 35~200kg 사이로 입력해 주세요.");
  }

  if (
    reachCm !== null &&
    (!Number.isFinite(reachCm) || reachCm < 100 || reachCm > 250)
  ) {
    throw new Error("리치는 100~250cm 사이로 입력해 주세요.");
  }

  let weightClass = "";
  if (isValidWeightClass(form.weightClass)) {
    weightClass = normalizeWeightClass(form.weightClass);
  } else if (weightKg !== "") {
    weightClass = suggestWeightClass(weightKg);
  }

  return {
    nickname,
    heightCm,
    weightKg,
    reachCm,
    weightClass,
    experience: form.experience || "초보 (6개월 미만)",
    sparringStyle: form.sparringStyle || "미디엄",
    area: String(form.area || "").trim(),
    onboardingComplete: true,
  };
}

export function validateBodySpecFields(form) {
  const nickname = String(form.nickname || "").trim();
  const heightCm = Number(form.heightCm);
  const weightKg = Number(form.weightKg);
  const reachCm = form.reachCm === "" || form.reachCm == null ? null : Number(form.reachCm);

  if (!nickname) {
    throw new Error("링네임을 입력해 주세요.");
  }

  if (!Number.isFinite(heightCm) || heightCm < 120 || heightCm > 230) {
    throw new Error("키는 120~230cm 사이로 입력해 주세요.");
  }

  if (!Number.isFinite(weightKg) || weightKg < 35 || weightKg > 200) {
    throw new Error("몸무게는 35~200kg 사이로 입력해 주세요.");
  }

  if (
    reachCm !== null &&
    (!Number.isFinite(reachCm) || reachCm < 100 || reachCm > 250)
  ) {
    throw new Error("리치는 100~250cm 사이로 입력해 주세요.");
  }

  const weightClass = isValidWeightClass(form.weightClass)
    ? normalizeWeightClass(form.weightClass)
    : suggestWeightClass(weightKg);

  return {
    nickname,
    heightCm,
    weightKg,
    reachCm,
    weightClass,
    experience: form.experience || "초보 (6개월 미만)",
    sparringStyle: form.sparringStyle || "미디엄",
    area: String(form.area || "").trim(),
  };
}
