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

  if (profile.onboardingComplete === true) {
    return false;
  }

  if (profile.heightCm && profile.weightKg) {
    return false;
  }

  return true;
}

export function validateBodySpecs(form) {
  const specs = validateBodySpecFields(form);

  return {
    ...specs,
    onboardingComplete: true,
  };
}

export function validateBodySpecFields(form) {
  const nickname = String(form.nickname || "").trim();
  const heightCm = Number(form.heightCm);
  const weightKg = Number(form.weightKg);
  const reachCm = form.reachCm === "" ? null : Number(form.reachCm);

  if (!nickname) {
    throw new Error("파이터 이름을 입력해 주세요.");
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
    experience: form.experience || "1년차",
    sparringStyle: form.sparringStyle || "미디엄",
    area: String(form.area || "").trim(),
  };
}
