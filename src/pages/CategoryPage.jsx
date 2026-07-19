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
      <div className="category-backup-banner">
        <p>
          훈련 기록은 이 기기에 저장됩니다. 기기를 바꾸기 전에 JSON 백업을
          권장해요. 온보딩부터 다시 보기도 여기서 할 수 있습니다.
        </p>
        <button type="button" onClick={() => onNavigate?.("backup")}>
          데이터 백업 · 초기화 →
        </button>
      </div>

      <AppMenuBoard
        fighterLevel={fighterLevel}
        variant="category"
        showBack
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
