import { useState } from "react";
import NearbyGymsPanel from "./dojoBreaker/NearbyGymsPanel";
import SparringPartnerPanel from "./dojoBreaker/SparringPartnerPanel";

const FEATURES = [
  {
    id: "gyms",
    icon: "M",
    eyebrow: "NEARBY GYMS",
    title: "주변 체육관 찾기",
    description: "자체 데이터 기반 체육관 · 스파링",
    accent: "red",
  },
  {
    id: "sparring",
    icon: "S",
    eyebrow: "SPARRING MATCH",
    title: "스파링 상대 찾기",
    description: "체급·경력 기반 매칭",
    accent: "orange",
  },
];

export default function GymFinderPage({ onGoBack }) {
  const [view, setView] = useState("hub");

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
          <span>자체 데이터로 체육관과 스파링 상대를 찾습니다.</span>
        </div>
      </header>

      <section className="dojo-feature-grid">
        {FEATURES.map((feature) => (
          <button
            className={`dojo-feature-card accent-${feature.accent}`}
            key={feature.id}
            type="button"
            onClick={() => setView(feature.id)}
          >
            <span className="dojo-feature-icon" aria-hidden="true">
              {feature.icon}
            </span>
            <p>{feature.eyebrow}</p>
            <strong>{feature.title}</strong>
            <small>{feature.description}</small>
            <i aria-hidden="true">→</i>
          </button>
        ))}
      </section>
    </main>
  );
}
