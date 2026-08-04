import { describe, expect, it } from "vitest";
import { FEATURE_UNLOCKS, isSparringUnlocked } from "./featureUnlocks";
import { MENU_GROUPS } from "./appMenu";
import { RELEASE_SCOPE } from "./releaseScope";

describe("공개 베타 출시 범위", () => {
  it("라이벌을 커뮤니티 상단 카테고리와 메뉴에 포함한다", () => {
    const menuIds = MENU_GROUPS.flatMap((group) =>
      group.items.map((item) => item.id)
    );

    expect(RELEASE_SCOPE.rivals).toBe(true);
    expect(menuIds).toContain("rivals");
    expect(FEATURE_UNLOCKS.map((feature) => feature.id)).toContain("sparring");
    expect(isSparringUnlocked(1)).toBe(true);
  });
});
