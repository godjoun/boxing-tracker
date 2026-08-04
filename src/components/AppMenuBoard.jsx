import {
  getUnlockLevel,
  isFeatureUnlocked,
} from "../utils/featureUnlocks";
import { MENU_GROUPS } from "../utils/appMenu";
import MenuIcon from "./MenuIcon";

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
  const isHome = variant === "home";

  function selectItem(item) {
    if (item.action === "card-maker") {
      onOpenCardMaker?.();
      return;
    }

    if (item.route === "gym") {
      onNavigateGym?.(item.gymView || "gyms");
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
          <MenuIcon name={item.icon} size={16} />
        </span>
        <strong>{item.title}</strong>
        <small>
          {locked ? `LV.${unlockLevel} 해금` : item.description}
        </small>
        {locked ? <em aria-hidden="true">🔒</em> : null}
      </button>
    );
  }

  function renderMenuRow(item) {
    const locked =
      item.featureId && !isFeatureUnlocked(item.featureId, fighterLevel);
    const unlockLevel = item.featureId ? getUnlockLevel(item.featureId) : null;

    return (
      <button
        type="button"
        className={`app-menu-row${locked ? " is-locked" : ""}`}
        key={item.id}
        onClick={() => (item.onSelect ? item.onSelect() : selectItem(item))}
        aria-label={`${item.title}${locked ? `, 레벨 ${unlockLevel} 해금` : ""}`}
      >
        <span className="app-menu-row-icon" aria-hidden="true">
          <MenuIcon name={item.icon} size={18} />
        </span>
        <span className="app-menu-row-copy">
          <strong>{item.title}</strong>
          {locked ? <small>LV.{unlockLevel} 해금</small> : null}
        </span>
        <span className="app-menu-row-arrow" aria-hidden="true">
          {locked ? "🔒" : "›"}
        </span>
      </button>
    );
  }

  const utilityItems = [
    ...(onToggleTheme
      ? [
          {
            id: "theme",
            icon: theme === "dark" ? "themeLight" : "themeDark",
            title: theme === "dark" ? "라이트 모드" : "다크 모드",
            onSelect: onToggleTheme,
          },
        ]
      : []),
    ...(onReplayTutorial
      ? [
          {
            id: "tutorial",
            icon: "help",
            title: "튜토리얼 다시 보기",
            onSelect: onReplayTutorial,
          },
        ]
      : []),
  ];

  if (!isHome) {
    return (
      <div className="app-menu-board is-category">
        <header className="app-menu-header app-menu-category-header">
          {showBack ? (
            <button
              className="app-menu-back"
              type="button"
              onClick={onGoBack}
              aria-label="홈으로 돌아가기"
            >
              <span aria-hidden="true">←</span>
            </button>
          ) : null}
          <div className="app-menu-header-copy">
            <h1>전체 메뉴</h1>
          </div>
        </header>

        <div className="app-menu-category-grid" role="navigation" aria-label="전체 메뉴">
          {MENU_GROUPS.map((group) => {
            const items =
              group.id === "app"
                ? [...group.items, ...utilityItems]
                : group.items;

            return (
              <section className="app-menu-group-card" key={group.id} aria-labelledby={`menu-group-${group.id}`}>
                <h2 id={`menu-group-${group.id}`}>{group.title}</h2>
                <div className="app-menu-row-list">
                  {items.map((item) => renderMenuRow(item))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="app-menu-board is-home">
      <div className="app-menu-sections">
        {MENU_GROUPS.map((group) => (
          <section className="app-menu-section" key={group.id}>
            <h2>{group.title}</h2>
            <div className="app-menu-grid">
              {group.items.map((item) => renderTile(item))}
              {group.id === "app" && onToggleTheme ? (
                <button
                  type="button"
                  className="app-menu-tile accent-slate"
                  onClick={onToggleTheme}
                >
                  <span className="app-menu-tile-icon" aria-hidden="true">
                    <MenuIcon
                      name={theme === "dark" ? "themeLight" : "themeDark"}
                      size={16}
                    />
                  </span>
                  <strong>
                    {theme === "dark" ? "라이트 모드" : "다크 모드"}
                  </strong>
                  <small>
                    {theme === "dark"
                      ? "밝은 화면으로 전환"
                      : "오일 블랙 화면으로 전환"}
                  </small>
                </button>
              ) : null}
              {group.id === "app" && onReplayTutorial ? (
                <button
                  type="button"
                  className="app-menu-tile accent-slate"
                  onClick={onReplayTutorial}
                >
                  <span className="app-menu-tile-icon" aria-hidden="true">
                    <MenuIcon name="help" size={16} />
                  </span>
                  <strong>튜토리얼</strong>
                  <small>앱 사용법 다시 보기</small>
                </button>
              ) : null}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
