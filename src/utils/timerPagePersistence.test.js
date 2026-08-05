import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./timerSession", () => ({
  loadTimerSession: vi.fn(),
  reconcileTimerSession: vi.fn((value) => value),
}));

import { loadTimerSession } from "./timerSession";
import {
  TIMER_DEFAULT_STATE,
  buildTimerSnapshot,
  mergeRunningTimerPersistSnapshot,
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

describe("mergeRunningTimerPersistSnapshot", () => {
  it("running 중 persist가 updatedAt을 과거/새 Date.now로 덮지 않는다", () => {
    const loaded = {
      isRunning: true,
      remainingTime: 170,
      updatedAt: 1_000_000,
      phase: "work",
      currentRound: 1,
    };
    const snapshot = buildTimerSnapshot(
      {
        isRunning: true,
        remainingTime: 169,
        phase: "work",
        currentRound: 1,
        soundMode: "mute",
      },
      1_002_000
    );

    const merged = mergeRunningTimerPersistSnapshot(snapshot, loaded, 1_002_000);
    expect(merged.remainingTime).toBe(170);
    expect(merged.updatedAt).toBe(1_000_000);
    expect(merged.soundMode).toBe("mute");
  });

  it("재개 시 updatedAt을 현재 시각으로 재설정한다", () => {
    const loaded = {
      isRunning: false,
      remainingTime: 150,
      updatedAt: 1_000_000,
      phase: "work",
      currentRound: 1,
    };
    const snapshot = buildTimerSnapshot(
      {
        isRunning: true,
        remainingTime: 150,
        phase: "work",
        currentRound: 1,
      },
      1_030_000
    );

    const merged = mergeRunningTimerPersistSnapshot(snapshot, loaded, 1_030_000);
    expect(merged.remainingTime).toBe(150);
    expect(merged.updatedAt).toBe(1_030_000);
  });
});
