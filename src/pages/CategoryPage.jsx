import AppMenuBoard from "../components/AppMenuBoard";

export default function CategoryPage({
  fighterLevel = 1,
  onGoHome,
  onNavigate,
  onNavigateGym,
  onOpenCardMaker,
}) {
  return (
    <main className="category-page">
      <AppMenuBoard
        fighterLevel={fighterLevel}
        variant="category"
        showBack
        onGoBack={onGoHome}
        onNavigate={onNavigate}
        onNavigateGym={onNavigateGym}
        onOpenCardMaker={onOpenCardMaker}
      />
    </main>
  );
}
