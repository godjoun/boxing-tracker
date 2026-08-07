import { describe, expect, it, beforeEach } from "vitest";
import {
  WORKOUT_DETAILS_MAX_LENGTH,
  WORKOUT_DETAIL_PRESETS_LIMIT,
  bumpQuickWorkoutKind,
  deleteWorkoutDetailPreset,
  getSelectedQuickWorkoutKinds,
  getWorkoutDetailPresetsStorageKey,
  loadRecentWorkoutDetails,
  loadWorkoutDetailPresets,
  normalizeWorkoutDetails,
  normalizeWorkoutPresetName,
  rememberWorkoutDetails,
  removeQuickWorkoutKind,
  renameWorkoutDetailPreset,
  saveWorkoutDetailPreset,
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

describe("workoutDetailPresets", () => {
  const userA = "user-a";
  const userB = "user-b";
  const detailsA = "줄넘기 2R · 쉐도우 3R";

  it("returns empty array when key is missing", () => {
    expect(loadWorkoutDetailPresets(userA)).toEqual([]);
  });

  it("recovers empty array from corrupt JSON", () => {
    localStorage.setItem(
      getWorkoutDetailPresetsStorageKey(userA),
      "{not-json"
    );
    expect(loadWorkoutDetailPresets(userA)).toEqual([]);
  });

  it("normalizes name and details", () => {
    expect(normalizeWorkoutPresetName("  기본  훈련  ")).toBe("기본 훈련");
    expect(normalizeWorkoutPresetName("가".repeat(20)).length).toBe(12);
    const result = saveWorkoutDetailPreset(userA, {
      name: "  기본 훈련  ",
      details: `  ${detailsA}  ${"x".repeat(200)}`,
    });
    expect(result.ok).toBe(true);
    expect(result.presets[0].name).toBe("기본 훈련");
    expect(result.presets[0].details.length).toBeLessThanOrEqual(
      WORKOUT_DETAILS_MAX_LENGTH
    );
    expect(result.presets[0].details.startsWith(detailsA)).toBe(true);
  });

  it("rejects empty name or details", () => {
    expect(
      saveWorkoutDetailPreset(userA, { name: "", details: detailsA }).error
    ).toBe("empty");
    expect(
      saveWorkoutDetailPreset(userA, { name: "기본", details: "   " }).error
    ).toBe("empty");
  });

  it("enforces max 3 presets and rejects duplicates", () => {
    expect(
      saveWorkoutDetailPreset(userA, { name: "하나", details: "줄넘기 1R" }).ok
    ).toBe(true);
    expect(
      saveWorkoutDetailPreset(userA, { name: "둘", details: "쉐도우 1R" }).ok
    ).toBe(true);
    expect(
      saveWorkoutDetailPreset(userA, { name: "셋", details: "샌드백 1R" }).ok
    ).toBe(true);
    expect(loadWorkoutDetailPresets(userA)).toHaveLength(
      WORKOUT_DETAIL_PRESETS_LIMIT
    );
    expect(
      saveWorkoutDetailPreset(userA, { name: "넷", details: "미트 1R" }).error
    ).toBe("full");
    expect(
      saveWorkoutDetailPreset(userA, { name: "하나", details: "미트 1R" }).error
    ).toBe("full");

    deleteWorkoutDetailPreset(userA, loadWorkoutDetailPresets(userA)[2].id);
    expect(
      saveWorkoutDetailPreset(userA, { name: "하나", details: "미트 1R" }).error
    ).toBe("duplicate");
  });

  it("renames without changing order or details", () => {
    saveWorkoutDetailPreset(userA, { name: "하나", details: "줄넘기 1R" });
    saveWorkoutDetailPreset(userA, { name: "둘", details: "쉐도우 2R" });
    const second = loadWorkoutDetailPresets(userA)[1];
    const result = renameWorkoutDetailPreset(userA, second.id, "  새이름  ");
    expect(result.ok).toBe(true);
    expect(result.presets.map((item) => item.name)).toEqual(["하나", "새이름"]);
    expect(result.presets[1].details).toBe("쉐도우 2R");
    expect(renameWorkoutDetailPreset(userA, second.id, "하나").error).toBe(
      "duplicate"
    );
  });

  it("deletes one item and keeps the rest", () => {
    saveWorkoutDetailPreset(userA, { name: "하나", details: "줄넘기 1R" });
    saveWorkoutDetailPreset(userA, { name: "둘", details: "쉐도우 2R" });
    const first = loadWorkoutDetailPresets(userA)[0];
    const result = deleteWorkoutDetailPreset(userA, first.id);
    expect(result.presets.map((item) => item.name)).toEqual(["둘"]);
  });

  it("scopes presets by user id like logs", () => {
    expect(getWorkoutDetailPresetsStorageKey("local-user")).toBe(
      "fitness-league-workout-detail-presets"
    );
    expect(getWorkoutDetailPresetsStorageKey(userA)).toBe(
      `fitness-league-workout-detail-presets-${userA}`
    );
    saveWorkoutDetailPreset(userA, { name: "A전용", details: detailsA });
    saveWorkoutDetailPreset(userB, { name: "B전용", details: "미트 1R" });
    expect(loadWorkoutDetailPresets(userA).map((item) => item.name)).toEqual([
      "A전용",
    ]);
    expect(loadWorkoutDetailPresets(userB).map((item) => item.name)).toEqual([
      "B전용",
    ]);
  });
});
