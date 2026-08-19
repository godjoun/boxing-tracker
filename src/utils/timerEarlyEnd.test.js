import { describe, expect, it } from "vitest";
import {
  canWriteTimerSessionLog,
  getCompletedRoundsSoFar,
  getEarlyEndSavePlan,
  getRunningElapsedWorkSeconds,
  getRunningPartialMinutes,
} from "./timerEarlyEnd";
import { canMarkStyleStageComplete } from "./styleProgress";

function runningWorkState(overrides = {}) {
  return {
    curriculumLogType: "러닝",
    hasStartedSession: true,
    phase: "work",
    currentRound: 1,
    totalRounds: 1,
    remainingTime: 1800,
    workSecondsSetting: 1800,
    restSecondsSetting: 0,
    ...overrides,
  };
}

describe("running early-end record", () => {
  it("1R 러닝 중간 종료는 경과 시간만 1회 기록한다", () => {
    const plan = getEarlyEndSavePlan(
      runningWorkState({
        remainingTime: 1500,
      })
    );

    expect(plan).toEqual({
      kind: "running",
      minutes: 5,
      rounds: 1,
      elapsedSeconds: 300,
    });
    expect(plan.minutes).not.toBe(30);
  });

  it("러닝 시작 직후/경과시간 없음은 기록하지 않는다", () => {
    expect(getEarlyEndSavePlan(runningWorkState())).toBeNull();
    expect(
      getEarlyEndSavePlan(
        runningWorkState({
          phase: "prep",
          remainingTime: 10,
        })
      )
    ).toBeNull();
    expect(
      getEarlyEndSavePlan(
        runningWorkState({
          hasStartedSession: false,
          remainingTime: 1799,
        })
      )
    ).toBeNull();
    expect(getRunningPartialMinutes(0)).toBe(0);
    expect(getRunningPartialMinutes(20)).toBe(0);
  });

  it("예정 시간이 아니라 remainingTime으로 경과 초를 계산한다", () => {
    expect(
      getRunningElapsedWorkSeconds(
        runningWorkState({
          remainingTime: 1740,
        })
      )
    ).toBe(60);
  });
});

describe("non-running early-end rules stay round-based", () => {
  it("일반 복싱 1R WORK 중에는 완료 라운드가 없어 중간 저장하지 않는다", () => {
    expect(
      getCompletedRoundsSoFar({
        hasStartedSession: true,
        phase: "work",
        currentRound: 1,
        totalRounds: 1,
      })
    ).toBe(0);
    expect(
      getEarlyEndSavePlan({
        curriculumLogType: "3R 라운드 훈련",
        hasStartedSession: true,
        phase: "work",
        currentRound: 1,
        totalRounds: 3,
        remainingTime: 90,
        workSecondsSetting: 180,
      })
    ).toBeNull();
  });

  it("기술 중간 종료는 STEP을 완료하지 않는다", () => {
    expect(
      canMarkStyleStageComplete({
        isFullComplete: false,
        styleId: "infighter",
        styleCategoryId: "entry",
      })
    ).toBe(false);

    expect(
      getEarlyEndSavePlan({
        curriculumLogType: "기술 연습",
        hasStartedSession: true,
        phase: "work",
        currentRound: 1,
        totalRounds: 3,
        remainingTime: 90,
        workSecondsSetting: 180,
      })
    ).toBeNull();
  });
});

describe("full complete stays on the planned-minute path", () => {
  it("러닝 정상 완료(phase done)는 partial save 대상이 아니다", () => {
    expect(
      getEarlyEndSavePlan(
        runningWorkState({
          phase: "done",
          remainingTime: 0,
        })
      )
    ).toBeNull();
  });

  it("정상 완료 자동 기록은 이미 저장된 경우 두 번째 로그를 쓰지 않는다", () => {
    expect(
      canWriteTimerSessionLog({ hasSavedLog: false, savedLogFlag: false })
    ).toBe(true);
    expect(
      canWriteTimerSessionLog({ hasSavedLog: true, savedLogFlag: false })
    ).toBe(false);
    expect(
      canWriteTimerSessionLog({ hasSavedLog: false, savedLogFlag: true })
    ).toBe(false);
  });
});
