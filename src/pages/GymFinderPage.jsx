import { useEffect, useState } from "react";
import FeatureLockScreen from "../components/FeatureLockScreen";
import { isSparringUnlocked } from "../utils/featureUnlocks";
import { RELEASE_SCOPE } from "../utils/releaseScope";
import NearbyGymsPanel from "./dojoBreaker/NearbyGymsPanel";
import SparringPartnerPanel from "./dojoBreaker/SparringPartnerPanel";

/** Community IA: feed | hub | gyms | sparring | meeting (+ favorites filter alias) */
function resolveView(view) {
  if (view === "favorites") return "favorites";
  if (
    RELEASE_SCOPE.rivals &&
    (view === "sparring" || view === "sparring-lock" || view === "rivals")
  ) {
    return "sparring";
  }
  if (!RELEASE_SCOPE.dojoServer) {
    return "gyms";
  }
  if (view === "feed" || view === "community") return "feed";
  if (view === "hub" || view === "exchange") return "hub";
  if (view === "gyms") return "gyms";
  if (view === "meeting") return "meeting";
  return "feed";
}

export default function GymFinderPage({
  initialView = "feed",
  fighterLevel = 1,
  onGoRivalProfile,
  onStartTraining,
  focusGymExchangeEventId = null,
  onGymExchangeFocusConsumed,
}) {
  const [view, setView] = useState(() => resolveView(initialView));
  const [rivals, setRivals] = useState([]);
  const [rivalBridge, setRivalBridge] = useState(null);
  const [meetingActive, setMeetingActive] = useState(
    () => resolveView(initialView) === "meeting"
  );
  const sparringLocked = !isSparringUnlocked(fighterLevel);
  const showSparringLock =
    RELEASE_SCOPE.rivals && view === "sparring" && sparringLocked;
  const showRivalBridge = RELEASE_SCOPE.rivals && !showSparringLock;

  const activeLabel =
    view === "meeting" || meetingActive
      ? "모임"
      : view === "sparring"
        ? "스파링"
        : view === "favorites"
          ? "찜한 체육관"
          : view === "hub"
            ? "교류"
            : view === "feed"
              ? "피드"
              : "체육관 찾기";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = resolveView(initialView);
      setMeetingActive(next === "meeting");
      setView(next);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialView]);

  return (
    <main className="gym-map-service" aria-label={activeLabel}>
      <NearbyGymsPanel
        activeLayer={view}
        onSelectLayer={(layer) => {
          const next = resolveView(layer);
          setMeetingActive(next === "meeting");
          setView(next);
        }}
        onMeetingSectionChange={setMeetingActive}
        onGoRivalProfile={onGoRivalProfile}
        rivals={rivals}
        rivalBridge={rivalBridge}
        focusGymExchangeEventId={focusGymExchangeEventId}
        onGymExchangeFocusConsumed={onGymExchangeFocusConsumed}
        rivalContent={
          showSparringLock ? (
            <FeatureLockScreen
              featureId="sparring"
              currentLevel={fighterLevel}
              onBack={() => setView("feed")}
              onStartTraining={onStartTraining}
              embedded
            />
          ) : showRivalBridge ? (
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
