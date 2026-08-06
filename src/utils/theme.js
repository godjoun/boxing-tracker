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

export function applyDocumentTheme(theme) {
  const next = theme === "light" ? "light" : "dark";
  // 부트 스플래시가 떠 있는 동안은 라이트 캔버스를 유지해
  // iPhone 하단(safe-area)으로 다크 html/body가 비치지 않게 한다.
  const splashUp = Boolean(document.getElementById("boot-splash"));
  const paint = splashUp ? "light" : next;

  document.documentElement.dataset.theme = paint;
  document.documentElement.style.colorScheme = paint;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", paint === "light" ? "#ffffff" : "#0a0909");
  }
}
