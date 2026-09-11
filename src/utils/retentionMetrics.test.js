import { beforeEach, describe, expect, it } from "vitest";
import {
  getTrainingRevisitStatus,
  recordAppOpen,
} from "./retentionMetrics";

describe("retention metrics", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("records unique open days without counting the same day twice", () => {
    recordAppOpen(new Date("2026-09-10T09:00:00+09:00"));
    recordAppOpen(new Date("2026-09-10T20:00:00+09:00"));

    expect(
      getTrainingRevisitStatus([], new Date("2026-09-10T21:00:00+09:00"))
    ).toMatchObject({
      openDays: 1,
      previousOpenDays: 0,
      shouldTrack: false,
    });
  });

  it("does not mark a revisit without a saved training record", () => {
    recordAppOpen(new Date("2026-09-10T09:00:00+09:00"));
    recordAppOpen(new Date("2026-09-11T09:00:00+09:00"));

    expect(
      getTrainingRevisitStatus([], new Date("2026-09-11T09:00:00+09:00"))
    ).toMatchObject({
      openDays: 2,
      previousOpenDays: 1,
      trainingLogs: 0,
      shouldTrack: false,
    });
  });

  it("marks a revisit when a user opens again after saving training", () => {
    recordAppOpen(new Date("2026-09-10T09:00:00+09:00"));
    recordAppOpen(new Date("2026-09-11T09:00:00+09:00"));

    expect(
      getTrainingRevisitStatus(
        [{ id: "log-1", rounds: 1, minutes: 3 }],
        new Date("2026-09-11T09:00:00+09:00")
      )
    ).toMatchObject({
      openDays: 2,
      previousOpenDays: 1,
      trainingLogs: 1,
      shouldTrack: true,
    });
  });

  it("ignores empty or malformed training records for revisit tracking", () => {
    recordAppOpen(new Date("2026-09-10T09:00:00+09:00"));
    recordAppOpen(new Date("2026-09-11T09:00:00+09:00"));

    expect(
      getTrainingRevisitStatus(
        [
          { id: "empty" },
          { id: "bad", rounds: "nope", minutes: "nope" },
        ],
        new Date("2026-09-11T09:00:00+09:00")
      )
    ).toMatchObject({
      trainingLogs: 0,
      shouldTrack: false,
    });
  });

  it("ignores malformed open days", () => {
    localStorage.setItem(
      "fitness-league-open-days",
      JSON.stringify(["soon", "2026-09-10", "2026-09-10"])
    );

    expect(
      getTrainingRevisitStatus(
        [{ id: "log-1", rounds: 1 }],
        new Date("2026-09-11T09:00:00+09:00")
      )
    ).toMatchObject({
      openDays: 1,
      previousOpenDays: 1,
      trainingLogs: 1,
      shouldTrack: true,
    });
  });
});
