import { applyDocumentTheme, getStoredTheme } from "./theme";

/**
 * HTML 최초 페인트용 부트 스플래시 (#boot-splash) 제거.
 * 순서: 저장 테마로 root 준비 → splash 제거 → app root 표시.
 * opacity 페이드로 splash/홈을 겹치지 않는다.
 */
export function dismissBootSplash() {
  if (typeof document === "undefined") return;

  const el = document.getElementById("boot-splash");
  const theme = getStoredTheme();

  // 스플래시가 아직 덮고 있는 동안 최종 테마를 문서에 적용한다.
  applyDocumentTheme(theme, { force: true });

  if (el) {
    el.remove();
  }

  document.documentElement.classList.add("app-ready");
}
