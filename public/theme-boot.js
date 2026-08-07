/**
 * React 이전 테마만 적용. branded splash와 무관.
 * dark 사용자 light home flash 방지.
 */
(function () {
  try {
    var saved = localStorage.getItem("round-on-theme");
    var theme = saved === "dark" || saved === "light" ? saved : "light";
    var bg = theme === "dark" ? "#0a0909" : "#ffffff";
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document.documentElement.style.backgroundColor = bg;
    if (document.body) {
      document.body.style.backgroundColor = bg;
    }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", bg);
  } catch {
    /* ignore */
  }
})();
