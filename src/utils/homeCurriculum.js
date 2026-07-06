const STORAGE_KEY = "fitness-league-curriculum-progress";

export const HOME_CURRICULUM_ID = "home-boxing-intro";

export const HOME_CURRICULUM = {
  id: HOME_CURRICULUM_ID,
  title: "홈복싱 입문",
  subtitle: "복싱장 없이도 따라 할 수 있는 4주 프로그램",
  intro:
    "샌드백·링이 없어도 섀도우, 풋워크, 맨몸 컨디셔닝으로 복싱 감각을 쌓는 커리큘럼입니다. 좁은 공간에서도 가능해요.",
  equipment: [
    "넉넉한 수건 또는 매트",
    "물병 500ml 2개(선택 · 가벼운 무게)",
    "전신이 보이는 거울(선택)",
  ],
  weeks: [
    {
      id: "week-1",
      label: "1주차",
      theme: "기본 자세와 잽",
      sessions: [
        {
          id: "w1-s1",
          code: "DAY 1",
          title: "스탠스와 가드",
          goal: "오소틱·가드 위치를 몸에 익힌다",
          rounds: 3,
          workSeconds: 120,
          restSeconds: 45,
          drills: [
            {
              name: "워밍업",
              duration: "5분",
              description: "목·어깨·손목 돌리기, 가벼운 제자리 뛰기",
            },
            {
              name: "스탠스 체크",
              duration: "3분",
              description: "발 너비 어깨보다 살짝 넓게, 무게 중심 50:50",
            },
            {
              name: "가드 유지 섀도우",
              duration: "라운드당",
              description: "턱 보호, 팔꿈치 몸에 붙인 채 앞뒤 이동만",
            },
          ],
        },
        {
          id: "w1-s2",
          code: "DAY 2",
          title: "잽 연습",
          goal: "왼손 잽의 거리와 복귀 감각",
          rounds: 3,
          workSeconds: 120,
          restSeconds: 45,
          drills: [
            {
              name: "워밍업",
              duration: "5분",
              description: "점프잭 30초 · 푸시업 10회 · 스탠스 점검",
            },
            {
              name: "싱글 잽",
              duration: "라운드당",
              description: "1발 뻗고 바로 가드 복귀. 힘 70%만",
            },
            {
              name: "더블 잽",
              duration: "30초 × 3세트",
              description: "1-1 템포, 발끝으로 앞으로 살짝 밀기",
            },
          ],
        },
        {
          id: "w1-s3",
          code: "DAY 3",
          title: "풋워크 입문",
          goal: "앞뒤 이동하면서 가드 유지",
          rounds: 4,
          workSeconds: 120,
          restSeconds: 40,
          drills: [
            {
              name: "스텝 드릴",
              duration: "5분",
              description: "앞 2보 · 뒤 2보 · 좌우 1보씩 반복",
            },
            {
              name: "잽 + 스텝",
              duration: "라운드당",
              description: "잽 후 한 걸음 뒤로 빠지기",
            },
            {
              name: "쿨다운",
              duration: "3분",
              description: "어깨·허리 스트레칭",
            },
          ],
        },
      ],
    },
    {
      id: "week-2",
      label: "2주차",
      theme: "스트레이트 조합",
      sessions: [
        {
          id: "w2-s1",
          code: "DAY 4",
          title: "크로스 연결",
          goal: "잽-크로스 1-2 콤보",
          rounds: 4,
          workSeconds: 150,
          restSeconds: 45,
          drills: [
            {
              name: "워밍업",
              duration: "5분",
              description: "로프 없이 제자리 뛰기 3분 · 몸통 회전 스트레칭",
            },
            {
              name: "1-2 콤보",
              duration: "라운드당",
              description: "잽 후 어깨 회전하며 크로스. 숨은 라운드 끝에",
            },
            {
              name: "미트 대신 섀도우",
              duration: "2분",
              description: "상상의 타겟 높이에 맞춰 1-2만 반복",
            },
          ],
        },
        {
          id: "w2-s2",
          code: "DAY 5",
          title: "훅 입문",
          goal: "짧은 라인으로 훅 궤적 익히기",
          rounds: 4,
          workSeconds: 150,
          restSeconds: 45,
          drills: [
            {
              name: "바디 로테이션",
              duration: "3분",
              description: "무릎·골반만 돌리기, 팔은 아직 안 씀",
            },
            {
              name: "리드 훅",
              duration: "라운드당",
              description: "짧게, 팔꿈치는 수평 유지",
            },
            {
              name: "1-2-훅",
              duration: "1분 × 3세트",
              description: "템포 느리게, 동작 크기 작게",
            },
          ],
        },
        {
          id: "w2-s3",
          code: "DAY 6",
          title: "라운드 페이싱",
          goal: "3분 라운드 호흡과 템포 조절",
          rounds: 5,
          workSeconds: 180,
          restSeconds: 45,
          drills: [
            {
              name: "라운드 1",
              duration: "3분",
              description: "50% 강도 · 잽·크로스만",
            },
            {
              name: "라운드 2-3",
              duration: "3분",
              description: "70% 강도 · 훅 추가",
            },
            {
              name: "라운드 4-5",
              duration: "3분",
              description: "마지막 30초만 90% · 나머지는 페이스 유지",
            },
          ],
        },
      ],
    },
    {
      id: "week-3",
      label: "3주차",
      theme: "디펜스와 컨디션",
      sessions: [
        {
          id: "w3-s1",
          code: "DAY 7",
          title: "슬립과 롤",
          goal: "머리 움직임으로 거리 만들기",
          rounds: 4,
          workSeconds: 150,
          restSeconds: 45,
          drills: [
            {
              name: "넥 모빌리티",
              duration: "3분",
              description: "천천히 슬립 좌우 · 과도한 움직임 금지",
            },
            {
              name: "슬립 + 카운터 잽",
              duration: "라운드당",
              description: "피한 뒤 한 발만 반격",
            },
            {
              name: "숄더 롤",
              duration: "2분",
              description: "가드 유지한 채 어깨만 굴리기",
            },
          ],
        },
        {
          id: "w3-s2",
          code: "DAY 8",
          title: "맨몸 컨디션",
          goal: "복싱 체력 기초 — 코어와 하체",
          rounds: 5,
          workSeconds: 120,
          restSeconds: 40,
          drills: [
            {
              name: "서킷 A",
              duration: "40초 × 5",
              description: "스쿼트 · 플랭크 · 마운틴클라이머 순환",
            },
            {
              name: "섀도우 피니시",
              duration: "라운드 마지막 1분",
              description: "빠른 잽 연속, 가드 유지",
            },
            {
              name: "쿨다운",
              duration: "5분",
              description: "햄스트링·고관절 스트레칭",
            },
          ],
        },
        {
          id: "w3-s3",
          code: "DAY 9",
          title: "디펜스 + 1-2",
          goal: "막고 나서 바로 1-2",
          rounds: 5,
          workSeconds: 180,
          restSeconds: 45,
          drills: [
            {
              name: "하이 가드",
              duration: "3분",
              description: "손으로 가상의 스트레이트 막기",
            },
            {
              name: "패리 후 1-2",
              duration: "라운드당",
              description: "살짝 밀어내고 바로 반격",
            },
            {
              name: "풋워크 탈출",
              duration: "1분",
              description: "콤보 후 옆·뒤로 한 걸음",
            },
          ],
        },
      ],
    },
    {
      id: "week-4",
      label: "4주차",
      theme: "실전 감각 마무리",
      sessions: [
        {
          id: "w4-s1",
          code: "DAY 10",
          title: "프레셔 라운드",
          goal: "압박 상황에서 페이스 유지",
          rounds: 6,
          workSeconds: 180,
          restSeconds: 45,
          drills: [
            {
              name: "워밍업",
              duration: "5분",
              description: "가벼운 섀도우 + 스텝",
            },
            {
              name: "프레셔 3라운드",
              duration: "3분",
              description: "앞으로 밀고 들어가며 1-2-훅",
            },
            {
              name: "카운터 3라운드",
              duration: "3분",
              description: "뒤로 빠지며 잽·크로스",
            },
          ],
        },
        {
          id: "w4-s2",
          code: "DAY 11",
          title: "6R 체력 테스트",
          goal: "6라운드 끝까지 호흡 유지",
          rounds: 6,
          workSeconds: 180,
          restSeconds: 30,
          drills: [
            {
              name: "라운드 1-2",
              duration: "3분",
              description: "기술 위주 60%",
            },
            {
              name: "라운드 3-4",
              duration: "3분",
              description: "콤보 위주 75%",
            },
            {
              name: "라운드 5-6",
              duration: "3분",
              description: "마지막 라운드 풀 스피드 30초",
            },
          ],
        },
        {
          id: "w4-s3",
          code: "DAY 12",
          title: "4주 마무리",
          goal: "배운 동작을 한 세션에 연결",
          rounds: 6,
          workSeconds: 180,
          restSeconds: 45,
          drills: [
            {
              name: "프리 라운드 1-2",
              duration: "3분",
              description: "자유 섀도우, 배운 콤보 섞기",
            },
            {
              name: "시나리오 라운드",
              duration: "3분 × 2",
              description: "앞 압박 / 뒤 빠지기 번갈아",
            },
            {
              name: "마무리",
              duration: "5분",
              description: "스트레칭 + 다음 주 목표 정하기",
            },
          ],
        },
      ],
    },
  ],
};

