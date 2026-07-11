import {
  CURRICULUM_GRADUATION,
  getCurriculumProgress,
  getRecommendedSession,
} from "./homeCurriculum";

function pickPreviewDrill(drills = []) {
  const mainDrill = drills.find(
    (drill) => drill.name !== "워밍업" && drill.name !== "쿨다운" && drill.name !== "마무리"
  );

  return mainDrill || drills[0] || null;
}

export function getTodaysLessonPreview() {
  const progress = getCurriculumProgress();
  const session = getRecommendedSession(progress);

  if (!session) {
    return {
      kind: "graduated",
      title: CURRICULUM_GRADUATION.title,
      message: CURRICULUM_GRADUATION.message,
      nextStep: CURRICULUM_GRADUATION.nextSteps[0],
    };
  }

  const previewDrill = pickPreviewDrill(session.drills);

  return {
    kind: "session",
    session,
    weekLabel: session.weekLabel,
    code: session.code,
    title: session.title,
    goal: session.goal,
    rounds: session.rounds,
    previewDrillName: previewDrill?.name || "",
    previewDrillText: previewDrill?.description || "",
    progressPercent: progress.progressPercent,
    completedCount: progress.completedCount,
    totalSessions: progress.totalSessions,
  };
}
