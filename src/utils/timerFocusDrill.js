function formatDrillText(drill) {
  if (!drill) return "";
  if (Array.isArray(drill.combos) && drill.combos.length > 0) {
    return drill.combos.join(" → ");
  }
  return String(drill.name || "").trim();
}

/**
 * Large on-screen drill for home training. Display-only.
 * Rest shows the next round's drill only when that round exists.
 */
export function getTimerFocusDrill({
  phase,
  currentRound,
  totalRounds,
  curriculumFocus = null,
  strengthSegment = null,
  workoutDetails = "",
} = {}) {
  if (phase !== "work" && phase !== "rest") return null;

  if (strengthSegment) {
    if (phase === "rest") {
      const nextName = String(strengthSegment.nextExercise?.name || "").trim();
      return nextName ? { mode: "next", text: nextName } : null;
    }
    const name = String(strengthSegment.exercise?.name || "").trim();
    return name ? { mode: "now", text: name } : null;
  }

  if (curriculumFocus) {
    if (phase === "rest") {
      const nextText = formatDrillText(curriculumFocus.nextDrill);
      return nextText ? { mode: "next", text: nextText } : null;
    }
    const text = formatDrillText(curriculumFocus);
    return text ? { mode: "now", text } : null;
  }

  const details = String(workoutDetails || "").trim();
  if (!details) return null;

  if (phase === "rest") {
    if (Number(currentRound) >= Number(totalRounds)) return null;
    return { mode: "next", text: details };
  }

  return { mode: "now", text: details };
}
