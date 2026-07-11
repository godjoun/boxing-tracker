export const DEV_USER_ID = "dev-local-user";

export const DEV_DEFAULT_PROFILE = {
  nickname: "개발자",
  bio: "개발 모드 테스트 계정",
  heightCm: 175,
  weightKg: 70,
  reachCm: 178,
  weightClass: "라이트급",
  experience: "1년차",
  area: "로컬",
  onboardingComplete: true,
};

export function isDevMode() {
  return import.meta.env.DEV;
}

export function getDevUserId() {
  return isDevMode() ? DEV_USER_ID : null;
}
