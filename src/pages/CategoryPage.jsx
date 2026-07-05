const MENU_GROUPS = [
  {
    id: "training",
    eyebrow: "TRAINING",
    title: "훈련",
    items: [
      {
        id: "timer",
        icon: "◷",
        title: "오늘 훈련",
        description: "타이머 시작",
        route: "timer",
        accent: "red",
      },
      {
        id: "log",
        icon: "R",
        title: "훈련 로그",
        description: "기록 확인",
        route: "log",
        accent: "orange",
      },
    ],
  },
  {
    id: "growth",
    eyebrow: "GROWTH",
    title: "성장",
    items: [
      {
        id: "stats",
        icon: "↗",
        title: "성장 분석",
        description: "라운드 · 볼륨",
        route: "stats",
        accent: "red",
      },
      {
        id: "weekly",
        icon: "W",
        title: "주간 리포트",
        description: "이번 주 요약",
        route: "weekly",
        accent: "orange",
      },
    ],
  },
  {
    id: "fighter",
    eyebrow: "FIGHTER",
    title: "파이터",
    items: [
      {
        id: "card",
        icon: "◆",
        title: "파이터 카드",
        description: "성장 카드 제작",
        action: "card-maker",
        accent: "gold",
      },
      {
        id: "profile",
        icon: "F",
        title: "MY FIGHTER",
        description: "프로필 · 신체 스펙",
        route: "profile",
        accent: "red",
      },
    ],
  },
  {
    id: "more",
    eyebrow: "MORE",
    title: "더보기",
    items: [
      {
        id: "backup",
        icon: "↓",
        title: "데이터 백업",
        description: "JSON 저장 · 복원",
        route: "backup",
        accent: "orange",
      },
      {
        id: "dojo-breaker",
        icon: "D",
        title: "도장깨기",
        description: "스파링 · 체육관",
        route: "gym",
        accent: "red",
      },
    ],
  },
];

export default function CategoryPage({
  onGoHome,
  onNavigate,
  onOpenCardMaker,
}) {
  function selectItem(item) {
    if (item.action === "card-maker") {
      onOpenCardMaker?.();
      return;
    }

    onNavigate?.(item.route);
  }

  return (
    <main className="category-page">
      <header className="category-hero category-hero-compact">
        <button className="category-back" type="button" onClick={onGoHome}>
          <span aria-hidden="true">←</span>
          홈
        </button>
        <div className="category-hero-copy">
          <p>MENU</p>
          <h1>더보기</h1>
          <span>훈련, 성장, 파이터, 데이터 메뉴</span>
        </div>
      </header>

      <div className="category-groups">
        {MENU_GROUPS.map((group) => (
          <section className="category-group" key={group.id}>
            <div className="category-group-heading">
              <p>{group.eyebrow}</p>
              <h2>{group.title}</h2>
            </div>

            <div className="category-list">
              {group.items.map((item) => (
                <button
                  type="button"
                  className={`category-row accent-${item.accent}`}
                  key={item.id}
                  onClick={() => selectItem(item)}
                >
                  <span className="category-row-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="category-row-copy">
                    <strong>{item.title}</strong>
                    <small>{item.description}</small>
                  </span>
                  <span className="category-row-arrow" aria-hidden="true">
                    →
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
