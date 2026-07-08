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

/**
 * 프로필 사진은 앱이 직접 만든 base64 이미지(data:image/*)만 허용합니다.
 * 외부 http(s) URL(추적 픽셀·피싱)과 SVG(스크립트 삽입 가능)는 차단합니다.
 */
const SAFE_PHOTO_PREFIXES = [
  "data:image/png",
  "data:image/jpeg",
  "data:image/jpg",
  "data:image/webp",
  "data:image/gif",
];

export function sanitizePhotoValue(photo) {
  if (typeof photo !== "string" || photo === "") {
    return "";
  }

  const normalized = photo.trim().slice(0, 24).toLowerCase();
  const isSafe = SAFE_PHOTO_PREFIXES.some((prefix) =>
    normalized.startsWith(prefix)
  );

  return isSafe ? photo : "";
}

export function sanitizeProfileForStorage(profile) {
  if (!profile || typeof profile !== "object") {
    return {};
  }

  return PROFILE_STORAGE_KEYS.reduce((safe, key) => {
    if (profile[key] === undefined) {
      return safe;
    }

    safe[key] = key === "photo" ? sanitizePhotoValue(profile[key]) : profile[key];

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
