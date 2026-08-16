import { describe, expect, it } from "vitest";
import { playTimerBeep, resolveTimerPhaseBeep } from "./timerAudio";

describe("resolveTimerPhaseBeep", () => {
  it("prep → work plays the work start beep once", () => {
    expect(resolveTimerPhaseBeep("prep", "work", 30)).toBe("work");
  });

  it("work → rest plays the rest start beep once", () => {
    expect(resolveTimerPhaseBeep("work", "rest", 30)).toBe("rest");
  });

  it("rest → work plays the next round work beep once", () => {
    expect(resolveTimerPhaseBeep("rest", "work", 30)).toBe("work");
  });

  it("last work → done plays the done beep once", () => {
    expect(resolveTimerPhaseBeep("work", "done", 30)).toBe("done");
  });

  it("restSeconds = 0 does not play a rest beep", () => {
    expect(resolveTimerPhaseBeep("work", "rest", 0)).toBeNull();
  });

  it("same phase does not repeat a beep", () => {
    expect(resolveTimerPhaseBeep("rest", "rest", 30)).toBeNull();
    expect(resolveTimerPhaseBeep("work", "work", 30)).toBeNull();
  });
});

describe("playTimerBeep mute", () => {
  it("does not throw and does not start audio when muted", async () => {
    await expect(playTimerBeep("mute", "rest")).resolves.toBeUndefined();
    await expect(playTimerBeep("mute", "work")).resolves.toBeUndefined();
    await expect(playTimerBeep("mute", "done")).resolves.toBeUndefined();
  });
});
