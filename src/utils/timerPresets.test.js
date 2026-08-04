import { describe, expect, it } from "vitest";
import {
  buildPresetTimerLaunch,
  getTimerPresetById,
} from "./timerPresets";

describe("timer preset launch", () => {
  it("keeps setup mode as the default", () => {
    const launch = buildPresetTimerLaunch(getTimerPresetById("match3"));

    expect(launch.autoStart).toBe(false);
    expect(launch.rounds).toBe(3);
    expect(launch.prepSeconds).toBe(10);
  });

  it("marks training-hub launches for immediate prep", () => {
    const launch = buildPresetTimerLaunch(getTimerPresetById("match6"), {
      autoStart: true,
    });

    expect(launch.autoStart).toBe(true);
    expect(launch.rounds).toBe(6);
  });
});
