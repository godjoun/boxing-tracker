import { describe, expect, it, beforeEach } from "vitest";
import {
  WORKOUT_DETAILS_MAX_LENGTH,
  bumpQuickWorkoutKind,
  getSelectedQuickWorkoutKinds,
  loadRecentWorkoutDetails,
  normalizeWorkoutDetails,
  rememberWorkoutDetails,
  removeQuickWorkoutKind,
} from "./workoutDetails";

const memoryStore = new Map();

beforeEach(() => {
  memoryStore.clear();
  globalThis.localStorage = {
    getItem: (key) => (memoryStore.has(key) ? memoryStore.get(key) : null),
    setItem: (key, value) => {
      memoryStore.set(key, String(value));
    },
    removeItem: (key) => {
      memoryStore.delete(key);
    },
    clear: () => memoryStore.clear(),
  };
});

describe("workoutDetails", () => {
  it("normalizes whitespace and max length", () => {
    expect(normalizeWorkoutDetails("  줄넘기  2R  ")).toBe("줄넘기 2R");
    expect(normalizeWorkoutDetails("x".repeat(200)).length).toBe(
      WORKOUT_DETAILS_MAX_LENGTH
    );
    expect(normalizeWorkoutDetails(null)).toBe("");
  });

  it("remembers recent unique values", () => {
    rememberWorkoutDetails("줄넘기 2R");
    rememberWorkoutDetails("쉐도우 3R");
    rememberWorkoutDetails("줄넘기 2R");
    expect(loadRecentWorkoutDetails()).toEqual(["줄넘기 2R", "쉐도우 3R"]);
  });

  it("bumps rounds for the same kind and appends other kinds in order", () => {
    let value = "";
    value = bumpQuickWorkoutKind(value, "줄넘기");
    value = bumpQuickWorkoutKind(value, "줄넘기");
    value = bumpQuickWorkoutKind(value, "쉐도우");
    value = bumpQuickWorkoutKind(value, "쉐도우");
    value = bumpQuickWorkoutKind(value, "쉐도우");
    value = bumpQuickWorkoutKind(value, "샌드백");
    expect(value).toBe("줄넘기 2R · 쉐도우 3R · 샌드백 1R");
    expect(getSelectedQuickWorkoutKinds(value).map((item) => item.name)).toEqual([
      "줄넘기",
      "쉐도우",
      "샌드백",
    ]);
  });

  it("does not duplicate the same kind segment", () => {
    const value = bumpQuickWorkoutKind(
      bumpQuickWorkoutKind("줄넘기 1R", "줄넘기"),
      "줄넘기"
    );
    expect(value).toBe("줄넘기 3R");
    expect(value.split("·")).toHaveLength(1);
  });

  it("removes a kind while keeping order of the rest", () => {
    const value = removeQuickWorkoutKind(
      "줄넘기 2R · 쉐도우 3R · 샌드백 1R",
      "쉐도우"
    );
    expect(value).toBe("줄넘기 2R · 샌드백 1R");
  });

  it("preserves free-text segments when bumping a kind", () => {
    const value = bumpQuickWorkoutKind("복근 10분 · 줄넘기 1R", "줄넘기");
    expect(value).toBe("복근 10분 · 줄넘기 2R");
    expect(bumpQuickWorkoutKind("복근 10분", "미트")).toBe("복근 10분 · 미트 1R");
  });
});
