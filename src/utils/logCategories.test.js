import { describe, expect, it } from "vitest";
import {
  getLogSummary,
  getRunningPaceLabel,
  inferLogCategory,
  normalizeLogCategory,
} from "./logCategories";
import { calculateLogScore } from "./trainingStats";

describe("운동 기록 카테고리", () => {
  it("기존 기록의 운동 이름으로 카테고리를 안전하게 추론한다", () => {
    expect(inferLogCategory({ type: "샌드백" })).toBe("boxing");
    expect(inferLogCategory({ type: "러닝" })).toBe("running");
    expect(inferLogCategory({ type: "신체 · 월요일" })).toBe("weights");
    expect(inferLogCategory({ type: "걷기" })).toBe("walking");
  });

  it("기존 기록의 표시 이름은 바꾸지 않는다", () => {
    const log = normalizeLogCategory({
      type: "기술 · 홈복싱 1주차",
      minutes: 30,
    });

    expect(log.category).toBe("boxing");
    expect(log.type).toBe("기술 · 홈복싱 1주차");
  });

  it("러닝 페이스와 웨이트 요약을 계산한다", () => {
    expect(getRunningPaceLabel(5, 30)).toBe("6'00\" /km");
    expect(
      getLogSummary({
        category: "weights",
        type: "웨이트",
        metrics: { exerciseName: "스쿼트", sets: 3, weightKg: 40 },
      }),
    ).toBe("스쿼트 · 3세트 · 40kg");
  });

  it("웨이트는 시간 없이도 세트 수로 기록 점수를 만든다", () => {
    expect(
      calculateLogScore({
        category: "weights",
        metrics: { sets: 3 },
        minutes: 0,
        rounds: 0,
        difficulty: "normal",
      }),
    ).toBe(18);
  });
});
