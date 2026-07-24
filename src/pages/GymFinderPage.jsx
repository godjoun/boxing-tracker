import { useEffect, useState } from "react";
import FeatureLockScreen from "../components/FeatureLockScreen";
import { getUnlockLevel, isSparringUnlocked } from "../utils/featureUnlocks";
import NearbyGymsPanel from "./dojoBreaker/NearbyGymsPanel";
import SparringPartnerPanel from "./dojoBreaker/SparringPartnerPanel";

/** 지도 위 탐색 필터 — 검색창 오른쪽 칩 */
const MAP_FILTERS = [
  { id: "gyms", label: "체육관" },
  { id: "sparring", label: "라이벌" },
];

function resolveView(view) {
  if (view === "gyms" || view === "sparring" || view === "favorites") {
    return view;
  }
  if (view === "sparring-lock") {
    return "sparring";
  }
  return "gyms";
}

export default function GymFinderPage({
  initialView = "gyms",
  fighterLevel = 1,
  onStartTraining,
}) {
  const [view, setView] = useState(() => resolveView(initialView));
  const [rivals, setRivals] = useState([]);
  const sparringLocked = !isSparringUnlocked(fighterLevel);
  const sparringLevel = getUnlockLevel("sparring");
  const activeLabel =
    view === "favorites"
      ? "찜"
      : MAP_FILTERS.find((item) => item.id === view)?.label || "체육관";

  useEffect(() => {
    const timer = window.setTimeout(
      () => setView(resolveView(initialView)),
      0
    );
    return () => window.clearTimeout(timer);
  }, [initialView]);

  const categoryNav = (
    <nav className="gym-map-category-tabs is-search-row" aria-label="짐 필터">
      {MAP_FILTERS.map((item) => {
        const isSparring = item.id === "sparring";
        const locked = isSparring && sparringLocked;
        const active = view === item.id;
        return (
          <button
            key={item.id}
            type="button"
            className={`gym-map-category-tab${active ? " is-active" : ""}${
              locked ? " is-locked" : ""
            }`}
            aria-current={active ? "page" : undefined}
            onClick={() => setView(item.id)}
          >
            {item.label}
            {locked ? <em>LV.{sparringLevel}</em> : null}
          </button>
        );
      })}
    </nav>
  );

  return (
    <main className="gym-map-service" aria-label={activeLabel}>
      <NearbyGymsPanel
        activeLayer={view}
        categoryNav={categoryNav}
        onSelectLayer={setView}
        rivals={rivals}
        rivalContent={
          view === "sparring" && sparringLocked ? (
            <FeatureLockScreen
              featureId="sparring"
              currentLevel={fighterLevel}
              onBack={() => setView("gyms")}
              onStartTraining={onStartTraining}
              embedded
            />
          ) : view === "sparring" ? (
            <SparringPartnerPanel embedded onPartnersChange={setRivals} />
          ) : null
        }
      />
    </main>
  );
}
