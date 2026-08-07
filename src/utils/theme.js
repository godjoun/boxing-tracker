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
 * data-theme만 적용. 배경색은 CSS(--root-bg / onboarding :has)에 맡긴다.
 * @param {"light"|"dark"} theme
 */
export function applyDocumentTheme(theme) {
  const next = theme === "light" ? "light" : "dark";

  document.documentElement.dataset.theme = next;
  document.documentElement.style.colorScheme = next;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", next === "dark" ? "#0a0909" : "#ffffff");
  }
}

/**
 * React가 onboarding/home 첫 페인트에 준비되면 #root를 표시한다.
 * branded HTML splash는 없다 — iOS startup image만 splash 역할.
 */
export function revealAppShell() {
  if (typeof document === "undefined") return;
  applyDocumentTheme(getStoredTheme());
  // theme-boot.js의 선행 인라인 배경 제거 → CSS / onboarding :has가 제어
  document.documentElement.style.removeProperty("background-color");
  if (document.body) {
    document.body.style.removeProperty("background-color");
  }
  document.documentElement.classList.add("app-ready");
}
