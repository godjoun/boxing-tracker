/**
 * 기술 탭은 4주 코스와 분리된 스타일 연습장이다.
 * 각 스타일은 실제 교전 흐름 순서대로 기술과 3분 기준 드릴을 제공한다.
 */
export const STYLE_ROUND_WORK_SECONDS = 180;

export function getStyleDrillWorkSummary(
  rounds,
  workSeconds = STYLE_ROUND_WORK_SECONDS
) {
  const safeRounds = Math.max(1, Number(rounds) || 3);
  const workMinutes = Math.round(
    (safeRounds * (Number(workSeconds) || STYLE_ROUND_WORK_SECONDS)) / 60
  );

  return {
    rounds: safeRounds,
    workMinutes,
    summary: `운동 ${workMinutes}분 · ${safeRounds}라운드`,
  };
}

export const BOXING_STYLE_CATALOG = [
  {
    id: "infighter",
    title: "인파이터",
    en: "INFIGHTER",
    icon: "◆",
    summary: "거리를 닫고 몸통과 짧은 펀치로 압박한다.",
    key: "진입 → 안쪽 자리 → 바디 → 각도 이탈",
    stages: [
      {
        id: "entry",
        label: "진입",
        title: "잽으로 진입",
        purpose: "가드를 올린 채 잽과 함께 앞으로 움직여 가까이 간다.",
        drill: {
          title: "더블 잽 진입",
          rounds: 3,
          goal: "잽 두 번을 치면서 앞으로 이동한다.",
          cues: ["R1 잽-전진", "R2 더블 잽-전진", "R3 더블 잽-바디 잽"],
        },
      },
      {
        id: "inside",
        label: "발싸움",
        title: "안쪽 발싸움",
        purpose: "가까이 간 뒤 옆으로 돌아 상대 정면에서 벗어난다.",
        drill: {
          title: "진입 후 피벗",
          rounds: 3,
          goal: "짧게 치고 피벗으로 옆으로 이동한다.",
          cues: ["R1 전진-피벗", "R2 잽-피벗", "R3 원투-피벗"],
        },
      },
      {
        id: "body",
        label: "바디",
        title: "바디와 짧은 연타",
        purpose: "가까운 거리에서 몸통과 얼굴을 번갈아 짧게 친다.",
        drill: {
          title: "바디-헤드 연결",
          rounds: 4,
          goal: "자세를 낮추고 짧은 훅과 어퍼를 이어 친다.",
          cues: ["R1 바디 잽", "R2 바디 훅-헤드 훅", "R3 어퍼-훅", "R4 자유 연결"],
        },
      },
      {
        id: "exit",
        label: "이탈",
        title: "방어 후 이탈",
        purpose: "공격한 뒤 롤이나 피벗으로 옆으로 빠진다.",
        drill: {
          title: "치고 롤 아웃",
          rounds: 3,
          goal: "콤보가 끝나면 방어 동작과 이탈을 이어 한다.",
          cues: ["R1 훅-롤", "R2 원투-훅-롤", "R3 자유 콤보-롤-피벗"],
        },
      },
    ],
  },
  {
    id: "outboxer",
    title: "아웃파이터",
    en: "OUT-BOXER",
    icon: "⇄",
    summary: "긴 거리와 잽, 각도 이동으로 경기를 운영한다.",
    key: "거리 확인 → 잽 선점 → 각도 변경 → 안전한 이탈",
    stages: [
      {
        id: "range",
        label: "거리",
        title: "거리 재는 잽",
        purpose: "잽을 뻗어 상대와의 거리를 확인한다.",
        drill: {
          title: "터치 잽과 스텝",
          rounds: 3,
          goal: "앞뒤로 움직이면서 균형을 유지하고 잽을 친다.",
          cues: ["R1 제자리 잽", "R2 전진 잽", "R3 후진 잽"],
        },
      },
      {
        id: "double-jab",
        label: "잽",
        title: "잽으로 선점",
        purpose: "여러 종류의 잽으로 상대가 쉽게 들어오지 못하게 한다.",
        drill: {
          title: "잽 리듬 바꾸기",
          rounds: 4,
          goal: "잽의 속도와 타이밍을 바꿔가며 친다.",
          cues: ["R1 단발 잽", "R2 더블 잽", "R3 페인트-잽", "R4 자유 리듬"],
        },
      },
      {
        id: "angle",
        label: "각도",
        title: "사이드 스텝",
        purpose: "공격한 뒤 옆으로 움직여 새로운 위치에서 다시 공격한다.",
        drill: {
          title: "L스텝과 원투",
          rounds: 3,
          goal: "원투를 친 뒤 옆으로 이동한다.",
          cues: ["R1 L스텝", "R2 잽-L스텝", "R3 원투-L스텝-잽"],
        },
      },
      {
        id: "exit",
        label: "이탈",
        title: "치고 거리 복구",
        purpose: "공격한 뒤 한 걸음 빠져 다시 거리를 만든다.",
        drill: {
          title: "원투-스텝 아웃",
          rounds: 3,
          goal: "공격 후 바로 한 걸음 빠지고 자세를 잡는다.",
          cues: ["R1 원투-후진", "R2 원투-사이드", "R3 자유 콤보-거리 복구"],
        },
      },
    ],
  },
  {
    id: "boxer-puncher",
    title: "복서 펀처",
    en: "BOXER-PUNCHER",
    icon: "◤",
    summary: "거리 운영과 강한 결정타를 균형 있게 연결한다.",
    key: "잽 설계 → 원투 적중 → 파워 연결 → 각도 유지",
    stages: [
      {
        id: "setup",
        label: "설계",
        title: "잽으로 설계",
        purpose: "잽과 페인트로 뒷손을 칠 기회를 만든다.",
        drill: {
          title: "페인트-잽-크로스",
          rounds: 3,
          goal: "페인트와 잽 뒤에 크로스를 연결한다.",
          cues: ["R1 잽-크로스", "R2 페인트-크로스", "R3 페인트-잽-크로스"],
        },
      },
      {
        id: "power",
        label: "파워",
        title: "뒷손과 체중 이동",
        purpose: "발과 몸통을 돌리며 크로스를 친다.",
        drill: {
          title: "크로스 정확도",
          rounds: 3,
          goal: "크로스를 친 뒤 바로 가드와 균형을 되찾는다.",
          cues: ["R1 단발 크로스", "R2 잽-크로스", "R3 더블 잽-크로스"],
        },
      },
      {
        id: "finish",
        label: "마무리",
        title: "결정타 연결",
        purpose: "원투 뒤에 훅이나 바디 공격을 이어 친다.",
        drill: {
          title: "원투 이후 선택",
          rounds: 4,
          goal: "얼굴과 몸통을 번갈아 공격한다.",
          cues: ["R1 원투-훅", "R2 원투-바디 훅", "R3 원투-어퍼", "R4 자유 선택"],
        },
      },
      {
        id: "reset",
        label: "리셋",
        title: "강타 후 리셋",
        purpose: "강하게 친 뒤에도 균형과 가드를 유지한다.",
        drill: {
          title: "파워 콤보-피벗",
          rounds: 3,
          goal: "콤보 뒤 피벗하고 자세를 다시 잡는다.",
          cues: ["R1 원투-피벗", "R2 원투-훅-피벗", "R3 자유 콤보-리셋"],
        },
      },
    ],
  },
  {
    id: "counterpuncher",
    title: "카운터 펀처",
    en: "COUNTERPUNCHER",
    icon: "↯",
    summary: "상대의 시작을 읽고 방어와 반격을 한 박자로 묶는다.",
    key: "반응 유도 → 방어 → 즉시 반격 → 거리 재설정",
    stages: [
      {
        id: "read",
        label: "리딩",
        title: "페인트로 반응 읽기",
        purpose: "작은 페인트로 상대가 어떻게 반응하는지 확인한다.",
        drill: {
          title: "페인트-반응-잽",
          rounds: 3,
          goal: "페인트 뒤 잠깐 기다렸다가 잽이나 원투를 친다.",
          cues: ["R1 손 페인트", "R2 발 페인트-잽", "R3 페인트-원투"],
        },
      },
      {
        id: "slip",
        label: "슬립",
        title: "슬립 카운터",
        purpose: "머리를 옆으로 피한 뒤 바로 반격한다.",
        drill: {
          title: "슬립-크로스",
          rounds: 3,
          goal: "작게 슬립하고 크로스를 연결한다.",
          cues: ["R1 슬립만", "R2 슬립-크로스", "R3 슬립-크로스-훅"],
        },
      },
      {
        id: "parry",
        label: "패리",
        title: "패리 카운터",
        purpose: "상대 잽을 손으로 살짝 밀어내고 바로 반격한다.",
        drill: {
          title: "패리-즉시 반격",
          rounds: 3,
          goal: "패리는 작게 하고 바로 잽이나 크로스를 친다.",
          cues: ["R1 패리-잽", "R2 패리-크로스", "R3 패리-원투"],
        },
      },
      {
        id: "reset",
        label: "리셋",
        title: "반격 후 자리 이동",
        purpose: "반격한 뒤 같은 자리에 있지 않고 옆으로 빠진다.",
        drill: {
          title: "카운터-사이드 아웃",
          rounds: 3,
          goal: "카운터를 친 뒤 바로 옆으로 이동한다.",
          cues: ["R1 패리-잽-사이드", "R2 슬립-크로스-피벗", "R3 자유 카운터-이탈"],
        },
      },
    ],
  },
  {
    id: "swarmer",
    title: "프레셔",
    en: "PRESSURE / SWARMER",
    icon: "»",
    summary: "계속 전진하되 무작정 쫓지 않고 퇴로를 잘라 압박한다.",
    key: "링 자르기 → 가드 압박 → 연타 → 다시 앞을 막기",
    stages: [
      {
        id: "cutoff",
        label: "컷오프",
        title: "링 자르기",
        purpose: "상대를 뒤쫓지 말고 빠져나갈 방향을 먼저 막는다.",
        drill: {
          title: "대각선 압박 스텝",
          rounds: 3,
          goal: "대각선으로 움직여 상대가 갈 곳을 줄인다.",
          cues: ["R1 대각선 전진", "R2 잽-대각선", "R3 더블 잽-링 자르기"],
        },
      },
      {
        id: "guard",
        label: "가드",
        title: "가드 뒤 전진",
        purpose: "가드를 올리고 작은 걸음으로 계속 앞으로 간다.",
        drill: {
          title: "하이 가드 전진",
          rounds: 3,
          goal: "얼굴을 보호하면서 천천히 앞으로 움직인다.",
          cues: ["R1 가드-전진", "R2 가드-패리-전진", "R3 가드-잽-전진"],
        },
      },
      {
        id: "volume",
        label: "연타",
        title: "끊어 치는 연타",
        purpose: "2~3번 치고 위치를 바꾼 뒤 다시 공격한다.",
        drill: {
          title: "3타-각도-3타",
          rounds: 4,
          goal: "짧은 콤보와 이동을 반복하며 압박한다.",
          cues: ["R1 원투-훅", "R2 바디-헤드 3타", "R3 3타-피벗", "R4 3타-피벗-3타"],
        },
      },
      {
        id: "recover",
        label: "복구",
        title: "압박 위치 복구",
        purpose: "상대가 빠지면 따라가지 말고 이동할 방향을 다시 막는다.",
        drill: {
          title: "이탈 추적과 재압박",
          rounds: 3,
          goal: "공격 뒤 균형과 가드를 잡고 다시 앞으로 간다.",
          cues: ["R1 전진-정지-가드", "R2 콤보-대각선", "R3 자유 압박-위치 복구"],
        },
      },
    ],
  },
  {
    id: "switch-hitter",
    title: "스위치 히터",
    en: "SWITCH-HITTER",
    icon: "⟷",
    summary: "오소독스와 사우스포를 바꾸며 공격선과 각도를 만든다.",
    key: "기본 자세 안정 → 안전한 전환 → 새 앞손 → 각도 공격",
    advanced: true,
    stages: [
      {
        id: "base",
        label: "기본",
        title: "양 자세 기본",
        purpose: "오소독스와 사우스포 자세에서 각각 균형과 가드를 익힌다.",
        drill: {
          title: "양 자세 잽",
          rounds: 4,
          goal: "두 자세에서 중심과 발 위치를 확인한다.",
          cues: ["R1 오소독스 잽", "R2 사우스포 잽", "R3 자세별 원투", "R4 자유 전환 없이 반복"],
        },
      },
      {
        id: "switch",
        label: "스위치",
        title: "안전한 스위치",
        purpose: "발이 꼬이지 않게 움직이면서 자세를 바꾼다.",
        drill: {
          title: "스텝 백 스위치",
          rounds: 3,
          goal: "자세를 바꿀 때도 턱과 얼굴을 보호한다.",
          cues: ["R1 스텝 백-전환", "R2 잽-스텝 백-전환", "R3 원투-전환"],
        },
      },
      {
        id: "lead-hand",
        label: "앞손",
        title: "새 앞손 사용",
        purpose: "자세를 바꾼 뒤 새 앞손으로 바로 잽이나 훅을 친다.",
        drill: {
          title: "스위치-앞손 공격",
          rounds: 3,
          goal: "스위치 후 멈추지 않고 새 앞손으로 공격한다.",
          cues: ["R1 스위치-잽", "R2 스위치-앞손 훅", "R3 스위치-잽-크로스"],
        },
      },
      {
        id: "angle",
        label: "각도",
        title: "전환으로 각도 만들기",
        purpose: "자세를 바꾸면서 상대 정면에서 옆으로 벗어난다.",
        drill: {
          title: "콤보-스위치 아웃",
          rounds: 3,
          goal: "스위치 후에도 발 간격과 가드를 유지한다.",
          cues: ["R1 원투-스위치", "R2 잽-피벗-스위치", "R3 자유 콤보-스위치 아웃"],
        },
      },
    ],
  },
];

