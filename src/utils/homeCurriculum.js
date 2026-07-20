import { resolveSessionTimerConfig } from "./curriculumTimerSync";

const STORAGE_KEY = "fitness-league-curriculum-progress";

export const HOME_CURRICULUM_ID = "home-boxing-intro";

/** 커리큘럼 기본 휴식(초). 세션별로 다르게 지정 가능 */
export const DEFAULT_CURRICULUM_REST_SECONDS = 30;

export const CURRICULUM_GRADUATION = {
  title: "홈복싱 입문 수료",
  badge: "4WEEK GRADUATE",
  message:
    "12세션을 모두 마쳤습니다. 스탠스·잽·콤보·디펜스의 기초를 몸에 익혔어요.",
  nextSteps: [
    "라운드로 반복 훈련",
    "LV.10 달성 후 콤보 크리에이터 해금",
    "복싱장 스파링(LV.7+)으로 실전 감각 확장",
  ],
};

export const HOME_CURRICULUM = {
  id: HOME_CURRICULUM_ID,
  title: "홈복싱 입문",
  subtitle: "복싱장 없이도 따라 할 수 있는 4주 프로그램",
  intro:
    "샌드백·링이 없어도 섀도우, 풋워크, 맨몸 컨디셔닝으로 복싱 감각을 쌓는 기술 코스입니다. 좁은 공간에서도 가능해요.",
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
      summary: "스탠스·가드·잽·풋워크 — 복싱의 뼈대를 세웁니다.",
      sessions: [
        {
          id: "w1-s1",
          code: "DAY 1",
          title: "스탠스와 가드",
          goal: "오소틱·가드 위치를 몸에 익힌다",
          rounds: 3,
          workSeconds: 120,
          restSeconds: 30,
          drills: [
            {
              name: "워밍업",
              duration: "5분",
              description: "목·어깨·손목 돌리기, 가벼운 제자리 뛰기를 하십시오",
            },
            {
              name: "스탠스 체크",
              duration: "3분",
              description:
                "왼발 앞·오른발 뒤(오소틱). 발 너비는 어깨보다 살짝 넓게, 무게는 발바닥 전체에 고르게 두십시오",
            },
            {
              name: "가드 유지 섀도우",
              duration: "라운드당",
              description:
                "양손은 볼·관자놀이 높이, 팔꿈치는 옆구리에 붙이고 턱을 숙인 채 앞뒤로만 이동하십시오. 거울이 있으면 옆모습으로 확인하세요",
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
          restSeconds: 30,
          drills: [
            {
              name: "워밍업",
              duration: "5분",
              description: "점프잭 30초 · 푸시업 10회 · 스탠스 점검을 하십시오",
            },
            {
              name: "싱글 잽",
              duration: "라운드당",
              description: "앞손을 뻗고 바로 가드로 복귀하되, 힘은 70%만 쓰십시오",
            },
            {
              name: "더블 잽",
              duration: "30초 × 3세트",
              description: "1-1 템포로, 발끝으로 앞으로 살짝 밀며 치십시오",
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
          restSeconds: 30,
          drills: [
            {
              name: "스텝 드릴",
              duration: "5분",
              description: "앞 2보, 뒤 2보, 좌우 1보씩 반복하십시오",
            },
            {
              name: "잽 + 스텝",
              duration: "라운드당",
              description: "잽 후 한 걸음 뒤로 빠지십시오",
            },
            {
              name: "쿨다운",
              duration: "3분",
              description: "어깨와 허리를 스트레칭하십시오",
            },
          ],
        },
      ],
    },
    {
      id: "week-2",
      label: "2주차",
      theme: "스트레이트 조합",
      summary: "1-2 콤보와 훅, 3분 라운드 페이싱을 익힙니다.",
      sessions: [
        {
          id: "w2-s1",
          code: "DAY 4",
          title: "크로스 연결",
          goal: "잽-크로스 1-2 콤보",
          rounds: 4,
          workSeconds: 150,
          restSeconds: 30,
          drills: [
            {
              name: "워밍업",
              duration: "5분",
              description: "로프 없이 제자리 뛰기 3분 · 몸통 회전 스트레칭을 하십시오",
            },
            {
              name: "1-2 콤보",
              duration: "라운드당",
              description:
                "잽 후 어깨와 골반을 회전하며 크로스를 치고, 라운드 내내 호흡을 고르게 유지하십시오",
              combos: ["J-C", "1-2"],
            },
            {
              name: "미트 대신 섀도우",
              duration: "2분",
              description: "상상의 타겟 높이에 맞춰 1-2만 반복하십시오",
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
          restSeconds: 30,
          drills: [
            {
              name: "바디 로테이션",
              duration: "3분",
              description: "무릎과 골반만 돌리고, 팔은 아직 쓰지 마십시오",
            },
            {
              name: "리드 훅",
              duration: "라운드당",
              description:
                "짧게 치고, 팔꿈치는 몸 옆에 두며 수평에 가깝게 유지하십시오",
            },
            {
              name: "1-2-훅",
              duration: "1분 × 3세트",
              description: "템포는 느리게, 동작은 작게 하십시오",
              combos: ["J-C-LH", "1-2-훅"],
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
          restSeconds: 30,
          drills: [
            {
              name: "라운드 1",
              duration: "3분",
              description: "50% 강도로 잽과 크로스만 치십시오",
            },
            {
              name: "라운드 2-3",
              duration: "3분",
              description: "70% 강도로 훅을 추가하십시오",
            },
            {
              name: "라운드 4-5",
              duration: "3분",
              description: "마지막 30초만 90%로 올리고, 나머지는 페이스를 유지하십시오",
            },
          ],
        },
      ],
    },
    {
      id: "week-3",
      label: "3주차",
      theme: "디펜스와 컨디션",
      summary: "슬립·롤·맨몸 체력으로 실전에서 버틸 몸을 만듭니다.",
      sessions: [
        {
          id: "w3-s1",
          code: "DAY 7",
          title: "슬립과 롤",
          goal: "머리 움직임으로 거리 만들기",
          rounds: 4,
          workSeconds: 150,
          restSeconds: 30,
          drills: [
            {
              name: "넥 모빌리티",
              duration: "3분",
              description:
                "상대 펀치를 상상하고 머리를 한쪽으로 살짝 빼 보십시오. 목만 크게 흔들지 마십시오",
            },
            {
              name: "슬립 + 카운터 잽",
              duration: "라운드당",
              description: "피한 뒤 카운터 잽 한 방만 치십시오",
            },
            {
              name: "숄더 롤",
              duration: "2분",
              description:
                "가드를 유지한 채 어깨와 상체를 함께 굴려 펀치 라인을 피하는 느낌으로 연습하십시오",
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
          restSeconds: 30,
          drills: [
            {
              name: "서킷 A",
              duration: "40초 × 5",
              description: "스쿼트, 플랭크, 마운틴클라이머를 순환하며 하십시오",
            },
            {
              name: "섀도우 피니시",
              duration: "라운드 마지막 1분",
              description: "빠른 잽을 연속으로 치고 가드를 유지하십시오",
            },
            {
              name: "쿨다운",
              duration: "5분",
              description: "햄스트링과 고관절을 스트레칭하십시오",
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
              description: "손으로 가상의 스트레이트를 막으십시오",
            },
            {
              name: "패리 후 1-2",
              duration: "라운드당",
              description:
                "손바닥으로 가상의 스트레이트를 살짝 밀어내는 느낌으로 연습하십시오",
              combos: ["J-C", "1-2"],
            },
            {
              name: "풋워크 탈출",
              duration: "1분",
              description: "콤보 후 옆이나 뒤로 한 걸음 움직이십시오",
            },
          ],
        },
      ],
    },
    {
      id: "week-4",
      label: "4주차",
      theme: "실전 감각 마무리",
      summary: "압박·체력·자유 섀도우로 4주를 마무리합니다.",
      sessions: [
        {
          id: "w4-s1",
          code: "DAY 10",
          title: "프레셔 라운드",
          goal: "압박 상황에서 페이스 유지",
          rounds: 6,
          workSeconds: 180,
          restSeconds: 30,
          drills: [
            {
              name: "워밍업",
              duration: "5분",
              description: "가벼운 섀도우와 스텝을 하십시오",
            },
            {
              name: "프레셔 3라운드",
              duration: "3분",
              description: "앞으로 밀고 들어가며 1-2-훅을 치십시오",
              combos: ["J-C-LH", "1-2-훅"],
              roundFrom: 1,
              roundTo: 3,
            },
            {
              name: "카운터 3라운드",
              duration: "3분",
              description: "뒤로 빠지며 잽과 크로스를 치십시오",
              roundFrom: 4,
              roundTo: 6,
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
              description: "기술 위주로 60% 강도로 하십시오",
            },
            {
              name: "라운드 3-4",
              duration: "3분",
              description: "콤보 위주로 75% 강도로 하십시오",
            },
            {
              name: "라운드 5-6",
              duration: "3분",
              description: "마지막 라운드는 풀 스피드로 30초간 하십시오",
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
          restSeconds: 30,
          drills: [
            {
              name: "프리 라운드 1-2",
              duration: "3분",
              description: "자유 섀도우로 배운 콤보를 섞어 치십시오",
            },
            {
              name: "시나리오 라운드",
              duration: "3분 × 2",
              description: "앞으로 압박하고 뒤로 빠지기를 번갈아 하십시오",
              roundFrom: 3,
              roundTo: 6,
            },
            {
              name: "마무리",
              duration: "5분",
              description: "스트레칭을 하고 다음 주 목표를 정하십시오",
            },
          ],
        },
      ],
    },
  ],
};

export function getCurriculumWeekOverviews(
  curriculum = HOME_CURRICULUM
) {
  return curriculum.weeks.map((week) => {
    const sessions = week.sessions || [];
    const completed = getCurriculumProgress();

    return {
      id: week.id,
      label: week.label,
      theme: week.theme,
      summary: week.summary || "",
      sessionCount: sessions.length,
      completedCount: sessions.filter((session) =>
        completed.completedSessionIds.includes(session.id)
      ).length,
    };
  });
}

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

  const isCustom = Boolean(session.isCustom);
  const timerConfig = resolveSessionTimerConfig(session);

  return {
    presetId: `curriculum-${session.id}`,
    rounds: timerConfig.rounds,
    workSeconds: timerConfig.workSeconds,
    restSeconds: timerConfig.restSeconds,
    prepSeconds: timerConfig.prepSeconds,
    cooldownSeconds: timerConfig.cooldownSeconds,
    scheduleSummary: timerConfig.scheduleSummary,
    curriculumSessionId: isCustom ? null : session.id,
    curriculumSessionCode: session.code || "",
    curriculumWeekLabel: session.weekLabel || "",
    curriculumWeekTheme: session.weekTheme || "",
    curriculumTitle: session.title,
    curriculumGoal: session.goal,
    curriculumDrills: timerConfig.syncedDrills,
    routineTitle: isCustom
      ? `${session.title} · 커스텀`
      : `${session.title} · 기술`,
    logType: isCustom
      ? `커스텀 훈련 · ${session.title}`
      : `기술 · ${session.title}`,
  };
}

export function parseDrillRoundRange(drill) {
  if (!drill) return null;

  if (Number.isFinite(drill.roundFrom) && Number.isFinite(drill.roundTo)) {
    return { from: drill.roundFrom, to: drill.roundTo };
  }

  const name = drill.name || "";
  const rangeMatch = name.match(/라운드\s*(\d+)\s*[-~]\s*(\d+)/i);

  if (rangeMatch) {
    return {
      from: Number(rangeMatch[1]),
      to: Number(rangeMatch[2]),
    };
  }

  const singleMatch = name.match(/(?:^|\s)라운드\s*(\d+)(?:\s|$)/i);

  if (singleMatch && !/[-~]/.test(name)) {
    const round = Number(singleMatch[1]);
    return { from: round, to: round };
  }

  return null;
}

export function getDrillRoundRanges(drills, totalRounds) {
  const pool = getCurriculumDrillPool(drills);
  if (!pool.length) return [];

  const ranges = [];
  let cursor = 1;

  pool.forEach((drill, index) => {
    const parsed = parseDrillRoundRange(drill);
    let from;
    let to;

    if (parsed) {
      from = parsed.from;
      to = parsed.to;
    } else {
      const segmentsLeft = pool.length - index;
      const roundsLeft = totalRounds - cursor + 1;
      const span = Math.max(1, Math.ceil(roundsLeft / segmentsLeft));
      from = cursor;
      to = Math.min(cursor + span - 1, totalRounds);
    }

    ranges.push({ drill, from, to });
    cursor = Math.max(cursor, to + 1);
  });

  return ranges;
}

export function getCurriculumDrillPool(drills) {
  if (!Array.isArray(drills) || drills.length === 0) {
    return [];
  }

  const roundDrills = drills.filter((drill) =>
    /라운드/i.test(`${drill.name} ${drill.duration} ${drill.description}`)
  );

  if (roundDrills.length > 0) {
    return roundDrills;
  }

  const mainDrills = drills.filter(
    (drill) => !/워밍업|쿨다운|마무리/i.test(drill.name)
  );

  return mainDrills.length > 0 ? mainDrills : drills;
}

export function getCurriculumDrillForRound(drills, round, totalRounds) {
  const safeRound = Math.max(1, Number(round) || 1);
  const ranges = getDrillRoundRanges(drills, totalRounds || safeRound);
  if (!ranges.length) return null;

  const matched =
    ranges.find(
      (entry) => safeRound >= entry.from && safeRound <= entry.to
    ) || ranges[ranges.length - 1];

  return matched.drill;
}

export function getNextCurriculumDrill(drills, currentRound, totalRounds) {
  const nextRound = Number(currentRound) + 1;
  if (nextRound > totalRounds) return null;

  return getCurriculumDrillForRound(drills, nextRound, totalRounds);
}

export function getCurriculumPhaseFocus(
  drills,
  phase,
  currentRound,
  totalRounds = 1
) {
  if (!Array.isArray(drills) || drills.length === 0) {
    return null;
  }

  if (phase === "prep") {
    const warmup =
      drills.find((drill) => /워밍업/i.test(drill.name)) || drills[0];

    return {
      label: "준비",
      name: warmup.name,
      duration: warmup.displayDuration || warmup.duration,
      description: warmup.description,
      combos: warmup.combos || [],
    };
  }

  if (phase === "rest") {
    const nextDrill = getNextCurriculumDrill(
      drills,
      currentRound,
      totalRounds
    );

    return {
      label: `${currentRound}라운드 휴식`,
      name: "호흡 정리",
      duration: "휴식 시간",
      description: nextDrill
        ? `다음: ${currentRound + 1}라운드 · ${nextDrill.name} — ${nextDrill.description}`
        : "어깨를 풀고 호흡을 고른 뒤, 다음 라운드에 집중하세요.",
      nextDrill,
      drillIndex: currentRound - 1,
      drillTotal: totalRounds,
    };
  }

  if (phase === "cooldown") {
    const cooldown = drills.find((drill) =>
      /쿨다운|마무리/i.test(drill.name)
    );

    if (!cooldown) {
      return {
        label: "마무리",
        name: "쿨다운",
        duration: "스트레칭",
        description: "호흡을 고르고 몸을 푸십시오.",
      };
    }

    return {
      label: "마무리",
      name: cooldown.name,
      duration: cooldown.displayDuration || cooldown.duration,
      description: cooldown.description,
      combos: cooldown.combos || [],
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
      duration: cooldown.displayDuration || cooldown.duration,
      description: cooldown.description,
      combos: cooldown.combos || [],
    };
  }

  const drill = getCurriculumDrillForRound(drills, currentRound, totalRounds);

  if (!drill) {
    return null;
  }

  return {
    label: `${currentRound}라운드`,
    name: drill.name,
    duration: drill.displayDuration || drill.duration,
    description: drill.description,
    combos: drill.combos || [],
    drillIndex: currentRound - 1,
    drillTotal: totalRounds,
  };
}
