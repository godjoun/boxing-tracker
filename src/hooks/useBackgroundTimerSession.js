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

      // 타이머 화면이 열려 있으면 TimerPage가 복귀 보정의 단일 소스다.
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
      if (document.visibilityState !== "visible") return;

      // 타이머 페이지에서는 TimerPage가 visibility/pageshow/focus를 처리한다.
      if (currentPage === "timer") {
        sync();
        return;
      }

      sync();
      window.dispatchEvent(new CustomEvent("timer-session-updated"));
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

/** 타이머 페이지 외부 동기화만 수신. visibility 복귀는 TimerPage 단일 소스. */
export function useTimerSessionListener(onSync) {
  useEffect(() => {
    function handleSync() {
      const saved = reconcileTimerSession(loadTimerSession());
      if (saved) {
        onSync(saved);
      }
    }

    window.addEventListener("timer-session-updated", handleSync);

    return () => {
      window.removeEventListener("timer-session-updated", handleSync);
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
