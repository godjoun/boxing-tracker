import { describe, expect, it } from "vitest";
import {
  FRESH_ONBOARDING_FLAG,
  markFreshOnboardingMigrationComplete,
} from "./profileMigration";

const PROFILE_KEY = "fitness-league-profile";

function createMemoryStorage(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
    removeItem(key) {
      map.delete(key);
    },
    clear() {
      map.clear();
    },
  };
}

describe("온보딩 마이그레이션 (비파괴)", () => {
  it("기존 프로필과 기록이 있으면 덮어쓰지 않는다", () => {
    const existingProfile = {
      nickname: "기존복서",
      bio: "기존소개",
      photo: "data:image/png;base64,OLD",
      weightClass: "헤비급",
      onboardingComplete: true,
    };
    const storage = createMemoryStorage({
      [PROFILE_KEY]: JSON.stringify(existingProfile),
      "fitness-league-logs": JSON.stringify([
        { id: "old", type: "복싱", rounds: 5 },
      ]),
    });

    const result = markFreshOnboardingMigrationComplete(storage);

    expect(result.alreadyDone).toBe(false);
    expect(result.wiped).toBe(false);
    expect(storage.getItem(FRESH_ONBOARDING_FLAG)).toBe("1");
    expect(JSON.parse(storage.getItem(PROFILE_KEY))).toEqual(existingProfile);
    expect(JSON.parse(storage.getItem("fitness-league-logs"))).toHaveLength(1);
  });

  it("이미 마이그레이션된 경우 프로필을 건드리지 않는다", () => {
    const storage = createMemoryStorage({
      [FRESH_ONBOARDING_FLAG]: "1",
      [PROFILE_KEY]: JSON.stringify({
        nickname: "민준",
        onboardingComplete: true,
      }),
    });

    const result = markFreshOnboardingMigrationComplete(storage);

    expect(result.alreadyDone).toBe(true);
    expect(result.wiped).toBe(false);
    expect(JSON.parse(storage.getItem(PROFILE_KEY)).nickname).toBe("민준");
  });
});
