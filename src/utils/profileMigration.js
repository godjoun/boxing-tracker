/** 과거 1회성 온보딩 강제 리셋 플래그 */
export const FRESH_ONBOARDING_FLAG = "fitness-league-fresh-onboarding-v1";

/**
 * 비파괴 마이그레이션.
 * 기존 닉네임·사진·스펙·소속관·온보딩 완료 상태를 절대 덮어쓰지 않는다.
 * 플래그만 남겨 구버전 wipe 로직이 다시 돌지 않게 한다.
 */
export function markFreshOnboardingMigrationComplete(storage = localStorage) {
  try {
    if (storage.getItem(FRESH_ONBOARDING_FLAG) === "1") {
      return { alreadyDone: true, wiped: false };
    }
    storage.setItem(FRESH_ONBOARDING_FLAG, "1");
    return { alreadyDone: false, wiped: false };
  } catch {
    return { alreadyDone: false, wiped: false, error: true };
  }
}
