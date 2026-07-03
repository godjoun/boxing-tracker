import { useState } from "react";

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
    eyebrow: "CARD & PROFILE",
    title: "카드 / 프로필",
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
        description: "내 파이터",
        route: "profile",
        accent: "red",
      },
    ],
  },
  {
    id: "explore",
    eyebrow: "EXPLORE",
    title: "탐색",
    items: [
      {
        id: "dojo-breaker",
        icon: "🥊",
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
      <header className="category-hero">
        <button className="category-back" onClick={onGoHome}>
          <span>←</span> 홈
        </button>
        <div className="category-hero-copy">
          <p>FIGHTER MENU</p>
          <h1>파이터 메뉴</h1>
          <span>훈련, 성장, 카드, 프로필 기능을 선택하세요.</span>
        </div>
        <div className="category-mark" aria-hidden="true">
          FM
        </div>
      </header>

      <div className="category-groups">
        {MENU_GROUPS.map((group) => (
          <section className="category-group" key={group.id}>
            <div className="category-group-heading">
              <div>
                <p>{group.eyebrow}</p>
                <h2>{group.title}</h2>
              </div>
              <span>{String(group.items.length).padStart(2, "0")}</span>
            </div>

            <div className="category-grid">
              {group.items.map((item) => (
                <button
                  className={`category-item accent-${item.accent}`}
                  key={item.id}
                  onClick={() => selectItem(item)}
                >
                  <span className="category-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <strong>{item.title}</strong>
                  <small>{item.description}</small>
                  <i aria-hidden="true">→</i>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
