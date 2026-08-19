import { describe, expect, it } from "vitest";
import { saveTimerSession } from "./timerSession";
import { getEarlyEndSavePlan } from "./timerEarlyEnd";
import { shouldApplyLaunchConfig } from "../hooks/useBackgroundTimerSession";
import {
  RUNNING_GOAL_DEFAULT,
  RUNNING_GOAL_MAX,
  RUNNING_GOAL_MIN,
  RUNNING_GOAL_MIN_MESSAGE,
  RUNNING_GOAL_PRESETS,
  buildRunningLaunchConfig,
  parseRunningGoalMinutes,
} from "./runningGoal";

describe("running planned minutes", () => {
  it("직접 입력 5분은 시작 가능하다", () => {
    expect(parseRunningGoalMinutes(5)).toBe(5);
    expect(parseRunningGoalMinutes("5")).toBe(5);
  });

  it("직접 입력 4분은 시작 불가하다", () => {
    expect(parseRunningGoalMinutes(4)).toBeNull();
    expect(parseRunningGoalMinutes("4")).toBeNull();
  });

  it("0은 시작 불가하다", () => {
    expect(parseRunningGoalMinutes(0)).toBeNull();
    expect(parseRunningGoalMinutes("0")).toBeNull();
  });

  it("빈 값은 시작 불가하다", () => {
    expect(parseRunningGoalMinutes("")).toBeNull();
    expect(parseRunningGoalMinutes(null)).toBeNull();
    expect(parseRunningGoalMinutes(undefined)).toBeNull();
  });

  it("음수/잘못된 입력은 시작 불가하다", () => {
    expect(parseRunningGoalMinutes(-3)).toBeNull();
    expect(parseRunningGoalMinutes("-3")).toBeNull();
    expect(parseRunningGoalMinutes("abc")).toBeNull();
    expect(parseRunningGoalMinutes("5분")).toBeNull();
    expect(parseRunningGoalMinutes(5.5)).toBeNull();
    expect(parseRunningGoalMinutes("5.5")).toBeNull();
    expect(parseRunningGoalMinutes(NaN)).toBeNull();
  });

  it("30/45/60 preset은 기존처럼 정상이다", () => {
    expect(RUNNING_GOAL_PRESETS).toEqual([30, 45, 60]);
    expect(RUNNING_GOAL_PRESETS.map(parseRunningGoalMinutes)).toEqual([
      30, 45, 60,
    ]);
  });

  it("기본값 30분을 유지한다", () => {
    expect(RUNNING_GOAL_DEFAULT).toBe(30);
    expect(parseRunningGoalMinutes(RUNNING_GOAL_DEFAULT)).toBe(30);
  });

  it("5분 직접 입력 시작은 러닝 launch를 5분으로 구성한다", () => {
    expect(RUNNING_GOAL_MIN).toBe(5);
    expect(RUNNING_GOAL_MIN_MESSAGE).toBe(
      "러닝은 최소 5분부터 설정할 수 있어요."
    );
    expect(buildRunningLaunchConfig(5)).toEqual({
      id: "running-time-5",
      title: "러닝",
      description: "시간 목표 러닝",
      rounds: 1,
      workSeconds: 300,
      restSeconds: 0,
      logType: "러닝",
      routineTitle: "러닝 · 5분",
      workoutDetails: "",
    });
  });

  it("기존 최대값은 유지하고 새 최대값을 만들지 않는다", () => {
    expect(RUNNING_GOAL_MAX).toBe(180);
    expect(parseRunningGoalMinutes(180)).toBe(180);
    expect(parseRunningGoalMinutes(181)).toBe(180);
  });
});

describe("running P1 regressions stay separate from planned minimum", () => {
  it("30분 러닝 중간 종료는 실제 경과 분만 기록한다", () => {
    expect(
      getEarlyEndSavePlan({
        curriculumLogType: "러닝",
        hasStartedSession: true,
        phase: "work",
        currentRound: 1,
        totalRounds: 1,
        remainingTime: 1620,
        workSecondsSetting: 1800,
      })
    ).toEqual({
      kind: "running",
      minutes: 3,
      rounds: 1,
      elapsedSeconds: 180,
    });
  });

  it("active session launch protection을 유지한다", () => {
    sessionStorage.clear();
    saveTimerSession({
      hasStartedSession: true,
      phase: "work",
      isRunning: true,
      currentRound: 1,
      totalRounds: 3,
      remainingTime: 120,
      workSecondsSetting: 180,
      restSecondsSetting: 30,
      updatedAt: Date.now(),
    });

    expect(
      shouldApplyLaunchConfig({
        rounds: 1,
        workSeconds: 300,
        restSeconds: 0,
        logType: "러닝",
        autoStart: true,
      })
    ).toBe(false);
  });
});
