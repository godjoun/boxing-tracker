import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadTimerSession,
  reconcileTimerSession,
  saveTimerSession,
} from "./timerSession";
import { buildTimerSnapshot } from "./timerPagePersistence";

describe("reconcileTimerSession wall-clock catch-up", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("실행 중 30초 경과 시 remainingTime이 30초 감소한다", () => {
    const start = 1_000_000;
    const reconciled = reconcileTimerSession(
      {
        isRunning: true,
        phase: "work",
        currentRound: 1,
        totalRounds: 3,
        remainingTime: 150,
        workSecondsSetting: 180,
        restSecondsSetting: 30,
        updatedAt: start,
      },
      start + 30_000
    );

    expect(reconciled.remainingTime).toBe(120);
    expect(reconciled.phase).toBe("work");
    expect(reconciled.currentRound).toBe(1);
  });

  it("prep 중 복귀 시 준비 시간을 차감한다", () => {
    const start = 1_000_000;
    const reconciled = reconcileTimerSession(
      {
        isRunning: true,
        phase: "prep",
        currentRound: 1,
        totalRounds: 3,
        remainingTime: 10,
        workSecondsSetting: 180,
        restSecondsSetting: 30,
        updatedAt: start,
      },
      start + 4_000
    );

    expect(reconciled.phase).toBe("prep");
    expect(reconciled.remainingTime).toBe(6);
  });

  it("prep이 끝나면 work로 넘어간다", () => {
    const start = 1_000_000;
    const reconciled = reconcileTimerSession(
      {
        isRunning: true,
        phase: "prep",
        currentRound: 1,
        totalRounds: 3,
        remainingTime: 10,
        workSecondsSetting: 180,
        restSecondsSetting: 30,
        updatedAt: start,
      },
      start + 12_000
    );

    expect(reconciled.phase).toBe("work");
    expect(reconciled.remainingTime).toBe(178);
  });

  it("work 중 복귀 시 남은 운동 시간만 줄인다", () => {
    const start = 1_000_000;
    const reconciled = reconcileTimerSession(
      {
        isRunning: true,
        phase: "work",
        currentRound: 2,
        totalRounds: 3,
        remainingTime: 90,
        workSecondsSetting: 180,
        restSecondsSetting: 30,
        updatedAt: start,
      },
      start + 20_000
    );

    expect(reconciled.phase).toBe("work");
    expect(reconciled.currentRound).toBe(2);
    expect(reconciled.remainingTime).toBe(70);
  });

  it("rest를 지나 다음 work까지 catch-up한다", () => {
    const start = 1_000_000;
    const reconciled = reconcileTimerSession(
      {
        isRunning: true,
        phase: "work",
        currentRound: 1,
        totalRounds: 3,
        remainingTime: 5,
        workSecondsSetting: 180,
        restSecondsSetting: 30,
        updatedAt: start,
      },
      start + 40_000
    );

    expect(reconciled.phase).toBe("work");
    expect(reconciled.currentRound).toBe(2);
    expect(reconciled.remainingTime).toBe(175);
  });

  it("여러 단계가 지난 뒤 라운드와 phase가 일치한다", () => {
    const start = 1_000_000;
    // work 10 + rest 5 + work 10 + rest 5 = 30초 → round 3 work 시작
    const reconciled = reconcileTimerSession(
      {
        isRunning: true,
        phase: "work",
        currentRound: 1,
        totalRounds: 3,
        remainingTime: 10,
        workSecondsSetting: 10,
        restSecondsSetting: 5,
        updatedAt: start,
      },
      start + 30_000
    );

    expect(reconciled.phase).toBe("work");
    expect(reconciled.currentRound).toBe(3);
    expect(reconciled.remainingTime).toBe(10);
  });

  it("마지막 라운드 종료 후 done이 된다", () => {
    const start = 1_000_000;
    const reconciled = reconcileTimerSession(
      {
        isRunning: true,
        phase: "work",
        currentRound: 2,
        totalRounds: 2,
        remainingTime: 3,
        workSecondsSetting: 180,
        restSecondsSetting: 30,
        cooldownSecondsSetting: 0,
        updatedAt: start,
      },
      start + 5_000
    );

    expect(reconciled.phase).toBe("done");
    expect(reconciled.isRunning).toBe(false);
    expect(reconciled.remainingTime).toBe(0);
  });

  it("cooldown이 있는 세션은 마지막 work 후 cooldown으로 간다", () => {
    const start = 1_000_000;
    const reconciled = reconcileTimerSession(
      {
        isRunning: true,
        phase: "work",
        currentRound: 1,
        totalRounds: 1,
        remainingTime: 2,
        workSecondsSetting: 180,
        restSecondsSetting: 30,
        cooldownSecondsSetting: 20,
        updatedAt: start,
      },
      start + 5_000
    );

    expect(reconciled.phase).toBe("cooldown");
    expect(reconciled.isRunning).toBe(true);
    expect(reconciled.remainingTime).toBe(17);
  });

  it("cooldown이 끝나면 done이 된다", () => {
    const start = 1_000_000;
    const reconciled = reconcileTimerSession(
      {
        isRunning: true,
        phase: "cooldown",
        currentRound: 1,
        totalRounds: 1,
        remainingTime: 5,
        workSecondsSetting: 180,
        restSecondsSetting: 30,
        cooldownSecondsSetting: 20,
        updatedAt: start,
      },
      start + 8_000
    );

    expect(reconciled.phase).toBe("done");
    expect(reconciled.isRunning).toBe(false);
  });

  it("isRunning false는 경과 시간을 무시한다", () => {
    const start = 1_000_000;
    const session = {
      isRunning: false,
      phase: "work",
      currentRound: 1,
      totalRounds: 3,
      remainingTime: 150,
      workSecondsSetting: 180,
      restSecondsSetting: 30,
      updatedAt: start,
    };

    const reconciled = reconcileTimerSession(session, start + 60_000);
    expect(reconciled).toEqual(session);
    expect(reconciled.remainingTime).toBe(150);
  });

  it("동일 시각에 두 번 reconcile해도 이중 차감이 없다", () => {
    const start = 1_000_000;
    const session = {
      isRunning: true,
      phase: "work",
      currentRound: 1,
      totalRounds: 3,
      remainingTime: 150,
      workSecondsSetting: 180,
      restSecondsSetting: 30,
      updatedAt: start,
    };
    const now = start + 30_000;

    const first = reconcileTimerSession(session, now);
    const second = reconcileTimerSession(first, now);

    expect(first.remainingTime).toBe(120);
    expect(second.remainingTime).toBe(120);
    expect(second.phase).toBe(first.phase);
  });

  it("저장된 updatedAt이 복귀 직전 Date.now()로 덮이지 않은 채 보정된다", () => {
    const start = 5_000_000;
    vi.useFakeTimers();
    vi.setSystemTime(start);

    saveTimerSession({
      isRunning: true,
      phase: "work",
      currentRound: 1,
      totalRounds: 3,
      remainingTime: 150,
      workSecondsSetting: 180,
      restSecondsSetting: 30,
      hasStartedSession: true,
      updatedAt: start,
    });

    const storedBefore = loadTimerSession();
    expect(storedBefore.updatedAt).toBe(start);

    // 잘못된 경로: 복귀 순간 스냅샷을 새로 만들면 updatedAt이 지금이 되어 elapsed=0
    vi.setSystemTime(start + 30_000);
    const broken = reconcileTimerSession(
      buildTimerSnapshot({
        ...storedBefore,
        remainingTime: storedBefore.remainingTime,
      }),
      start + 30_000
    );
    expect(broken.remainingTime).toBe(150);

    // 올바른 경로: 저장된 updatedAt 유지
    const correct = reconcileTimerSession(loadTimerSession(), start + 30_000);
    expect(correct.remainingTime).toBe(120);

    vi.useRealTimers();
  });

  it("saveTimerSession은 전달된 updatedAt을 보존한다", () => {
    saveTimerSession({
      isRunning: true,
      phase: "work",
      remainingTime: 100,
      updatedAt: 42,
    });

    expect(loadTimerSession().updatedAt).toBe(42);
  });
});
