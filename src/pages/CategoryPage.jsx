import {
  getSparringUnlockProgress,
  getUnlockLevel,
  isFeatureUnlocked,
  SPARRING_UNLOCK_LEVEL,
} from "../utils/featureUnlocks";
import { getLevelTitle } from "../utils/fighterTitles";

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
      {
        id: "curriculum",
        icon: "C",
        title: "홈 커리큘럼",
        description: "복싱장 없이 4주 프로그램",
        route: "curriculum",
        accent: "gold",
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
        description: "명패 · 신체 스펙",
        route: "profile",
        accent: "red",
      },
    ],
  },
  {
    id: "match",
    eyebrow: "MATCH",
    title: "매칭",
    items: [
      {
        id: "gyms",
        icon: "M",
        title: "주변 체육관",
        description: "체육관 찾기",
        route: "gym",
        gymView: "gyms",
        accent: "red",
      },
      {
        id: "sparring",
        icon: "S",
        title: "스파링 상대찾기",
        description: "체급·경력 기반 매칭",
        route: "gym",
        gymView: "sparring",
        accent: "orange",
        featureId: "sparring",
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
    ],
  },
];

export default function CategoryPage({
  fighterLevel = 1,
  onGoHome,
  onNavigate,
  onNavigateGym,
  onOpenCardMaker,
}) {
  const sparringProgress = getSparringUnlockProgress(fighterLevel);
  const sparringTitle = getLevelTitle(SPARRING_UNLOCK_LEVEL);

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

  function renderMenuItem(item) {
    const locked =
      item.featureId && !isFeatureUnlocked(item.featureId, fighterLevel);
    const unlockLevel = item.featureId ? getUnlockLevel(item.featureId) : null;

    return (
      <button
        type="button"
        className={`category-row accent-${item.accent}${
          locked ? " category-row-locked" : ""
        }`}
        key={item.id}
        onClick={() => selectItem(item)}
      >
        <span className="category-row-icon" aria-hidden="true">
          {item.icon}
        </span>
        <span className="category-row-copy">
          <strong>{item.title}</strong>
          <small>
            {locked
              ? `LV.${unlockLevel} ${getLevelTitle(unlockLevel).ko} 칭호 · ${item.description}`
              : item.description}
          </small>
        </span>
        <span className="category-row-arrow" aria-hidden="true">
          {locked ? "🔒" : "→"}
        </span>
      </button>
    );
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
          <span>훈련 · 성장 · 명패 · 매칭 · LV.{fighterLevel}</span>
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
              {group.items.map((item) => renderMenuItem(item))}
            </div>
          </section>
        ))}
      </div>

      {!sparringProgress.unlocked ? (
        <section className="category-unlock-roadmap">
          <div className="category-group-heading">
            <p>SPARRING</p>
            <h2>스파링 준비</h2>
          </div>
          <div className="category-sparring-teaser">
            <p>
              LV.{sparringProgress.unlockLevel}{" "}
              <strong>{sparringTitle.ko}</strong> 칭호를 얻으면 스파링 상대찾기가
              열립니다.
            </p>
            <div className="category-sparring-progress" aria-hidden="true">
              <div
                style={{ width: `${sparringProgress.progressPercent}%` }}
              />
            </div>
            <small>
              현재 LV.{sparringProgress.currentLevel} ·{" "}
              {sparringProgress.levelsToGo}레벨 남음
            </small>
          </div>
        </section>
      ) : null}
    </main>
  );
}
