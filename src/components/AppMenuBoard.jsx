import {
  getSparringUnlockProgress,
  getUnlockLevel,
  isFeatureUnlocked,
  SPARRING_UNLOCK_LEVEL,
} from "../utils/featureUnlocks";
import { getLevelTitle } from "../utils/fighterTitles";
import { MENU_GROUPS } from "../utils/appMenu";

export default function AppMenuBoard({
  fighterLevel = 1,
  variant = "category",
  showBack = false,
  onGoBack,
  onNavigate,
  onNavigateGym,
  onOpenCardMaker,
  onReplayTutorial,
  theme = "dark",
  onToggleTheme,
}) {
  const sparringProgress = getSparringUnlockProgress(fighterLevel);
  const sparringTitle = getLevelTitle(SPARRING_UNLOCK_LEVEL);
  const isHome = variant === "home";

  function selectItem(item) {
    if (item.action === "card-maker") {
      onOpenCardMaker?.();
      return;
    }

    if (item.route === "gym") {
      onNavigateGym?.(item.gymView || "hub");
      return;
    }

    onNavigate?.(item.route);
  }

  function renderTile(item) {
    const locked =
      item.featureId && !isFeatureUnlocked(item.featureId, fighterLevel);
    const unlockLevel = item.featureId ? getUnlockLevel(item.featureId) : null;

    return (
      <button
        type="button"
        className={`app-menu-tile accent-${item.accent}${
          locked ? " is-locked" : ""
        }`}
        key={item.id}
        onClick={() => selectItem(item)}
      >
        <span className="app-menu-tile-icon" aria-hidden="true">
          {item.icon}
        </span>
        <strong>{item.title}</strong>
        <small>
          {locked
            ? `LV.${unlockLevel} 해금`
            : item.description}
        </small>
        {locked ? <em aria-hidden="true">🔒</em> : null}
      </button>
    );
  }

  return (
    <div className={`app-menu-board${isHome ? " is-home" : " is-category"}`}>
      {!isHome ? (
        <header className="app-menu-header">
          {showBack ? (
            <button className="app-menu-back" type="button" onClick={onGoBack}>
              <span aria-hidden="true">←</span>
              홈
            </button>
          ) : null}
          <div className="app-menu-header-copy">
            <h1>{isHome ? "바로가기" : "메뉴"}</h1>
            <span>LV.{fighterLevel}</span>
          </div>
        </header>
      ) : null}

      <div className="app-menu-sections">
        {MENU_GROUPS.map((group) => (
          <section className="app-menu-section" key={group.id}>
            <h2>{group.title}</h2>
            <div className="app-menu-grid">
              {group.items.map((item) => renderTile(item))}
              {group.id === "tools" && onToggleTheme ? (
                <button
                  type="button"
                  className="app-menu-tile accent-slate"
                  onClick={onToggleTheme}
                >
                  <span className="app-menu-tile-icon" aria-hidden="true">
                    {theme === "dark" ? "☀" : "☾"}
                  </span>
                  <strong>{theme === "dark" ? "라이트 모드" : "다크 모드"}</strong>
                  <small>
                    {theme === "dark"
                      ? "밝은 화면으로 전환"
                      : "오일 블랙 화면으로 전환"}
                  </small>
                </button>
              ) : null}
              {group.id === "tools" && onReplayTutorial ? (
                <button
                  type="button"
                  className="app-menu-tile accent-slate"
                  onClick={onReplayTutorial}
                >
                  <span className="app-menu-tile-icon" aria-hidden="true">
                    ?
                  </span>
                  <strong>튜토리얼</strong>
                  <small>앱 사용법 다시 보기</small>
                </button>
              ) : null}
              {group.id === "more" && onReplayTutorial ? (
                <button
                  type="button"
                  className="app-menu-tile accent-slate"
                  onClick={onReplayTutorial}
                >
                  <span className="app-menu-tile-icon" aria-hidden="true">
                    ?
                  </span>
                  <strong>튜토리얼</strong>
                  <small>앱 사용법 다시 보기</small>
                </button>
              ) : null}
            </div>
          </section>
        ))}
      </div>

      {!sparringProgress.unlocked && !isHome ? (
        <div className="app-menu-unlock">
          <span>스파링 해금</span>
          <p>
            도장 → 스파링 탭 · LV.{sparringProgress.unlockLevel}{" "}
            <strong>{sparringTitle.ko}</strong> · {sparringProgress.levelsToGo}
            레벨 남음
          </p>
          <div className="app-menu-unlock-bar" aria-hidden="true">
            <div style={{ width: `${sparringProgress.progressPercent}%` }} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
