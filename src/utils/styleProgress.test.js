import { beforeEach, describe, expect, it } from "vitest";
import {
  buildStyleDrillSession,
  getTechniqueCatalog,
} from "./techniqueCatalog";
import {
  buildCurriculumTimerLaunch,
  getCurriculumProgress,
  getCurriculumProgressionView,
  markCurriculumSessionComplete,
} from "./homeCurriculum";
import {
  STYLE_PROGRESS_STORAGE_KEY,
  canMarkStyleStageComplete,
  getLastStyleContinue,
  getNextStyleStage,
  getStyleProgressionView,
  getStyleStageStats,
  getStyleTimerStep,
  isStyleStageComplete,
  markStyleStageComplete,
  previewStyleProgressAfterComplete,
  readStyleProgress,
  recordStyleProgressIfFullComplete,
} from "./styleProgress";

const memoryStore = new Map();

beforeEach(() => {
  memoryStore.clear();
  globalThis.localStorage = {
    getItem: (key) => (memoryStore.has(key) ? memoryStore.get(key) : null),
    setItem: (key, value) => {
      memoryStore.set(key, String(value));
    },
    removeItem: (key) => {
      memoryStore.delete(key);
    },
    clear: () => memoryStore.clear(),
  };
});

describe("style progress", () => {
  it("marks infighter entry as 1/4 and next = inside", () => {
    markStyleStageComplete("infighter", "entry");

    expect(getStyleStageStats("infighter")).toEqual({ completed: 1, total: 4 });
    expect(getNextStyleStage("infighter")?.stageId).toBe("inside");
    expect(isStyleStageComplete("infighter", "entry")).toBe(true);
  });

  it("does not increase when entry is completed again", () => {
    markStyleStageComplete("infighter", "entry");
    markStyleStageComplete("infighter", "entry");

    expect(getStyleStageStats("infighter").completed).toBe(1);
    expect(readStyleProgress().completed.infighter).toEqual(["entry"]);
  });

  it("does not record progress for a partial finish", () => {
    expect(
      canMarkStyleStageComplete({
        isFullComplete: false,
        styleId: "infighter",
        styleCategoryId: "entry",
      })
    ).toBe(false);
    expect(getStyleStageStats("infighter").completed).toBe(0);
  });

  it("marks entry + inside as 2/4 and next = body", () => {
    markStyleStageComplete("infighter", "entry");
    markStyleStageComplete("infighter", "inside");

    expect(getStyleStageStats("infighter")).toEqual({ completed: 2, total: 4 });
    expect(getNextStyleStage("infighter")?.stageId).toBe("body");
  });

  it("returns null next after all 4 stages", () => {
    markStyleStageComplete("infighter", "entry");
    markStyleStageComplete("infighter", "inside");
    markStyleStageComplete("infighter", "body");
    markStyleStageComplete("infighter", "exit");

    expect(getStyleStageStats("infighter")).toEqual({ completed: 4, total: 4 });
    expect(getNextStyleStage("infighter")).toBeNull();
    expect(getLastStyleContinue()).toBeNull();
    expect(getStyleProgressionView("infighter", "exit").next).toBeNull();
  });

  it("does not change 4-week completedSessionIds or 12-session totals", () => {
    markCurriculumSessionComplete("w1-s1");
    const before = getCurriculumProgress();

    markStyleStageComplete("infighter", "entry");
    markStyleStageComplete("infighter", "inside");

    const after = getCurriculumProgress();
    expect(after.completedSessionIds).toEqual(before.completedSessionIds);
    expect(after.completedCount).toBe(1);
    expect(after.totalSessions).toBe(12);
    expect(after.progressPercent).toBe(before.progressPercent);
    expect(getStyleStageStats("infighter").completed).toBe(2);
  });

  it("previewing completion does not write storage", () => {
    const view = getStyleProgressionView("infighter", "entry");
    expect(view.completedCount).toBe(1);
    expect(view.next?.stageId).toBe("inside");
    expect(localStorage.getItem(STYLE_PROGRESS_STORAGE_KEY)).toBeNull();
    expect(getStyleStageStats("infighter").completed).toBe(0);
    expect(previewStyleProgressAfterComplete("infighter", "entry").completed.infighter).toEqual(
      ["entry"]
    );
    expect(getStyleStageStats("infighter").completed).toBe(0);
  });

  it("remembers last style continue as the first incomplete stage", () => {
    markStyleStageComplete("infighter", "entry");
    const cont = getLastStyleContinue();
    expect(cont).toMatchObject({
      styleId: "infighter",
      styleTitle: "인파이터",
      stageId: "inside",
      stageTitle: "안쪽 발싸움",
      order: 2,
    });
  });
});

