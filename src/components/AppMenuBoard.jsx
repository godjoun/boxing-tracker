import { useState } from "react";
import { MENU_GROUPS, SETTINGS_MENU_ITEMS } from "../utils/appMenu";
import MenuIcon from "./MenuIcon";

export default function AppMenuBoard({
  showBack = false,
  onGoBack,
  onNavigate,
  onNavigateGym,
  onOpenCardMaker,
  onReplayTutorial,
  theme = "dark",
  onToggleTheme,
}) {
  const [panel, setPanel] = useState("root");

  function selectItem(item) {
    if (item.action === "settings") {
      setPanel("settings");
      return;
    }

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
    return (
      <button
        type="button"
        className="app-menu-row"
        key={item.id}
        onClick={() => (item.onSelect ? item.onSelect() : selectItem(item))}
        aria-label={item.title}
      >
        <span className="app-menu-row-icon" aria-hidden="true">
          <MenuIcon name={item.icon} size={18} />
        </span>
        <span className="app-menu-row-copy">
          <strong>{item.title}</strong>
          <small>{item.description}</small>
        </span>
        <span className="app-menu-row-arrow" aria-hidden="true">
          ›
        </span>
      </button>
    );
  }

  const isSettings = panel === "settings";
  const primaryItems = MENU_GROUPS.flatMap((group) => group.items);

  const settingsRows = [
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
    ...SETTINGS_MENU_ITEMS,
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
        {isSettings || showBack ? (
          <button
            className="app-menu-back"
            type="button"
            onClick={() => {
              if (isSettings) {
                setPanel("root");
                return;
              }
              onGoBack?.();
            }}
            aria-label={isSettings ? "전체 메뉴로 돌아가기" : "홈으로 돌아가기"}
          >
            <span aria-hidden="true">←</span>
          </button>
        ) : null}
        <div className="app-menu-header-copy">
          <h1>{isSettings ? "앱 설정" : "전체 메뉴"}</h1>
        </div>
      </header>

      {isSettings ? (
        <div
          className="app-menu-category-grid"
          role="navigation"
          aria-label="앱 설정"
        >
          <section className="app-menu-group" aria-label="앱 설정 항목">
            <div className="app-menu-row-list">
              {settingsRows.map((item) => renderMenuRow(item))}
            </div>
          </section>
          <footer className="category-legal-links" aria-label="서비스 안내">
            <a
              href={`${import.meta.env.BASE_URL}privacy.html`}
              target="_blank"
              rel="noreferrer"
            >
              개인정보처리방침
            </a>
            <span aria-hidden="true">·</span>
            <a
              href={`${import.meta.env.BASE_URL}terms.html`}
              target="_blank"
              rel="noreferrer"
            >
              이용약관
            </a>
          </footer>
        </div>
      ) : (
        <div
          className="app-menu-category-grid"
          role="navigation"
          aria-label="전체 메뉴"
        >
          <section className="app-menu-group" aria-label="주요 메뉴">
            <div className="app-menu-row-list">
              {primaryItems.map((item) => renderMenuRow(item))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
