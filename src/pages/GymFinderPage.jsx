import { useEffect, useState } from "react";
import FeatureLockScreen from "../components/FeatureLockScreen";
import { getUnlockLevel, isSparringUnlocked } from "../utils/featureUnlocks";
import NearbyGymsPanel from "./dojoBreaker/NearbyGymsPanel";
import SparringPartnerPanel from "./dojoBreaker/SparringPartnerPanel";

/** 지도 레이어 칩 — 유일한 카테고리 분류 (구글·네이버식 한 줄) */
const MAP_FILTERS = [
  { id: "gyms", label: "체육관" },
  { id: "sparring", label: "라이벌" },
  { id: "favorites", label: "찜" },
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
  const [meetingActive, setMeetingActive] = useState(false);
  const sparringLocked = !isSparringUnlocked(fighterLevel);
  const sparringLevel = getUnlockLevel("sparring");
  const activeLabel = meetingActive
    ? "모임"
    : MAP_FILTERS.find((item) => item.id === view)?.label || "체육관";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMeetingActive(false);
      setView(resolveView(initialView));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialView]);

  const categoryNav = (
    <nav className="gym-map-category-chips" aria-label="짐 카테고리">
      {MAP_FILTERS.map((item) => {
        const isSparring = item.id === "sparring";
        const locked = isSparring && sparringLocked;
        const isMeeting = item.id === "meeting";
        const active = isMeeting ? meetingActive : !meetingActive && view === item.id;
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
                setMeetingActive(true);
                setMeetingRequest((value) => value + 1);
                return;
              }
              setMeetingActive(false);
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
        onSelectLayer={(layer) => {
          setMeetingActive(false);
          setView(layer);
        }}
        onMeetingSectionChange={setMeetingActive}
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