export function getTechniqueCatalog() {
  return BOXING_STYLE_CATALOG;
}

/** 스타일 전용 화면의 카테고리: 개요 · 흐름 · 단계별 기술 */
export function getStyleCategories(style) {
  if (!style) return [];

  return [
    {
      id: "overview",
      kind: "overview",
      label: "개요",
      title: `${style.title} 개요`,
      description: style.summary,
    },
    {
      id: "flow",
      kind: "flow",
      label: "흐름",
      title: "흐름 순서",
      description: "이 스타일로 싸울 때 기본이 되는 연결 순서입니다.",
      steps: style.key.split("→").map((step) => step.trim()).filter(Boolean),
    },
    ...style.stages.map((stage, index) => ({
      id: stage.id,
      kind: "stage",
      label: stage.label || stage.title,
      title: stage.title,
      description: stage.purpose,
      order: index + 1,
      stage,
    })),
  ];
}

export function buildStyleDrillSession(style, stage) {
  if (!style || !stage?.drill) return null;

  const { drill } = stage;
  const rounds = drill.rounds || drill.cues?.length || 3;
  const cues = Array.isArray(drill.cues) ? drill.cues : [];

  return {
    id: `style-${style.id}-${stage.id}`,
    isCustom: true,
    styleId: style.id,
    styleCategoryId: stage.id,
    code: style.en,
    weekLabel: style.title,
    weekTheme: style.key,
    title: drill.title,
    goal: `${stage.title} · ${drill.goal}`,
    rounds,
    workSeconds: STYLE_ROUND_WORK_SECONDS,
    restSeconds: 30,
    prepSeconds: 10,
    drills: cues.map((cue, index) => ({
      name: cue.replace(/^R\d+\s*/, ""),
      duration: "라운드당",
      description: `${stage.purpose} ${drill.goal}.`,
      roundFrom: index + 1,
      roundTo: index + 1,
    })),
  };
}
