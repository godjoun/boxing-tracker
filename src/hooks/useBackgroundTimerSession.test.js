import { beforeEach, describe, expect, it } from "vitest";
import { saveTimerSession } from "../utils/timerSession";
import {
  ACTIVE_SESSION_LAUNCH_BLOCK_MESSAGE,
  shouldApplyLaunchConfig,
} from "./useBackgroundTimerSession";

function saveActiveFreeSession(overrides = {}) {
  saveTimerSession({
    hasStartedSession: true,
    phase: "work",
    isRunning: true,
    currentRound: 1,
    totalRounds: 3,
    remainingTime: 120,
    workSecondsSetting: 180,
    restSecondsSetting: 30,
    curriculumSessionId: null,
    styleId: null,
    curriculumLogType: "",
    updatedAt: Date.now(),
    ...overrides,
  });
}

const FREE_LAUNCH = {
  rounds: 3,
  workSeconds: 180,
  restSeconds: 30,
  autoStart: true,
};

const RUNNING_LAUNCH = {
  rounds: 1,
  workSeconds: 1800,
  restSeconds: 0,
  logType: "러닝",
  autoStart: true,
};

const CURRICULUM_LAUNCH = {
  curriculumSessionId: "w1-s1",
  autoStart: true,
};

const STYLE_LAUNCH = {
  styleId: "infighter",
  styleCategoryId: "entry",
  autoStart: true,
};

describe("active session launch conflict", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("안내 문구를 고정한다", () => {
    expect(ACTIVE_SESSION_LAUNCH_BLOCK_MESSAGE).toBe(
      "진행 중인 훈련이 있습니다. 먼저 완료하거나 종료해주세요."
    );
  });

  it("active free session + 새 free launch → 기존 session 유지", () => {
    saveActiveFreeSession();
    expect(shouldApplyLaunchConfig(FREE_LAUNCH)).toBe(false);
  });

  it("active free session + running launch → 기존 session 유지", () => {
    saveActiveFreeSession();
    expect(shouldApplyLaunchConfig(RUNNING_LAUNCH)).toBe(false);
  });

  it("active free session + curriculum launch → 기존 session 유지", () => {
    saveActiveFreeSession();
    expect(shouldApplyLaunchConfig(CURRICULUM_LAUNCH)).toBe(false);
  });

  it("active free session + style launch → 기존 session 유지", () => {
    saveActiveFreeSession();
    expect(shouldApplyLaunchConfig(STYLE_LAUNCH)).toBe(false);
  });

  it("done session + 새 launch → 정상 시작 가능", () => {
    saveActiveFreeSession({
      phase: "done",
      isRunning: false,
      remainingTime: 0,
    });

    expect(shouldApplyLaunchConfig(FREE_LAUNCH)).toBe(true);
    expect(shouldApplyLaunchConfig(RUNNING_LAUNCH)).toBe(true);
    expect(shouldApplyLaunchConfig(CURRICULUM_LAUNCH)).toBe(true);
    expect(shouldApplyLaunchConfig(STYLE_LAUNCH)).toBe(true);
  });

  it("active session이 없으면 기존 launch를 허용한다", () => {
    expect(shouldApplyLaunchConfig(FREE_LAUNCH)).toBe(true);
    expect(shouldApplyLaunchConfig(CURRICULUM_LAUNCH)).toBe(true);
    expect(shouldApplyLaunchConfig(STYLE_LAUNCH)).toBe(true);
  });
});
