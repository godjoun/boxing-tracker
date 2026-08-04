import { describe, expect, it } from "vitest";
import { FEATURE_UNLOCKS, isSparringUnlocked } from "./featureUnlocks";
import { MENU_GROUPS } from "./appMenu";
import { RELEASE_SCOPE } from "./releaseScope";

describe("공개 베타 출시 범위", () => {
  it("라이벌·스파링을 출시 메뉴와 커뮤니티에서 숨긴다", () => {
    const menuIds = MENU_GROUPS.flatMap((group) =>
      group.items.map((item) => item.id)
    );

    expect(RELEASE_SCOPE.rivals).toBe(false);
    expect(menuIds).not.toContain("rivals");
    expect(FEATURE_UNLOCKS.map((feature) => feature.id)).not.toContain(
      "sparring"
    );
    expect(isSparringUnlocked(1)).toBe(false);
    expect(isSparringUnlocked(99)).toBe(false);
  });
});
