const THEME_STORAGE_KEY = "round-on-theme";

export function getStoredTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "light" || saved === "dark") {
      return saved;
    }
  } catch {
    // ignore
  }

  return "light";
}

export function setStoredTheme(theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore
  }
}

/**
 * @param {"light"|"dark"} theme
 * @param {{ force?: boolean }} [options]
 *   force: splash 제거 직전 등 — 스플래시가 있어도 저장 테마를 문서에 적용
 */
export function applyDocumentTheme(theme, options = {}) {
  const next = theme === "light" ? "light" : "dark";
  // 스플래시가 떠 있는 동안 기본은 라이트 캔버스 유지(하단 틈 방지).
  // reveal 시에는 force로 최종 테마를 먼저 깐다.
  const splashUp = Boolean(document.getElementById("boot-splash"));
  const paint = !options.force && splashUp ? "light" : next;

  document.documentElement.dataset.theme = paint;
  document.documentElement.style.colorScheme = paint;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", paint === "light" ? "#ffffff" : "#0a0909");
  }
}
