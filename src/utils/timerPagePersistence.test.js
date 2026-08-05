import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./timerSession", () => ({
  loadTimerSession: vi.fn(),
  reconcileTimerSession: vi.fn((value) => value),
}));

import { loadTimerSession } from "./timerSession";
import {
  TIMER_DEFAULT_STATE,
  readInitialTimerState,
} from "./timerPagePersistence";

describe("timerPagePersistence boxing defaults", () => {
  beforeEach(() => {
    loadTimerSession.mockReset();
  });

  it("defaults new sessions to 3-minute rounds", () => {
    loadTimerSession.mockReturnValue(null);
    const state = readInitialTimerState();
    expect(state.workSecondsSetting).toBe(180);
    expect(state.remainingTime).toBe(180);
    expect(state.restSecondsSetting).toBe(30);
    expect(TIMER_DEFAULT_STATE.workSecondsSetting).toBe(180);
  });

  it("realigns idle match presets from stale 2-minute storage", () => {
    loadTimerSession.mockReturnValue({
      selectedPresetId: "match3",
      totalRounds: 3,
      workSecondsSetting: 120,
      restSecondsSetting: 30,
      remainingTime: 120,
      phase: "work",
      isRunning: false,
      hasStartedSession: false,
    });

    const state = readInitialTimerState();
    expect(state.workSecondsSetting).toBe(180);
    expect(state.remainingTime).toBe(180);
  });

  it("preserves custom work seconds", () => {
    loadTimerSession.mockReturnValue({
      selectedPresetId: "custom",
      totalRounds: 4,
      workSecondsSetting: 120,
      restSecondsSetting: 45,
      remainingTime: 120,
      phase: "work",
      isRunning: false,
      hasStartedSession: false,
    });

    const state = readInitialTimerState();
    expect(state.workSecondsSetting).toBe(120);
    expect(state.restSecondsSetting).toBe(45);
  });
});
