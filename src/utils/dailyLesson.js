import {
  CURRICULUM_GRADUATION,
  getCurriculumJourney,
  getCurriculumProgress,
  getRecommendedSession,
} from "./homeCurriculum";
import { formatTimerDurationLabel, resolveSessionTimerConfig } from "./curriculumTimerSync";
import { applyTrainingSettings, getCurriculumSettings } from "./curriculumSettings";

function pickPreviewDrill(drills = []) {
  const mainDrill = drills.find(
    (drill) => drill.name !== "워밍업" && drill.name !== "쿨다운" && drill.name !== "마무리"
  );

  return mainDrill || drills[0] || null;
}

export function getTodaysLessonPreview(
  progress = getCurriculumProgress(),
  settings = getCurriculumSettings()
) {
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
  const timer = resolveSessionTimerConfig(applyTrainingSettings(session, settings));
  const totalSeconds = timer.prepSeconds + timer.rounds * timer.workSeconds
    + Math.max(0, timer.rounds - 1) * timer.restSeconds + timer.cooldownSeconds;
  const journey = getCurriculumJourney(progress);

  return {
    kind: "session",
    session,
    weekLabel: session.weekLabel,
    code: session.code,
    title: session.title,
    goal: session.goal,
    rounds: timer.rounds,
    durationLabel: formatTimerDurationLabel(totalSeconds),
    previewDrillName: previewDrill?.name || "",
    previewDrillText: previewDrill?.description || "",
    progressPercent: Math.round(journey.completedCount / journey.totalSessions * 100),
    completedCount: journey.completedCount,
    totalSessions: journey.totalSessions,
  };
}
