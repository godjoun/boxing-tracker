import { describe, expect, it } from "vitest";
import { RECORD_SOURCE } from "./recordSource";
import { calculateLogScore } from "./trainingStats";
import {
  normalizeStoredTrainingLogs,
  normalizeTrainingLog,
} from "./trainingLogStorage";

const timerLog = {
  id: "timer-1",
  type: "1R 라운드 훈련",
  date: "2026-09-25",
  minutes: 1,
  rounds: 1,
  totalRounds: 1,
  completedRounds: 1,
  source: "timer",
  recordSource: RECORD_SOURCE.MANTLE_SESSION,
};

const manualLog = {
  id: "manual-1",
  type: "샌드백",
  date: "2026-09-24",
  minutes: 12,
  rounds: 3,
  source: "manual",
};

describe("훈련 기록 정규화", () => {
  it("null과 비객체 기록만 제거하고 정상 기록 수는 유지한다", () => {
    const logs = normalizeStoredTrainingLogs([
      null,
      "bad-log",
      3,
      timerLog,
      manualLog,
    ]);

    expect(logs).toHaveLength(2);
    expect(logs.map((log) => log.id)).toEqual(["timer-1", "manual-1"]);
  });

  it("timer 기록과 manual 기록의 출처를 유지한다", () => {
    const [timer, manual] = normalizeStoredTrainingLogs([timerLog, manualLog]);

    expect(timer).toMatchObject({
      id: "timer-1",
      type: "1R 라운드 훈련",
      source: "timer",
      recordSource: RECORD_SOURCE.MANTLE_SESSION,
      rounds: 1,
      totalRounds: 1,
      completedRounds: 1,
    });
    expect(manual).toMatchObject({
      id: "manual-1",
      type: "샌드백",
      source: "manual",
      recordSource: RECORD_SOURCE.MANUAL,
      rounds: 3,
    });
  });

  it("legacy rounds 필드만 있는 기록을 지우거나 다른 라운드 값으로 바꾸지 않는다", () => {
    const [roundsOnly] = normalizeStoredTrainingLogs([
      { id: "legacy-rounds", type: "복싱", date: "2026-09-13", rounds: 4 },
    ]);
    const [completedOnly] = normalizeStoredTrainingLogs([
      {
        id: "legacy-completed",
        type: "복싱",
        date: "2026-09-13",
        completedRounds: 2,
      },
    ]);

    expect(roundsOnly.rounds).toBe(4);
    expect(roundsOnly.totalRounds).toBeUndefined();
    expect(completedOnly.completedRounds).toBe(2);
    expect(completedOnly.rounds).toBeUndefined();
  });

  it("수정 초안도 같은 형식으로 정규화한다", () => {
    const updated = normalizeTrainingLog({
      ...manualLog,
      minutes: 15,
      duration: 15,
      rounds: 4,
      totalRounds: 4,
      completedRounds: 4,
      isEdited: true,
    });

    expect(updated).toMatchObject({
      id: "manual-1",
      type: "샌드백",
      source: "manual",
      recordSource: RECORD_SOURCE.MANUAL,
      minutes: 15,
      rounds: 4,
      totalRounds: 4,
      completedRounds: 4,
      isEdited: true,
    });
    expect(updated.score).toBe(calculateLogScore(updated));
  });

  it("백업 복원 입력도 정상 기록 수를 유지하고 점수를 채운다", () => {
    const restored = normalizeStoredTrainingLogs([
      null,
      timerLog,
      { id: "legacy-rounds", type: "복싱", rounds: 2 },
    ]);

    expect(restored).toHaveLength(2);
    expect(restored.map((log) => log.id)).toEqual(["timer-1", "legacy-rounds"]);
    expect(restored.every((log) => Number.isFinite(log.score))).toBe(true);
    expect(restored[1]).toMatchObject({ rounds: 2, type: "복싱" });
  });
});
