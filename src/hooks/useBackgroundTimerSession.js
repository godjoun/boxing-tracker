import { useEffect, useState } from "react";
import {
  getTimerSessionSummary,
  hasActiveTimerSession,
  loadTimerSession,
  reconcileTimerSession,
  saveTimerSession,
} from "../utils/timerSession";
import {
  clearTimerMediaSession,
  updateTimerMediaSession,
} from "../utils/timerMediaSession";

export function useBackgroundTimerSession(currentPage) {
  const [summary, setSummary] = useState(() => getTimerSessionSummary());

  useEffect(() => {
    function sync() {
      const session = loadTimerSession();
      if (!session) {
        setSummary(null);
        clearTimerMediaSession();
        return;
      }

      const reconciled =
        currentPage === "timer"
          ? session
          : reconcileTimerSession(session);

      if (currentPage !== "timer") {
        saveTimerSession(reconciled);
      }

      const nextSummary = getTimerSessionSummary(reconciled);
      setSummary(nextSummary);

      if (nextSummary?.isActive || nextSummary?.phase === "done") {
        updateTimerMediaSession(nextSummary);
      } else {
        clearTimerMediaSession();
      }
    }

    sync();

    const intervalId = setInterval(() => {
      const session = loadTimerSession();
      if (!session?.isRunning || session.phase === "done") {
        return;
      }

      if (currentPage === "timer") {
        return;
      }

      sync();
      window.dispatchEvent(new CustomEvent("timer-session-updated"));
    }, 1000);

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        sync();
        window.dispatchEvent(new CustomEvent("timer-session-updated"));
      }
    }

    window.addEventListener("timer-session-updated", sync);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("timer-session-updated", sync);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [currentPage]);

  return summary;
}

export function useTimerSessionListener(onSync) {
  useEffect(() => {
    function handleSync() {
      const saved = reconcileTimerSession(loadTimerSession());
      if (saved) {
        onSync(saved);
      }
    }

    window.addEventListener("timer-session-updated", handleSync);
    document.addEventListener("visibilitychange", handleSync);

    return () => {
      window.removeEventListener("timer-session-updated", handleSync);
      document.removeEventListener("visibilitychange", handleSync);
    };
  }, [onSync]);
}

export function shouldApplyLaunchConfig(launchConfig) {
  if (!launchConfig) return false;

  const existing = loadTimerSession();
  if (!existing?.hasStartedSession) return true;
  if (existing.phase === "done") return true;
  if (launchConfig.curriculumSessionId) return true;

  return !hasActiveTimerSession(existing);
}
