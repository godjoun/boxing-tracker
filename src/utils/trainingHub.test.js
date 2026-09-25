import { describe, expect, it } from "vitest";
import {
  BOXING_KINDS,
  TRAINING_CATEGORY,
  buildBoxingPreset,
  buildRoundSummary,
  buildTodayTrainingSummary,
  buildTrainingStage,
  formatRestLabel,
  resolveRoundPreset,
} from "./trainingHub";

describe("training hub model", () => {
  it("summarizes today without developer-only logs", () => {
    const summary = buildTodayTrainingSummary(
      [
        { id: "real", date: "2026-09-11", rounds: 3, minutes: 12 },
        { id: "old", date: "2026-09-10", rounds: 6, minutes: 24 },
        { id: "dev-level-boost", date: "2026-09-11", rounds: 999 },
      ],
      new Date(2026, 8, 11, 10)
    );

    expect(summary).toEqual({ rounds: 3, minutes: 12 });
  });

  it("builds a clear boxing stage from the selected preset", () => {
    const roundPreset = resolveRoundPreset("match3");
    const stage = buildTrainingStage({
      categoryId: TRAINING_CATEGORY.BOXING,
      boxingKind: BOXING_KINDS[0],
      runningGoalMinutes: 30,
      roundPreset,
      todaySummary: { rounds: 0, minutes: 0 },
    });

    expect(stage.title).toBe("오늘 3R");
    expect(stage.ctaLabel).toBe("3R 시작");
    expect(stage.ctaDetail).toContain("라운드 · 3R");
    expect(stage.stats.map((stat) => stat.value)).toEqual(["3R", "3분", "0분"]);
  });

  it("keeps running stage separate from boxing round settings", () => {
    const stage = buildTrainingStage({
      categoryId: TRAINING_CATEGORY.RUNNING,
      boxingKind: BOXING_KINDS[0],
      runningGoalMinutes: 45,
      roundPreset: resolveRoundPreset("match12"),
      todaySummary: { rounds: 2, minutes: 8 },
    });

    expect(stage.title).toBe("45분 러닝");
    expect(stage.ctaLabel).toBe("러닝 시작");
    expect(stage.stats[0]).toEqual({ label: "목표", value: "45분" });
  });

  it("formats round/rest text and builds timer launch presets", () => {
    const preset = resolveRoundPreset("match6");
    const shadow = BOXING_KINDS.find((kind) => kind.id === "shadow");
    const launchPreset = buildBoxingPreset({
      boxingKind: shadow,
      preset,
      workoutDetails: "  쉐도우 2R   ·   샌드백 4R  ",
    });

    expect(formatRestLabel(30)).toBe("30초");
    expect(formatRestLabel(75)).toBe("1분 15초");
    expect(buildRoundSummary(preset)).toBe("6R · 운동 3분 · 휴식 30초");
    expect(launchPreset).toMatchObject({
      title: "쉐도우",
      logType: "쉐도우",
      routineTitle: "쉐도우 · 6R",
      workoutDetails: "쉐도우 2R · 샌드백 4R",
    });
  });
});
