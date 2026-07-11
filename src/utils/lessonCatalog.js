import { getAllCurriculumSessions, HOME_CURRICULUM } from "./homeCurriculum";

/**
 * 촬영 후 URL만 채우면 강의 탭에 자동 반영됩니다.
 * 예: "https://..." 또는 "/videos/w1-s1.mp4"
 */
export const LESSON_VIDEO_URLS = {
  "lesson-w1-s1": "",
  "lesson-w1-s2": "",
  "lesson-w1-s3": "",
  "lesson-w2-s1": "",
  "lesson-w2-s2": "",
  "lesson-w2-s3": "",
  "lesson-w3-s1": "",
  "lesson-w3-s2": "",
  "lesson-w3-s3": "",
  "lesson-w4-s1": "",
  "lesson-w4-s2": "",
  "lesson-w4-s3": "",
};

export function getLessonCatalogGroups() {
  const sessions = getAllCurriculumSessions();

  return HOME_CURRICULUM.weeks.map((week) => ({
    id: week.id,
    title: `${week.label} · ${week.theme}`,
    summary: week.summary || "",
    lessons: sessions
      .filter((session) => session.weekId === week.id)
      .map((session) => {
        const lessonId = `lesson-${session.id}`;

        return {
          id: lessonId,
          sessionId: session.id,
          code: session.code,
          title: session.title,
          durationLabel: "약 3분",
          description: session.goal,
          videoUrl: LESSON_VIDEO_URLS[lessonId] || "",
          hasVideo: Boolean(LESSON_VIDEO_URLS[lessonId]),
        };
      }),
  }));
}

export function getLessonBySessionId(sessionId) {
  for (const group of getLessonCatalogGroups()) {
    const lesson = group.lessons.find((item) => item.sessionId === sessionId);
    if (lesson) return lesson;
  }

  return null;
}
