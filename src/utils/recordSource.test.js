import { describe, expect, it } from "vitest";
import {
  RECORD_SOURCE,
  normalizeProofLog,
  resolveRecordSource,
} from "./recordSource";

describe("recordSource", () => {
  it("maps timer source to mantle_session and everything else to manual", () => {
    expect(resolveRecordSource({ source: "timer" })).toBe(
      RECORD_SOURCE.MANTLE_SESSION
    );
    expect(resolveRecordSource({ source: "manual" })).toBe(
      RECORD_SOURCE.MANUAL
    );
    expect(resolveRecordSource({ source: "auto" })).toBe(RECORD_SOURCE.MANUAL);
    expect(resolveRecordSource({})).toBe(RECORD_SOURCE.MANUAL);
    expect(
      resolveRecordSource({
        rounds: 6,
        memo: "6라운드 완료",
      })
    ).toBe(RECORD_SOURCE.MANUAL);
  });

  it("keeps an explicit recordSource", () => {
    expect(
      resolveRecordSource({
        source: "manual",
        recordSource: RECORD_SOURCE.MANTLE_SESSION,
      })
    ).toBe(RECORD_SOURCE.MANTLE_SESSION);
  });

  it("does not invent startedAt/endedAt from createdAt on legacy logs", () => {
    const legacy = {
      id: "old-1",
      date: "2026-08-01",
      type: "3R 라운드 훈련",
      minutes: 9,
      duration: 9,
      rounds: 3,
      source: "timer",
      createdAt: "2026-08-01T10:00:00.000Z",
      memo: "keep me",
    };

    const next = normalizeProofLog(legacy);

    expect(next.id).toBe("old-1");
    expect(next.memo).toBe("keep me");
    expect(next.source).toBe("timer");
    expect(next.recordSource).toBe(RECORD_SOURCE.MANTLE_SESSION);
    expect(next.trainingType).toBe("3R 라운드 훈련");
    expect(next.startedAt).toBeUndefined();
    expect(next.endedAt).toBeUndefined();
    expect(next.createdAt).toBe("2026-08-01T10:00:00.000Z");
  });

  it("keeps explicit null session times instead of filling createdAt", () => {
    const next = normalizeProofLog({
      type: "복싱",
      source: "timer",
      createdAt: "2026-08-01T10:00:00.000Z",
      startedAt: null,
      endedAt: null,
    });

    expect(next.startedAt).toBe(null);
    expect(next.endedAt).toBe(null);
  });

  it("does not invent recordSource as verified boxing", () => {
    const next = normalizeProofLog({ type: "복싱", source: "timer" });
    expect(next.recordSource).toBe("mantle_session");
    expect(JSON.stringify(next)).not.toMatch(/VERIFIED|verified/i);
  });
});
