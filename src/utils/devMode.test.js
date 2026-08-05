import { describe, expect, it } from "vitest";
import { DEV_LEVEL_BOOST_LOG_ID, isDevSurfaceLog } from "./devMode";

describe("isDevSurfaceLog", () => {
  it("개발 부스트·source=dev 로그를 표면에서 가린다", () => {
    expect(isDevSurfaceLog({ id: DEV_LEVEL_BOOST_LOG_ID })).toBe(true);
    expect(isDevSurfaceLog({ source: "dev" })).toBe(true);
    expect(isDevSurfaceLog({ type: "개발 부스트" })).toBe(true);
  });

  it("일반 기록은 통과시킨다", () => {
    expect(
      isDevSurfaceLog({ id: "log-1", type: "복싱", source: "timer" })
    ).toBe(false);
  });
});
