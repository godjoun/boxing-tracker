import { useEffect, useState } from "react";
import FeatureLockScreen from "../components/FeatureLockScreen";
import { getUnlockLevel, isSparringUnlocked } from "../utils/featureUnlocks";
import { getLevelTitle } from "../utils/fighterTitles";
import NearbyGymsPanel from "./dojoBreaker/NearbyGymsPanel";
import SparringPartnerPanel from "./dojoBreaker/SparringPartnerPanel";

export default function GymFinderPage({
  initialView = "hub",
  fighterLevel = 1,
  onGoBack,
  onStartTraining,
}) {
  const [view, setView] = useState(initialView);
  const sparringLocked = !isSparringUnlocked(fighterLevel);
  const sparringLevel = getUnlockLevel("sparring");

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
      <main className="gym-page gym-page-sub">
        <NearbyGymsPanel onGoBack={() => setView("hub")} />
      </main>
    );
  }

  if (view === "sparring") {
    return (
      <main className="gym-page gym-page-sub">
        <SparringPartnerPanel onGoBack={() => setView("hub")} />
      </main>
    );
  }

  return (
    <main className="gym-page gym-page-hub">
      <header className="gym-hub-header">
        <button className="category-back" type="button" onClick={onGoBack}>
          ← 뒤로
        </button>
        <h1>도장</h1>
        <p>근처 체육관을 찾거나, 레벨이 되면 스파링 상대를 고르세요.</p>
      </header>

      <div className="gym-hub-status" aria-label="이용 가능 기능">
        <span className="is-on">체육관 · 바로 가능</span>
        <span className={sparringLocked ? "is-locked" : "is-on"}>
          스파링 ·{" "}
          {sparringLocked
            ? `LV.${sparringLevel} ${getLevelTitle(sparringLevel).ko}`
            : "열림"}
        </span>
      </div>

      <div className="gym-hub-actions">
        <button
          type="button"
          className="gym-hub-action"
          onClick={() => openFeature("gyms")}
        >
          <strong>주변 체육관</strong>
          <span>거리순으로 찾고 체험 문의</span>
        </button>
        <button
          type="button"
          className={`gym-hub-action${sparringLocked ? " is-locked" : ""}`}
          onClick={() => openFeature("sparring")}
        >
          <strong>스파링 상대</strong>
          <span>
            {sparringLocked
              ? `LV.${sparringLevel} 해금`
              : "체급·경력으로 매칭"}
          </span>
        </button>
      </div>
    </main>
  );
}
