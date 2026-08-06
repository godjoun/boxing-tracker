import { applyDocumentTheme, getStoredTheme } from "./theme";

/** HTML 최초 페인트용 부트 스플래시 (#boot-splash) 제거 */

export function dismissBootSplash({ fade = true } = {}) {
  if (typeof document === "undefined") return;

  const el = document.getElementById("boot-splash");
  if (!el) return;

  const remove = () => {
    el.remove();
    // 스플래시 동안 강제했던 라이트 캔버스를 저장된 테마로 되돌린다.
    applyDocumentTheme(getStoredTheme());
  };

  if (!fade || el.classList.contains("is-leaving")) {
    remove();
    return;
  }

  el.classList.add("is-leaving");
  window.setTimeout(remove, 380);
}
