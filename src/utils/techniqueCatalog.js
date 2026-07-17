import {
  getAllCurriculumSessions,
  getCurriculumProgress,
  isCurriculumSessionComplete,
} from "./homeCurriculum";

/**
 * 주차별 커리큘럼을 "기술 종류"로 묶어 보여주기 위한 분류.
 * 각 세션을 하나의 대표 기술 카테고리에 매핑한다.
 */
export const TECHNIQUE_CATEGORIES = [
  {
    id: "stance",
    title: "스탠스 & 가드",
    en: "STANCE & GUARD",
    icon: "◇",
    accent: "red",
    description: "복싱의 뼈대. 서는 법과 막는 자세부터.",
    sessionIds: ["w1-s1"],
  },
  {
    id: "punch",
    title: "잽 & 펀치",
    en: "PUNCHES",
    icon: "◤",
    accent: "orange",
    description: "잽·크로스·훅 — 기본 타격 라인.",
    sessionIds: ["w1-s2", "w2-s1", "w2-s2"],
  },
  {
    id: "footwork",
    title: "풋워크",
    en: "FOOTWORK",
    icon: "⇄",
    accent: "gold",
    description: "치고 빠지는 거리와 스텝 감각.",
    sessionIds: ["w1-s3"],
  },
  {
    id: "combo",
    title: "콤보",
    en: "COMBOS",
    icon: "⚡",
    accent: "red",
    description: "1-2-훅으로 이어치는 연결 동작.",
    sessionIds: ["w2-s3", "w4-s1"],
  },
  {
    id: "defense",
    title: "디펜스",
    en: "DEFENSE",
    icon: "⛨",
    accent: "slate",
    description: "슬립·롤·패리로 맞지 않고 받아치기.",
    sessionIds: ["w3-s1", "w3-s3"],
  },
  {
    id: "conditioning",
    title: "체력 & 섀도",
    en: "SHADOW & CONDITION",
    icon: "✦",
    accent: "orange",
    description: "라운드 끝까지 버티는 몸과 자유 섀도.",
    sessionIds: ["w3-s2", "w4-s2", "w4-s3"],
  },
];

/**
 * 카테고리별로 세션과 진행률을 붙여 반환한다.
 */
export function getTechniqueCatalog() {
  const sessions = getAllCurriculumSessions();
  const progress = getCurriculumProgress();
  const sessionMap = new Map(sessions.map((session) => [session.id, session]));

  return TECHNIQUE_CATEGORIES.map((category) => {
    const categorySessions = category.sessionIds
      .map((id) => sessionMap.get(id))
      .filter(Boolean)
      .map((session) => ({
        ...session,
        completed: isCurriculumSessionComplete(session.id, progress),
      }));

    const completedCount = categorySessions.filter(
      (session) => session.completed
    ).length;

    return {
      ...category,
      sessions: categorySessions,
      sessionCount: categorySessions.length,
      completedCount,
      progressPercent: categorySessions.length
        ? Math.round((completedCount / categorySessions.length) * 100)
        : 0,
    };
  });
}
