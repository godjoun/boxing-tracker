import { useEffect, useState } from "react";
import FeatureLockScreen from "../components/FeatureLockScreen";
import { getUnlockLevel, isSparringUnlocked } from "../utils/featureUnlocks";
import NearbyGymsPanel from "./dojoBreaker/NearbyGymsPanel";
import SparringPartnerPanel from "./dojoBreaker/SparringPartnerPanel";

/** 지도 위 탐색 필터 — 검색창 아래 카테고리 칩 */
const MAP_FILTERS = [
  { id: "gyms", label: "체육관" },
  { id: "sparring", label: "라이벌" },
  { id: "meeting", label: "모임" },
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
  onGoHome,
  onGoRivalProfile,
  onStartTraining,
}) {
  const [view, setView] = useState(() => resolveView(initialView));
  const [rivals, setRivals] = useState([]);
  const [rivalBridge, setRivalBridge] = useState(null);
  const [meetingRequest, setMeetingRequest] = useState(0);
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
    <nav className="gym-map-category-chips" aria-label="짐 카테고리">
      {MAP_FILTERS.map((item) => {
        const isSparring = item.id === "sparring";
        const locked = isSparring && sparringLocked;
        const isMeeting = item.id === "meeting";
        const active = !isMeeting && view === item.id;
        return (
          <button
            key={item.id}
            type="button"
            className={`gym-map-category-chip${active ? " is-active" : ""}${
              locked ? " is-locked" : ""
            }`}
            aria-current={active ? "page" : undefined}
            onClick={() => {
              if (isMeeting) {
                setMeetingRequest((value) => value + 1);
                return;
              }
              setView(item.id);
            }}
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
        onGoHome={onGoHome}
        onGoRivalProfile={onGoRivalProfile}
        meetingRequest={meetingRequest}
        rivals={rivals}
        rivalBridge={rivalBridge}
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
            <SparringPartnerPanel
              embedded
              variant="bridge"
              onPartnersChange={setRivals}
              onBridgeReady={setRivalBridge}
            />
          ) : null
        }
      />
    </main>
  );
}