export function getAllCurriculumSessions(
  curriculum = HOME_CURRICULUM
) {
  return curriculum.weeks.flatMap((week) =>
    week.sessions.map((session) => ({
      ...session,
      weekId: week.id,
      weekLabel: week.label,
      weekTheme: week.theme,
    }))
  );
}

function readProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { completedSessionIds: [], lastCompletedAt: null };
    }

    const parsed = JSON.parse(raw);

    return {
      completedSessionIds: Array.isArray(parsed.completedSessionIds)
        ? parsed.completedSessionIds
        : [],
      lastCompletedAt: parsed.lastCompletedAt || null,
    };
  } catch {
    return { completedSessionIds: [], lastCompletedAt: null };
  }
}

function writeProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function getCurriculumProgress() {
  const progress = readProgress();
  const sessions = getAllCurriculumSessions();
  const completedSet = new Set(progress.completedSessionIds);

  return {
    ...progress,
    totalSessions: sessions.length,
    completedCount: progress.completedSessionIds.length,
    progressPercent: sessions.length
      ? Math.round(
          (progress.completedSessionIds.length / sessions.length) * 100
        )
      : 0,
    isComplete: progress.completedSessionIds.length >= sessions.length,
  };
}

export function getCurriculumSessionById(sessionId) {
  return getAllCurriculumSessions().find((session) => session.id === sessionId) || null;
}

