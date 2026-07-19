import { useEffect, useState } from "react";
import FeatureLockScreen from "../components/FeatureLockScreen";
import { getUnlockLevel, isSparringUnlocked } from "../utils/featureUnlocks";
import { getLevelTitle } from "../utils/fighterTitles";
import NearbyGymsPanel from "./dojoBreaker/NearbyGymsPanel";
import SparringPartnerPanel from "./dojoBreaker/SparringPartnerPanel";

function resolveTab(view) {
  if (view === "sparring" || view === "sparring-lock") return "sparring";
  return "gyms";
}

export default function GymFinderPage({
  initialView = "gyms",
  fighterLevel = 1,
  onGoBack,
  onStartTraining,
}) {
  const [tab, setTab] = useState(() => resolveTab(initialView));
  const sparringLocked = !isSparringUnlocked(fighterLevel);
  const sparringLevel = getUnlockLevel("sparring");

  useEffect(() => {
    setTab(resolveTab(initialView));
  }, [initialView]);

  function openTab(nextTab) {
    setTab(nextTab);
  }

  const showSparringLock = tab === "sparring" && sparringLocked;

  return (
    <main className="gym-page gym-page-unified">
      <header className="gym-unified-header">
        <button className="category-back" type="button" onClick={onGoBack}>
          ← 뒤로
        </button>
        <div className="gym-unified-heading">
          <p className="gym-unified-kicker">DOJO</p>
          <h1>도장</h1>
          <p>근처 체육관과 스파링을 한곳에서 찾으세요.</p>
        </div>
      </header>

      <nav className="gym-unified-tabs" aria-label="도장 메뉴">
        <button
          type="button"
          className={`gym-unified-tab${tab === "gyms" ? " is-active" : ""}`}
          onClick={() => openTab("gyms")}
        >
          체육관
        </button>
        <button
          type="button"
          className={`gym-unified-tab${tab === "sparring" ? " is-active" : ""}`}
          onClick={() => openTab("sparring")}
          aria-disabled={sparringLocked}
        >
          스파링
          {sparringLocked ? (
            <em>LV.{sparringLevel}</em>
          ) : null}
        </button>
      </nav>

      <div className="gym-unified-body">
        {showSparringLock ? (
          <FeatureLockScreen
            featureId="sparring"
            currentLevel={fighterLevel}
            onBack={() => openTab("gyms")}
            onStartTraining={onStartTraining}
          />
        ) : null}

        {!showSparringLock && tab === "gyms" ? (
          <NearbyGymsPanel embedded />
        ) : null}

        {!showSparringLock && tab === "sparring" ? (
          <SparringPartnerPanel embedded />
        ) : null}
      </div>

      {sparringLocked && tab === "gyms" ? (
        <p className="gym-unified-unlock-hint">
          스파링은 LV.{sparringLevel} {getLevelTitle(sparringLevel).ko}에서
          열립니다.
        </p>
      ) : null}
    </main>
  );
}
