import AppMenuBoard from "../components/AppMenuBoard";

export default function CategoryPage({
  fighterLevel = 1,
  onGoHome,
  onNavigate,
  onNavigateGym,
  onOpenCardMaker,
  onReplayTutorial,
  theme = "dark",
  onToggleTheme,
}) {
  return (
    <main className="category-page">
      <AppMenuBoard
        fighterLevel={fighterLevel}
        variant="category"
        onGoBack={onGoHome}
        onNavigate={onNavigate}
        onNavigateGym={onNavigateGym}
        onOpenCardMaker={onOpenCardMaker}
        onReplayTutorial={onReplayTutorial}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      <footer className="category-legal-links" aria-label="서비스 안내">
        <a
          href={`${import.meta.env.BASE_URL}privacy.html`}
          target="_blank"
          rel="noreferrer"
        >
          개인정보 처리 안내
        </a>
        <span aria-hidden="true">·</span>
        <a
          href={`${import.meta.env.BASE_URL}terms.html`}
          target="_blank"
          rel="noreferrer"
        >
          베타 이용약관
        </a>
      </footer>
    </main>
  );
}
