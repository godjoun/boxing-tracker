import { describe, expect, it } from "vitest";
import { normalizeStoredTrainingLogs } from "../utils/trainingLogStorage";

describe("normalizeStoredTrainingLogs", () => {
  it("drops malformed storage entries before rendering profile views", () => {
    const logs = normalizeStoredTrainingLogs([
      null,
      "bad-log",
      { id: "rounds", type: "복싱", date: "2026-09-13", rounds: 3 },
      { id: "minutes", type: "러닝", date: "2026-09-13", minutes: 20 },
    ]);

    expect(logs).toHaveLength(2);
    expect(logs.map((log) => log.id)).toEqual(["rounds", "minutes"]);
    expect(logs.every((log) => log && typeof log === "object")).toBe(true);
  });
});