describe("style timer launch stays out of 4-week progress", () => {
  it("keeps curriculumSessionId null for style drills", () => {
    const style = getTechniqueCatalog().find((item) => item.id === "infighter");
    const session = buildStyleDrillSession(style, style.stages[0]);
    const launch = buildCurriculumTimerLaunch(session);

    expect(session.styleId).toBe("infighter");
    expect(session.styleCategoryId).toBe("entry");
    expect(session.isCustom).toBe(true);
    expect(launch.curriculumSessionId).toBeNull();
    expect(launch.styleId).toBe("infighter");
    expect(launch.styleCategoryId).toBe("entry");
    expect(launch.autoStart).toBe(true);
    expect(launch.workSeconds).toBe(180);
    expect(launch.rounds).toBe(session.rounds);
  });

  it("keeps style round work at 180 even if a short test duration is on the session", () => {
    const style = getTechniqueCatalog().find((item) => item.id === "infighter");
    const session = {
      ...buildStyleDrillSession(style, style.stages[0]),
      workSeconds: 10,
    };
    const launch = buildCurriculumTimerLaunch(session);

    expect(launch.workSeconds).toBe(180);
    expect(launch.rounds).toBe(session.rounds);
    expect(launch.restSeconds).toBe(30);
    expect(launch.prepSeconds).toBe(10);
    expect(launch.autoStart).toBe(true);
  });
});

describe("infighter entry 3R completion pipeline", () => {
  it("full 3R complete records STEP once as 1/4 and next = inside", () => {
    const style = getTechniqueCatalog().find((item) => item.id === "infighter");
    const session = buildStyleDrillSession(style, style.stages[0]);
    const launch = buildCurriculumTimerLaunch(session);

    expect(session.rounds).toBe(3);
    expect(session.styleId).toBe("infighter");
    expect(session.styleCategoryId).toBe("entry");
    expect(launch.curriculumSessionId).toBeNull();
    expect(launch.styleId).toBe("infighter");
    expect(launch.styleCategoryId).toBe("entry");
    expect(launch.rounds).toBe(3);

    const first = recordStyleProgressIfFullComplete({
      isFullComplete: true,
      styleId: launch.styleId,
      styleCategoryId: launch.styleCategoryId,
    });
    const second = recordStyleProgressIfFullComplete({
      isFullComplete: true,
      styleId: launch.styleId,
      styleCategoryId: launch.styleCategoryId,
    });

    expect(first.completed.infighter).toEqual(["entry"]);
    expect(second.completed.infighter).toEqual(["entry"]);
    expect(getStyleStageStats("infighter")).toEqual({ completed: 1, total: 4 });

    const view = getStyleProgressionView(launch.styleId, launch.styleCategoryId);
    expect(view.completedCount).toBe(1);
    expect(view.total).toBe(4);
    expect(view.next).toMatchObject({
      kind: "style",
      styleId: "infighter",
      stageId: "inside",
      title: "안쪽 발싸움",
    });
    expect(getCurriculumProgress().completedSessionIds).toEqual([]);
  });

  it("partial finish does not write style progress", () => {
    const style = getTechniqueCatalog().find((item) => item.id === "infighter");
    const session = buildStyleDrillSession(style, style.stages[0]);
    const launch = buildCurriculumTimerLaunch(session);

    recordStyleProgressIfFullComplete({
      isFullComplete: false,
      styleId: launch.styleId,
      styleCategoryId: launch.styleCategoryId,
    });

    expect(getStyleStageStats("infighter").completed).toBe(0);
    expect(localStorage.getItem(STYLE_PROGRESS_STORAGE_KEY)).toBeNull();
  });

  it("does not record progress when style context is missing at done", () => {
    recordStyleProgressIfFullComplete({
      isFullComplete: true,
      styleId: null,
      styleCategoryId: "entry",
    });

    expect(getStyleStageStats("infighter").completed).toBe(0);
  });
});

describe("curriculum progression view", () => {
  it("shows next session after a completed day without mixing style ids", () => {
    const view = getCurriculumProgressionView("w1-s1");
    expect(view.kind).toBe("curriculum");
    expect(view.code).toBe("DAY 1");
    expect(view.completedCount).toBe(1);
    expect(view.totalSessions).toBe(12);
    expect(view.next?.sessionId).toBe("w1-s2");
    expect(getCurriculumProgress().completedCount).toBe(0);

    markCurriculumSessionComplete("w1-s1");
    const stored = getCurriculumProgressionView("w1-s1");
    expect(stored.completedCount).toBe(1);
    expect(stored.next?.code).toBe("DAY 2");
    expect(getCurriculumProgress().completedSessionIds).not.toContain(
      "style-infighter-entry"
    );
  });
});

describe("style timer step location", () => {
  it("maps infighter stages to STEP n / 4 from the catalog", () => {
    expect(getStyleTimerStep("infighter", "entry")).toMatchObject({
      order: 1,
      total: 4,
      stageTitle: "잽으로 진입",
      currentFlowIndex: 0,
    });
    expect(getStyleTimerStep("infighter", "inside")).toMatchObject({
      order: 2,
      total: 4,
    });
    expect(getStyleTimerStep("infighter", "body")).toMatchObject({
      order: 3,
      total: 4,
    });
    expect(getStyleTimerStep("infighter", "exit")).toMatchObject({
      order: 4,
      total: 4,
    });
    expect(getStyleTimerStep("infighter", "entry").flowSteps).toEqual([
      "진입",
      "안쪽 자리",
      "바디",
      "각도 이탈",
    ]);
  });

  it("has no style step for a free timer session", () => {
    expect(getStyleTimerStep(null, null)).toBeNull();
    expect(getStyleTimerStep("", "")).toBeNull();
    expect(getStyleTimerStep("infighter", "missing")).toBeNull();
  });
});
