import { describe, expect, it } from "vitest";
import {
  DEFAULT_BOXING_WORK_SECONDS,
  DEFAULT_BOXING_REST_SECONDS,
  buildPresetTimerLaunch,
  getTimerPresetById,
} from "./timerPresets";

describe("timer preset launch", () => {
  it("keeps setup mode as the default", () => {
    const launch = buildPresetTimerLaunch(getTimerPresetById("match3"));

    expect(launch.autoStart).toBe(false);
    expect(launch.rounds).toBe(3);
    expect(launch.prepSeconds).toBe(10);
    expect(launch.workSeconds).toBe(DEFAULT_BOXING_WORK_SECONDS);
    expect(launch.workSeconds).toBe(180);
    expect(launch.restSeconds).toBe(DEFAULT_BOXING_REST_SECONDS);
  });

  it("marks training-hub launches for immediate prep", () => {
    const launch = buildPresetTimerLaunch(getTimerPresetById("match6"), {
      autoStart: true,
    });

    expect(launch.autoStart).toBe(true);
    expect(launch.rounds).toBe(6);
    expect(launch.workSeconds).toBe(180);
  });

  it("uses 3-minute work for every match preset", () => {
    for (const id of ["match3", "match6", "match9", "match12"]) {
      expect(getTimerPresetById(id).workSeconds).toBe(180);
    }
  });
});