export function getRecommendedSession(progress = getCurriculumProgress()) {
  const completedSet = new Set(progress.completedSessionIds);

  return (
    getAllCurriculumSessions().find(
      (session) => !completedSet.has(session.id)
    ) || null
  );
}

export function isCurriculumSessionComplete(
  sessionId,
  progress = getCurriculumProgress()
) {
  return progress.completedSessionIds.includes(sessionId);
}

export function markCurriculumSessionComplete(sessionId) {
  const progress = readProgress();

  if (!sessionId || progress.completedSessionIds.includes(sessionId)) {
    return getCurriculumProgress();
  }

  const nextProgress = {
    completedSessionIds: [...progress.completedSessionIds, sessionId],
    lastCompletedAt: new Date().toISOString(),
  };

  writeProgress(nextProgress);

  return getCurriculumProgress();
}

export function resetCurriculumProgress() {
  writeProgress({ completedSessionIds: [], lastCompletedAt: null });
  return getCurriculumProgress();
}

export function buildCurriculumTimerLaunch(session) {
  if (!session) return null;

  return {
    presetId: `curriculum-${session.id}`,
    rounds: session.rounds,
    workSeconds: session.workSeconds,
    restSeconds: session.restSeconds,
    curriculumSessionId: session.id,
    curriculumTitle: session.title,
    curriculumGoal: session.goal,
    curriculumDrills: session.drills || [],
    routineTitle: `${session.title} · 홈커리큘럼`,
    logType: `홈커리큘럼 · ${session.title}`,
  };
}

export function getCurriculumPhaseFocus(drills, phase, currentRound) {
  if (!Array.isArray(drills) || drills.length === 0) {
    return null;
  }

  if (phase === "prep") {
    const warmup =
      drills.find((drill) => /워밍업/i.test(drill.name)) || drills[0];

    return {
      label: "준비",
      name: warmup.name,
      duration: warmup.duration,
      description: warmup.description,
    };
  }

  if (phase === "rest") {
    return {
      label: `${currentRound}라운드 휴식`,
      name: "호흡 정리",
      duration: "휴식 시간",
      description:
        "어깨를 풀고 호흡을 고른 뒤, 다음 라운드 드릴을 머릿속으로 한번 더 확인하세요.",
    };
  }

  if (phase === "done") {
    const cooldown = drills.find((drill) =>
      /쿨다운|마무리/i.test(drill.name)
    );

    if (!cooldown) {
      return null;
    }

    return {
      label: "마무리",
      name: cooldown.name,
      duration: cooldown.duration,
      description: cooldown.description,
    };
  }

  const roundDrills = drills.filter(
    (drill) =>
      /라운드/i.test(`${drill.name} ${drill.duration} ${drill.description}`)
  );

  if (roundDrills.length > 0) {
    const index = Math.min(currentRound - 1, roundDrills.length - 1);
    const drill = roundDrills[index];

    return {
      label: `${currentRound}라운드`,
      name: drill.name,
      duration: drill.duration,
      description: drill.description,
    };
  }

  const mainDrills = drills.filter(
    (drill) => !/워밍업|쿨다운|마무리/i.test(drill.name)
  );
  const pool = mainDrills.length > 0 ? mainDrills : drills;
  const index = Math.min(currentRound - 1, pool.length - 1);
  const drill = pool[index];

  return {
    label: `${currentRound}라운드`,
    name: drill.name,
    duration: drill.duration,
    description: drill.description,
  };
}
