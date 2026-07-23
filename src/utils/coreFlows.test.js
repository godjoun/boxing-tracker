import { describe, expect, it } from "vitest";
import {
  buildStyleDrillSession,
  getStyleCategories,
  getTechniqueCatalog,
} from "./techniqueCatalog";
import {
  buildStrengthDayLaunch,
  getStrengthDay,
  STRENGTH_WARMUP,
} from "./strengthProgram";
import {
  buildScheduleSummary,
  resolveSessionTimerConfig,
} from "./curriculumTimerSync";
import { buildTimerSnapshot } from "./timerPagePersistence";
import {
  createBackupPayload,
  mergeLogs,
  parseBackupFileText,
} from "./dataBackup";
import { reconcileTimerSession } from "./timerSession";
import { toPublicSparringPartner } from "./sparringInterest";

describe("스타일 기술 흐름", () => {
  it("스타일을 개요·흐름·단계 카테고리로 분리한다", () => {
    const style = getTechniqueCatalog()[0];
    const categories = getStyleCategories(style);

    expect(categories[0].kind).toBe("overview");
    expect(categories[1].kind).toBe("flow");
    expect(categories.filter((item) => item.kind === "stage")).toHaveLength(
      style.stages.length
    );
  });

  it("드릴은 3분 기준이며 준비시간을 10초로 자동 적용한다", () => {
    const style = getTechniqueCatalog()[0];
    const session = buildStyleDrillSession(style, style.stages[0]);
    const timer = resolveSessionTimerConfig(session);

    expect(session.styleId).toBe(style.id);
    expect(timer.rounds).toBe(session.rounds);
    expect(timer.workSeconds).toBe(180);
    expect(timer.prepSeconds).toBe(10);
    expect(timer.syncedDrills).toHaveLength(session.rounds);
  });
});

describe("신체 요일 타이머", () => {
  it("줄넘기 워밍업과 선택한 요일 운동을 한 세션으로 합친다", () => {
    const monday = getStrengthDay("mon");
    const launch = buildStrengthDayLaunch(monday);

    expect(launch.rounds).toBe(
      STRENGTH_WARMUP.rounds + monday.timer.rounds
    );
    expect(launch.strengthPlan.blocks).toEqual(monday.blocks);
    expect(launch.canSkipStrengthWarmup).toBe(true);
  });

  it("줄넘기 제외 시 본운동 라운드만 남긴다", () => {
    const monday = getStrengthDay("mon");
    const launch = buildStrengthDayLaunch(monday, { skipWarmup: true });

    expect(launch.rounds).toBe(monday.timer.rounds);
    expect(launch.strengthPlan.warmupRounds).toBe(0);
    expect(launch.canSkipStrengthWarmup).toBe(false);
  });
});

describe("타이머 지속성과 진행", () => {
  it("신체 가이드를 스냅샷에 보존한다", () => {
    const launch = buildStrengthDayLaunch(getStrengthDay("thu"));
    const snapshot = buildTimerSnapshot({
      selectedPresetId: launch.presetId,
      curriculumDrills: launch.curriculumDrills,
      strengthDayId: launch.strengthDayId,
      canSkipStrengthWarmup: launch.canSkipStrengthWarmup,
      strengthPlan: launch.strengthPlan,
      totalRounds: launch.rounds,
      workSecondsSetting: launch.workSeconds,
      restSecondsSetting: launch.restSeconds,
      currentRound: 1,
      phase: "work",
      remainingTime: launch.workSeconds,
      isRunning: false,
      hasStartedSession: false,
      hasSavedLog: false,
      soundMode: "basic",
      routineTitle: launch.routineTitle,
    });

    expect(snapshot.strengthDayId).toBe("thu");
    expect(snapshot.strengthPlan.theme).toBe(launch.strengthPlan.theme);
  });

  it("경과 시간만큼 운동·휴식·다음 라운드로 자동 진행한다", () => {
    const start = 1_000_000;
    const reconciled = reconcileTimerSession(
      {
        isRunning: true,
        phase: "work",
        currentRound: 1,
        totalRounds: 2,
        remainingTime: 10,
        workSecondsSetting: 10,
        restSecondsSetting: 5,
        updatedAt: start,
      },
      start + 16_000
    );

    expect(reconciled.phase).toBe("work");
    expect(reconciled.currentRound).toBe(2);
    expect(reconciled.remainingTime).toBe(9);
  });

  it("세션 요약은 라운드 기준을 그대로 표시한다", () => {
    expect(
      buildScheduleSummary({
        prepSeconds: 10,
        rounds: 3,
        workSeconds: 180,
        restSeconds: 30,
        cooldownSeconds: 0,
      })
    ).toBe("3R × 3분 · 휴식 30초");
  });
});

describe("백업", () => {
  it("내보낸 JSON을 다시 읽고 같은 ID 기록을 중복 없이 합친다", () => {
    const payload = createBackupPayload({
      logs: [{ id: "log-1", date: "2026-07-23", rounds: 3 }],
      feed: [],
      profile: { nickname: "ANIMA", contact: "010-0000-0000" },
      mode: "solo",
    });
    const parsed = parseBackupFileText(JSON.stringify(payload));
    const merged = mergeLogs(
      [{ id: "log-1", date: "2026-07-22", rounds: 1 }],
      parsed.data.logs
    );

    expect(merged).toHaveLength(1);
    expect(merged[0].rounds).toBe(3);
    expect(parsed.data.profile.contact).toBeUndefined();
  });
});

describe("라이벌 공개 카드", () => {
  it("공개 카드에서는 연락처를 제거한다", () => {
    const publicCard = toPublicSparringPartner({
      id: "sparring-1",
      nickname: "복서",
      area: "강남",
      contact: "010-0000-0000",
    });

    expect(publicCard).toEqual({
      id: "sparring-1",
      nickname: "복서",
      area: "강남",
    });
  });
});
