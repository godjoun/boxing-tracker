import { describe, expect, it } from "vitest";
import {
  buildHomeDashboard,
  formatLogWhen,
  getDateKey,
  getGreeting,
  getRounds,
} from "./homeDashboard";

describe("home dashboard model", () => {
  it("builds the first-screen summary without developer-only logs", () => {
    const now = new Date(2026, 8, 11, 10);
    const dashboard = buildHomeDashboard(
      [
        { id: "today", date: "2026-09-11", rounds: 3, minutes: 12 },
        { id: "yesterday", date: "2026-09-10", rounds: 1, minutes: 3 },
        { id: "dev-level-boost", date: "2026-09-11", rounds: 999 },
      ],
      now
    );

    expect(dashboard.surfaceLogs).toHaveLength(2);
    expect(dashboard.trainedToday).toBe(true);
    expect(dashboard.todayLogs).toHaveLength(1);
    expect(dashboard.todayMinutes).toBe(12);
    expect(dashboard.totalRounds).toBe(4);
    expect(dashboard.trainingDayCount).toBe(2);
    expect(dashboard.latestLogMetric).toBe("3R");
    expect(dashboard.weekStrip.find((day) => day.label === "금")).toMatchObject({
      isToday: true,
      trained: true,
      rounds: 3,
    });
  });

  it("formats mixed date inputs for home history labels", () => {
    const now = new Date(2026, 8, 11, 10);

    expect(getDateKey("2026-09-11T12:34:00.000Z")).toBe("2026-09-11");
    expect(formatLogWhen({ date: "2026-09-11" }, "2026-09-11", now)).toBe(
      "오늘"
    );
    expect(formatLogWhen({ date: "2026-09-10" }, "2026-09-11", now)).toBe(
      "어제"
    );
    expect(formatLogWhen({ date: "2026-09-01" }, "2026-09-11", now)).toBe(
      "2026.09.01"
    );
  });

  it("keeps legacy round fallbacks used by older records", () => {
    expect(getRounds({ completedRounds: 2 })).toBe(2);
    expect(getRounds({ sets: 4 })).toBe(4);
    expect(getGreeting(new Date(2026, 8, 11, 19))).toBe("좋은 저녁입니다");
  });
});
