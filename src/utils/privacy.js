/** localStorage·백업 JSON에 넣어도 되는 프로필 필드만 허용 */
const PROFILE_STORAGE_KEYS = [
  "nickname",
  "bio",
  "photo",
  "heightCm",
  "weightKg",
  "reachCm",
  "weightClass",
  "experience",
  "sparringStyle",
  "area",
  "contact",
  "onboardingComplete",
];

export function sanitizeProfileForStorage(profile) {
  if (!profile || typeof profile !== "object") {
    return {};
  }

  return PROFILE_STORAGE_KEYS.reduce((safe, key) => {
    if (profile[key] !== undefined) {
      safe[key] = profile[key];
    }

    return safe;
  }, {});
}

/** 백업 파일에는 연락처·사진 URL 등 민감할 수 있는 항목 제외 (선택 복원 시 프로필 일부만) */
export function sanitizeProfileForBackup(profile) {
  const safe = sanitizeProfileForStorage(profile);
  delete safe.contact;
  delete safe.photo;

  return safe;
}
