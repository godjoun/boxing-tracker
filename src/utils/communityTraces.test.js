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

  it("includes gym exchange participations without win/loss framing", () => {
    const result = buildCommunityTraces({
      profile: {},
      gymExchangeParticipations: [
        {
          eventId: "mantle-gym-exchange-dev-fixture",
          sparringRounds: 4,
          joinedAt: "2026-09-20T10:00:00Z",
        },
      ],
    });

    if (!import.meta.env.DEV) {
      expect(result.recent.some((item) => item.type === "체육관 교류")).toBe(
        false
      );
      return;
    }

    const item = result.recent.find((row) => row.type === "체육관 교류");
    expect(item).toBeTruthy();
    expect(item.title).toContain("×");
    expect(item.meta).toContain("스파링 4R");
    expect(item.meta).not.toMatch(/승|패|랭킹|EXP/i);
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
