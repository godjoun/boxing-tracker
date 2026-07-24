const STORAGE_KEY = "fitness-league-timer-session";

export function saveTimerSession(session) {
  if (!session) {
    sessionStorage.removeItem(STORAGE_KEY);
    return;
  }

  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...session,
      updatedAt: Date.now(),
    })
  );
}

export function loadTimerSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    return parsed;
  } catch {
    return null;
  }
}

export function clearTimerSession() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function hasActiveTimerSession(session = loadTimerSession()) {
  if (!session) return false;

  return Boolean(session.hasStartedSession && session.phase !== "done");
}

export function getTimerSessionSummary(session = loadTimerSession()) {
  if (!session || !session.hasStartedSession) {
    return null;
  }

  const reconciled = reconcileTimerSession(session);
  const phaseLabel =
    reconciled.phase === "prep"
      ? "준비"
      : reconciled.phase === "work"
        ? "훈련"
        : reconciled.phase === "rest"
          ? "휴식"
          : "완료";

  const minutes = Math.floor(reconciled.remainingTime / 60);
  const seconds = reconciled.remainingTime % 60;
  const timeLabel = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return {
    ...reconciled,
    phaseLabel,
    timeLabel,
    roundLabel:
      reconciled.phase === "done"
        ? "완료"
        : `${reconciled.currentRound}/${reconciled.totalRounds}R`,
    title:
      reconciled.curriculumSessionTitle ||
      reconciled.routineTitle ||
      "라운드 훈련",
    isActive: reconciled.phase !== "done",
    isRunning: reconciled.isRunning,
  };
}

function advancePhase(state) {
  const next = { ...state };

  if (next.phase === "prep") {
    next.phase = "work";
    next.remainingTime = next.workSecondsSetting;
    return next;
  }

  if (next.phase === "work") {
    if (next.currentRound >= next.totalRounds) {
      next.phase = "done";
      next.isRunning = false;
      next.remainingTime = 0;
      return next;
    }

    next.phase = "rest";
    next.remainingTime = next.restSecondsSetting;
    return next;
  }

  if (next.phase === "rest") {
    next.currentRound += 1;
    next.phase = "work";
    next.remainingTime = next.workSecondsSetting;
    return next;
  }

  return next;
}

export function reconcileTimerSession(session, now = Date.now()) {
  if (!session) return null;

  if (!session.isRunning || session.phase === "done") {
    return session;
  }

  const updatedAt = Number(session.updatedAt) || now;
  let elapsed = Math.floor((now - updatedAt) / 1000);

  if (elapsed <= 0) {
    return session;
  }

  let next = { ...session, updatedAt: now };
  let guard = 0;

  while (elapsed > 0 && next.isRunning && next.phase !== "done" && guard < 200) {
    guard += 1;

    if (next.remainingTime > elapsed) {
      next.remainingTime -= elapsed;
      break;
    }

    elapsed -= next.remainingTime;
    next.remainingTime = 0;
    next = advancePhase(next);
  }

  return next;
}
