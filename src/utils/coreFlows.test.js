import { describe, expect, it } from "vitest";
import {
  buildStyleDrillSession,
  getStyleCategories,
  getStyleDrillWorkSummary,
  getTechniqueCatalog,
} from "./techniqueCatalog";
import {
  buildStrengthDayLaunch,
  getStrengthRoutine,
  resolveStrengthSegment,
  STRENGTH_ROUTINES,
  STRENGTH_TOTAL_SEGMENTS,
  STRENGTH_SEGMENT,
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
import {
  getMatchedSparringProfileIds,
  toPublicSparringPartner,
} from "./sparringInterest";

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
    expect(session.styleCategoryId).toBe(style.stages[0].id);
    expect(timer.rounds).toBe(session.rounds);
    expect(timer.workSeconds).toBe(180);
    expect(timer.prepSeconds).toBe(10);
    expect(timer.syncedDrills).toHaveLength(session.rounds);
  });

  it("기술 STEP 총 운동시간은 rounds × 180초이며 타이머 1R은 3분이다", () => {
    expect(getStyleDrillWorkSummary(3)).toEqual({
      rounds: 3,
      workMinutes: 9,
      summary: "운동 9분 · 3라운드",
    });
    expect(getStyleDrillWorkSummary(4)).toEqual({
      rounds: 4,
      workMinutes: 12,
      summary: "운동 12분 · 4라운드",
    });

    const style = getTechniqueCatalog()[0];
    const threeRound = buildStyleDrillSession(style, style.stages[0]);
    const fourRound = buildStyleDrillSession(style, style.stages[2]);

    expect(threeRound.rounds).toBe(3);
    expect(threeRound.workSeconds).toBe(180);
    expect(fourRound.rounds).toBe(4);
    expect(fourRound.workSeconds).toBe(180);
  });
});

describe("복싱 체력 타이머", () => {
  it("3개 루틴 · 10구간 × 40/20초로 런치한다", () => {
    expect(STRENGTH_ROUTINES).toHaveLength(3);
    const core = getStrengthRoutine("core");
    const launch = buildStrengthDayLaunch(core);

    expect(launch.rounds).toBe(STRENGTH_TOTAL_SEGMENTS);
    expect(launch.workSeconds).toBe(STRENGTH_SEGMENT.workSeconds);
    expect(launch.restSeconds).toBe(STRENGTH_SEGMENT.restSeconds);
    expect(launch.canSkipStrengthWarmup).toBe(false);
    expect(launch.strengthPlan.warmupRounds).toBe(0);
    expect(launch.routineTitle).toBe("10분 코어");
    expect(launch.logType).toBe("신체 · 10분 코어");
    expect(launch.strengthPlan.exercises).toHaveLength(5);
  });

  it("라운드에 맞춰 동작·바퀴를 해석한다", () => {
    const plan = buildStrengthDayLaunch(getStrengthRoutine("legs")).strengthPlan;
    const first = resolveStrengthSegment(plan, 1, "work");
    const sixth = resolveStrengthSegment(plan, 6, "work");
    const rest = resolveStrengthSegment(plan, 1, "rest");

    expect(first.exercise.name).toBe("맨몸 스쿼트");
    expect(first.lap).toBe(1);
    expect(sixth.exercise.name).toBe("맨몸 스쿼트");
    expect(sixth.lap).toBe(2);
    expect(rest.nextExercise.name).toBe("제자리 리버스 런지");
  });

  it("사이드 플랭크·Y/T는 바퀴별로 표시명을 나눈다", () => {
    const core = buildStrengthDayLaunch(getStrengthRoutine("core")).strengthPlan;
    const upper = buildStrengthDayLaunch(getStrengthRoutine("upper")).strengthPlan;

    expect(resolveStrengthSegment(core, 3, "work").exercise.name).toBe(
      "사이드 플랭크 왼쪽"
    );
    expect(resolveStrengthSegment(core, 8, "work").exercise.name).toBe(
      "사이드 플랭크 오른쪽"
    );
    expect(resolveStrengthSegment(upper, 3, "work").exercise.name).toBe(
      "엎드린 Y 레이즈"
    );
    expect(resolveStrengthSegment(upper, 8, "work").exercise.name).toBe(
      "엎드린 T 레이즈"
    );
  });

  it("루틴별 logType이 구분된다", () => {
    expect(buildStrengthDayLaunch(getStrengthRoutine("core")).logType).toBe(
      "신체 · 10분 코어"
    );
    expect(buildStrengthDayLaunch(getStrengthRoutine("legs")).logType).toBe(
      "신체 · 10분 하체"
    );
    expect(buildStrengthDayLaunch(getStrengthRoutine("upper")).logType).toBe(
      "신체 · 10분 상체·어깨"
    );
  });
});

describe("타이머 지속성과 진행", () => {
  it("복싱 체력 가이드를 스냅샷에 보존한다", () => {
    const launch = buildStrengthDayLaunch(getStrengthRoutine("upper"));
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

    expect(snapshot.strengthDayId).toBe("upper");
    expect(snapshot.strengthPlan.title).toBe("10분 상체·어깨");
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
      profile: { nickname: "MANTLE", contact: "010-0000-0000" },
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

  it("같은 상대에게 보낸 관심과 받은 관심이 모두 있어야 매칭한다", () => {
    const matched = getMatchedSparringProfileIds([
      { direction: "sent", profile_id: "profile-a" },
      { direction: "received", profile_id: "profile-a" },
      { direction: "sent", profile_id: "profile-b" },
    ]);

    expect(matched).toEqual(["profile-a"]);
  });
});
