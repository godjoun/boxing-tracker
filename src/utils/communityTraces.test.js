import { describe, expect, it } from "vitest";
import { buildCommunityTraces, pickSparringLogs } from "./communityTraces";

describe("communityTraces", () => {
  it("builds trust traces from home gym, meetings, and sparring logs", () => {
    const result = buildCommunityTraces({
      profile: {
        homeGymId: "g1",
        homeGymName: "Mantle Gym",
        homeGymAddress: "Gunsan",
      },
      exchangeEvents: [
        {
          id: "e1",
          title: "주말 스파링",
          gymName: "Mantle Gym",
          startsAt: "2026-08-01T10:00:00",
          isMine: true,
        },
      ],
      sparringLogs: [
        { id: "l1", type: "스파링", rounds: 4, date: "2026-08-02" },
      ],
    });

    expect(result.summary.gymCount).toBe(1);
    expect(result.summary.sparringCount).toBe(1);
    expect(result.summary.exchangeCount).toBe(2);
    expect(result.recent.some((item) => item.type === "모임")).toBe(true);
    expect(result.recent.some((item) => item.type === "스파링")).toBe(true);
  });

  it("does not treat inquiries as traces", () => {
    const result = buildCommunityTraces({
      profile: {},
      exchangeEvents: [{ id: "e2", title: "모집", isMine: false }],
      sparringLogs: [],
    });
    expect(result.recent).toEqual([]);
    expect(result.summary.exchangeCount).toBe(0);
  });

  it("picks sparring logs by type", () => {
    expect(
      pickSparringLogs([
        { id: 1, type: "스파링" },
        { id: 2, type: "러닝" },
      ]).map((log) => log.id)
    ).toEqual([1]);
  });
});
