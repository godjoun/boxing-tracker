import AppMenuBoard from "../components/AppMenuBoard";

export default function CategoryPage({
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
        onGoBack={onGoHome}
        onNavigate={onNavigate}
        onNavigateGym={onNavigateGym}
        onOpenCardMaker={onOpenCardMaker}
        onReplayTutorial={onReplayTutorial}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
    </main>
  );
}
