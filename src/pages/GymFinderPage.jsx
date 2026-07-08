import { useEffect, useState } from "react";
import FeatureLockScreen from "../components/FeatureLockScreen";
import { getUnlockLevel, isSparringUnlocked } from "../utils/featureUnlocks";
import { getLevelTitle } from "../utils/fighterTitles";
import NearbyGymsPanel from "./dojoBreaker/NearbyGymsPanel";
import SparringPartnerPanel from "./dojoBreaker/SparringPartnerPanel";

const FEATURES = [
  {
    id: "gyms",
    icon: "M",
    eyebrow: "NEARBY GYMS",
    title: "주변 체육관 찾기",
    description: "자체 데이터 기반 체육관 검색",
    accent: "red",
  },
  {
    id: "sparring",
    icon: "S",
    eyebrow: "SPARRING MATCH",
    title: "스파링 상대 찾기",
    description: "체급·경력 기반 매칭",
    accent: "orange",
    featureId: "sparring",
  },
];

export default function GymFinderPage({
  initialView = "hub",
  fighterLevel = 1,
  onGoBack,
  onStartTraining,
}) {
  const [view, setView] = useState(initialView);
  const sparringLocked = !isSparringUnlocked(fighterLevel);

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  function openFeature(featureId) {
    if (featureId === "sparring" && sparringLocked) {
      setView("sparring-lock");
      return;
    }

    setView(featureId);
  }

  if (view === "sparring-lock" || (view === "sparring" && sparringLocked)) {
    return (
      <FeatureLockScreen
        featureId="sparring"
        currentLevel={fighterLevel}
        onBack={() => setView("hub")}
        onStartTraining={onStartTraining}
      />
    );
  }

  if (view === "gyms") {
    return (
      <main className="gym-page">
        <NearbyGymsPanel onGoBack={() => setView("hub")} />
      </main>
    );
  }

  if (view === "sparring") {
    return (
      <main className="gym-page">
        <SparringPartnerPanel onGoBack={() => setView("hub")} />
      </main>
    );
  }

  return (
    <main className="gym-page">
      <header className="gym-hero">
        <button className="category-back" type="button" onClick={onGoBack}>
          <span>←</span> 더보기
        </button>
        <div className="gym-hero-copy">
          <p>DOJO BREAKER</p>
          <h1>도장깨기</h1>
          <span>체육관은 바로 이용하고, 스파링은 성장 후 열립니다.</span>
        </div>
      </header>

      <section className="dojo-feature-grid">
        {FEATURES.map((feature) => {
          const locked =
            feature.featureId === "sparring" && sparringLocked;

          return (
            <button
              className={`dojo-feature-card accent-${feature.accent}${
                locked ? " is-locked" : ""
              }`}
              key={feature.id}
              type="button"
              onClick={() => openFeature(feature.id)}
            >
              <span className="dojo-feature-icon" aria-hidden="true">
                {feature.icon}
              </span>
              <p>{feature.eyebrow}</p>
              <strong>{feature.title}</strong>
              <small>
                {locked
                  ? `LV.${getUnlockLevel("sparring")} ${getLevelTitle(getUnlockLevel("sparring")).ko} 칭호`
                  : feature.description}
              </small>
              <i aria-hidden="true">{locked ? "🔒" : "→"}</i>
            </button>
          );
        })}
      </section>
    </main>
  );
}
