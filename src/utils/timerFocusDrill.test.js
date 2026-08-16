import { describe, expect, it } from "vitest";
import { getTimerFocusDrill } from "./timerFocusDrill";

describe("getTimerFocusDrill", () => {
  it("shows current combo during work", () => {
    expect(
      getTimerFocusDrill({
        phase: "work",
        curriculumFocus: {
          name: "콤보",
          combos: ["JAB", "CROSS", "SLIP"],
        },
      })
    ).toEqual({ mode: "now", text: "JAB → CROSS → SLIP" });
  });

  it("shows next drill during rest only when it exists", () => {
    expect(
      getTimerFocusDrill({
        phase: "rest",
        currentRound: 1,
        totalRounds: 3,
        curriculumFocus: {
          name: "호흡 정리",
          nextDrill: { name: "DOUBLE JAB → CROSS" },
        },
      })
    ).toEqual({ mode: "next", text: "DOUBLE JAB → CROSS" });

    expect(
      getTimerFocusDrill({
        phase: "rest",
        currentRound: 3,
        totalRounds: 3,
        curriculumFocus: { name: "호흡 정리", nextDrill: null },
      })
    ).toBe(null);
  });

  it("does not invent a drill in prep or done", () => {
    expect(getTimerFocusDrill({ phase: "prep", workoutDetails: "샌드백" })).toBe(
      null
    );
    expect(getTimerFocusDrill({ phase: "done", workoutDetails: "샌드백" })).toBe(
      null
    );
  });
});
