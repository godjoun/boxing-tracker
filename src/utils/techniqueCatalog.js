/**
 * 기술 탭은 4주 코스와 분리된 스타일 연습장이다.
 * 각 스타일은 실제 교전 흐름 순서대로 기술과 3분 기준 드릴을 제공한다.
 */
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
        purpose: "맞으면서 들어가지 않고 가드 뒤에서 거리를 닫는다.",
        drill: {
          title: "더블 잽 진입",
          rounds: 3,
          goal: "잽 두 번과 전진 스텝을 한 동작처럼 연결",
          cues: ["R1 잽-전진", "R2 더블 잽-전진", "R3 더블 잽-바디 잽"],
        },
      },
      {
        id: "inside",
        label: "발싸움",
        title: "안쪽 발싸움",
        purpose: "상대 정면에 머물지 않고 앞발 바깥쪽 자리를 만든다.",
        drill: {
          title: "진입 후 피벗",
          rounds: 3,
          goal: "짧게 치고 반걸음 피벗으로 정면에서 벗어나기",
          cues: ["R1 전진-피벗", "R2 잽-피벗", "R3 원투-피벗"],
        },
      },
      {
        id: "body",
        label: "바디",
        title: "바디와 짧은 연타",
        purpose: "팔을 크게 휘두르지 않고 몸통에서 머리로 연결한다.",
        drill: {
          title: "바디-헤드 연결",
          rounds: 4,
          goal: "레벨을 낮춘 뒤 짧은 훅과 어퍼로 연결",
          cues: ["R1 바디 잽", "R2 바디 훅-헤드 훅", "R3 어퍼-훅", "R4 자유 연결"],
        },
      },
      {
        id: "exit",
        label: "이탈",
        title: "방어 후 이탈",
        purpose: "공격 뒤 머리를 남겨두지 않고 롤 또는 피벗으로 나온다.",
        drill: {
          title: "치고 롤 아웃",
          rounds: 3,
          goal: "모든 콤보 끝에 방어와 이탈을 붙이기",
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
        purpose: "앞손으로 상대 위치를 읽고 내 타격 거리를 먼저 잡는다.",
        drill: {
          title: "터치 잽과 스텝",
          rounds: 3,
          goal: "앞뒤 스텝 중 중심을 잃지 않고 잽 내기",
          cues: ["R1 제자리 잽", "R2 전진 잽", "R3 후진 잽"],
        },
      },
      {
        id: "double-jab",
        label: "잽",
        title: "잽으로 선점",
        purpose: "단발 잽, 더블 잽, 페인트를 섞어 상대 시작을 끊는다.",
        drill: {
          title: "잽 리듬 바꾸기",
          rounds: 4,
          goal: "같은 박자로만 치지 않고 멈춤과 속도를 변화",
          cues: ["R1 단발 잽", "R2 더블 잽", "R3 페인트-잽", "R4 자유 리듬"],
        },
      },
      {
        id: "angle",
        label: "각도",
        title: "사이드 스텝",
        purpose: "직선으로만 빠지지 않고 옆으로 이동해 다시 공격한다.",
        drill: {
          title: "L스텝과 원투",
          rounds: 3,
          goal: "원투 뒤 옆으로 빠져 새 공격선 만들기",
          cues: ["R1 L스텝", "R2 잽-L스텝", "R3 원투-L스텝-잽"],
        },
      },
      {
        id: "exit",
        label: "이탈",
        title: "치고 거리 복구",
        purpose: "공격 후 상대 사정거리 밖으로 나와 다시 잽을 준비한다.",
        drill: {
          title: "원투-스텝 아웃",
          rounds: 3,
          goal: "치고 멈추지 않고 한 걸음 빠진 뒤 자세 복구",
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
        purpose: "잽과 페인트로 강한 뒷손이 들어갈 길을 만든다.",
        drill: {
          title: "페인트-잽-크로스",
          rounds: 3,
          goal: "페인트 뒤 상대 반응을 상상하며 원투 연결",
          cues: ["R1 잽-크로스", "R2 페인트-크로스", "R3 페인트-잽-크로스"],
        },
      },
      {
        id: "power",
        label: "파워",
        title: "뒷손과 체중 이동",
        purpose: "힘으로 밀지 않고 발-골반-어깨 순서로 크로스를 낸다.",
        drill: {
          title: "크로스 정확도",
          rounds: 3,
          goal: "매 펀치 뒤 가드와 중심을 즉시 복구",
          cues: ["R1 단발 크로스", "R2 잽-크로스", "R3 더블 잽-크로스"],
        },
      },
      {
        id: "finish",
        label: "마무리",
        title: "결정타 연결",
        purpose: "원투 뒤 훅 또는 바디로 공격선을 바꾼다.",
        drill: {
          title: "원투 이후 선택",
          rounds: 4,
          goal: "머리와 몸통을 번갈아 공략",
          cues: ["R1 원투-훅", "R2 원투-바디 훅", "R3 원투-어퍼", "R4 자유 선택"],
        },
      },
      {
        id: "reset",
        label: "리셋",
        title: "강타 후 리셋",
        purpose: "강하게 친 뒤 자세가 무너지지 않게 피벗으로 끝낸다.",
        drill: {
          title: "파워 콤보-피벗",
          rounds: 3,
          goal: "콤보 끝마다 가드, 시선, 발 위치 확인",
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
        purpose: "먼저 크게 치기보다 작은 동작으로 상대 공격을 끌어낸다.",
        drill: {
          title: "페인트-반응-잽",
          rounds: 3,
          goal: "페인트 후 반 박자 멈추고 빈 곳에 잽",
          cues: ["R1 손 페인트", "R2 발 페인트-잽", "R3 페인트-원투"],
        },
      },
      {
        id: "slip",
        label: "슬립",
        title: "슬립 카운터",
        purpose: "상대 잽 선에서 머리를 빼며 동시에 반격한다.",
        drill: {
          title: "슬립-크로스",
          rounds: 3,
          goal: "허리를 과하게 숙이지 않고 작은 슬립 후 복귀",
          cues: ["R1 슬립만", "R2 슬립-크로스", "R3 슬립-크로스-훅"],
        },
      },
      {
        id: "parry",
        label: "패리",
        title: "패리 카운터",
        purpose: "상대 잽을 작게 흘리고 내 잽 또는 크로스로 답한다.",
        drill: {
          title: "패리-즉시 반격",
          rounds: 3,
          goal: "패리 손이 몸 중심을 지나가지 않게 작게 움직이기",
          cues: ["R1 패리-잽", "R2 패리-크로스", "R3 패리-원투"],
        },
      },
      {
        id: "reset",
        label: "리셋",
        title: "반격 후 자리 이동",
        purpose: "카운터 적중 뒤 같은 선에 남지 않고 옆으로 빠진다.",
        drill: {
          title: "카운터-사이드 아웃",
          rounds: 3,
          goal: "반격과 이탈을 한 묶음으로 반복",
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
        purpose: "상대를 따라가지 않고 대각선으로 이동해 퇴로를 줄인다.",
        drill: {
          title: "대각선 압박 스텝",
          rounds: 3,
          goal: "상대가 빠질 방향의 앞을 먼저 차지",
          cues: ["R1 대각선 전진", "R2 잽-대각선", "R3 더블 잽-링 자르기"],
        },
      },
      {
        id: "guard",
        label: "가드",
        title: "가드 뒤 전진",
        purpose: "상체를 세우고 작은 스텝으로 압박하며 잽을 받는다.",
        drill: {
          title: "하이 가드 전진",
          rounds: 3,
          goal: "가드가 시야를 가리지 않게 턱과 관자놀이 보호",
          cues: ["R1 가드-전진", "R2 가드-패리-전진", "R3 가드-잽-전진"],
        },
      },
      {
        id: "volume",
        label: "연타",
        title: "끊어 치는 연타",
        purpose: "한 번에 몰아치지 않고 2~3타 뒤 각도를 바꿔 다시 친다.",
        drill: {
          title: "3타-각도-3타",
          rounds: 4,
          goal: "호흡을 내쉬며 짧은 묶음으로 압박 유지",
          cues: ["R1 원투-훅", "R2 바디-헤드 3타", "R3 3타-피벗", "R4 3타-피벗-3타"],
        },
      },
      {
        id: "recover",
        label: "복구",
        title: "압박 위치 복구",
        purpose: "상대가 빠지면 정면 추격 대신 다시 퇴로 앞을 막는다.",
        drill: {
          title: "이탈 추적과 재압박",
          rounds: 3,
          goal: "공격 뒤 한 호흡 쉬며 중심과 가드 복구",
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
        purpose: "전환 전에 양쪽 스탠스에서 가드와 균형을 먼저 익힌다.",
        drill: {
          title: "양 자세 잽",
          rounds: 4,
          goal: "자세별로 중심과 뒷발 위치 확인",
          cues: ["R1 오소독스 잽", "R2 사우스포 잽", "R3 자세별 원투", "R4 자유 전환 없이 반복"],
        },
      },
      {
        id: "switch",
        label: "스위치",
        title: "안전한 스위치",
        purpose: "발이 교차되지 않게 공격 또는 이탈 동작 안에서 전환한다.",
        drill: {
          title: "스텝 백 스위치",
          rounds: 3,
          goal: "전환 순간 턱과 가드를 유지",
          cues: ["R1 스텝 백-전환", "R2 잽-스텝 백-전환", "R3 원투-전환"],
        },
      },
      {
        id: "lead-hand",
        label: "앞손",
        title: "새 앞손 사용",
        purpose: "전환 후 새 앞손 잽과 훅으로 바로 공격을 이어간다.",
        drill: {
          title: "스위치-앞손 공격",
          rounds: 3,
          goal: "전환 뒤 멈추지 않고 새 앞손으로 거리 확인",
          cues: ["R1 스위치-잽", "R2 스위치-앞손 훅", "R3 스위치-잽-크로스"],
        },
      },
      {
        id: "angle",
        label: "각도",
        title: "전환으로 각도 만들기",
        purpose: "보여주기식 전환이 아니라 상대 정면을 벗어날 때 사용한다.",
        drill: {
          title: "콤보-스위치 아웃",
          rounds: 3,
          goal: "전환 후 발 간격과 가드가 무너지면 속도를 낮추기",
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
    workSeconds: 180,
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
