import {
  getUnlockLevel,
  isFeatureUnlocked,
} from "../utils/featureUnlocks";
import { MENU_GROUPS } from "../utils/appMenu";
import MenuIcon from "./MenuIcon";

export default function AppMenuBoard({
  fighterLevel = 1,
  showBack = false,
  onGoBack,
  onNavigate,
  onNavigateGym,
  onOpenCardMaker,
  onReplayTutorial,
  theme = "dark",
  onToggleTheme,
}) {
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
          <small>
            {locked ? `LV.${unlockLevel} 해금` : item.description}
          </small>
        </span>
        <span className="app-menu-row-arrow" aria-hidden="true">
          {locked ? <MenuIcon name="lock" size={14} /> : "›"}
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
            description:
              theme === "dark"
                ? "밝은 화면으로 전환합니다."
                : "어두운 화면으로 전환합니다.",
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
            description: "앱 사용법을 다시 봅니다.",
            onSelect: onReplayTutorial,
          },
        ]
      : []),
  ];

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
            <section
              className="app-menu-group"
              key={group.id}
              aria-labelledby={`menu-group-${group.id}`}
            >
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
