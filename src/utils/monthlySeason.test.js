import { describe, expect, it } from "vitest";
import { getCareerTierState } from "./monthlySeason";

describe("커리어 티어 상태", () => {
  it.each([
    [1, "일반인", 16, 15, 0],
    [15, "일반인", 16, 1, 93],
    [16, "아마추어", 36, 20, 0],
    [35, "아마추어", 36, 1, 95],
    [36, "세미프로", 51, 15, 0],
    [75, "프로", 76, 1, 96],
    [76, "챔피언", 96, 20, 0],
    [95, "챔피언", 96, 1, 95],
    [96, "레전드", null, 0, 100],
  ])(
    "LV.%i는 %s 티어와 다음 조건을 계산한다",
    (level, stage, nextLevel, levelsToNextTier, progressPercent) => {
      const state = getCareerTierState(level);

      expect(state.current.stage).toBe(stage);
      expect(state.next?.from ?? null).toBe(nextLevel);
      expect(state.levelsToNextTier).toBe(levelsToNextTier);
      expect(state.progressPercent).toBe(progressPercent);
    }
  );

  it("현재·완료·잠금 상태와 실제 해금 보상을 연결한다", () => {
    const state = getCareerTierState(76);
    const [civilian, amateur, semipro, pro, champion, legend] = state.tiers;

    expect(civilian.status).toBe("complete");
    expect(amateur.status).toBe("complete");
    expect(semipro.status).toBe("complete");
    expect(pro.status).toBe("complete");
    expect(champion.status).toBe("current");
    expect(legend.status).toBe("locked");
    expect(champion.perks.map((perk) => perk.label)).toEqual([
      "챔피언 카드",
      "챔피언 명패",
    ]);
    expect(legend.perks.map((perk) => perk.label)).toEqual([
      "GOAT 카드",
      "명예의 전당",
    ]);
  });
});
