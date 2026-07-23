const MIN_PREP_SECONDS = 60;
const MAX_PREP_SECONDS = 600;
const MAX_COOLDOWN_SECONDS = 600;

export function formatTimerDurationLabel(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;

  if (minutes > 0 && remainder > 0) {
    return `${minutes}분 ${remainder}초`;
  }

  if (minutes > 0) {
    return `${minutes}분`;
  }

  return `${remainder}초`;
}

export function getDrillRole(drill) {
  const name = drill?.name || "";

  if (/워밍업/i.test(name)) return "warmup";
  if (/쿨다운|마무리/i.test(name)) return "cooldown";
  return "round";
}

export function parseDrillDurationToSeconds(duration) {
  if (!duration || /라운드/i.test(duration)) {
    return null;
  }

  const minuteMatch = `${duration}`.match(/(\d+)\s*분/);
  if (minuteMatch) {
    return Number(minuteMatch[1]) * 60;
  }

  const secondMatch = `${duration}`.match(/(\d+)\s*초/);
  if (secondMatch) {
    return Number(secondMatch[1]);
  }

  return null;
}

export function clampPrepSeconds(seconds) {
  return Math.max(MIN_PREP_SECONDS, Math.min(MAX_PREP_SECONDS, Number(seconds) || MIN_PREP_SECONDS));
}

export function clampCooldownSeconds(seconds) {
  return Math.max(0, Math.min(MAX_COOLDOWN_SECONDS, Number(seconds) || 0));
}

export function resolveSessionTimerConfig(session) {
  const rounds = Number(session?.rounds) || 3;
  const workSeconds = Number(session?.workSeconds) || 120;
  const restSeconds = Number(session?.restSeconds) || 30;
  const explicitPrepSeconds = Number(session?.prepSeconds);
  const hasExplicitPrep = Number.isFinite(explicitPrepSeconds);
  const drills = Array.isArray(session?.drills) ? session.drills : [];
  const workMinutes = Math.max(1, Math.round(workSeconds / 60));

  const warmup = drills.find((drill) => getDrillRole(drill) === "warmup");
  const cooldown = drills.find((drill) => getDrillRole(drill) === "cooldown");

  const prepSeconds = hasExplicitPrep
    ? Math.max(0, Math.min(MAX_PREP_SECONDS, explicitPrepSeconds))
    : warmup
      ? clampPrepSeconds(
          parseDrillDurationToSeconds(warmup.duration) ?? MIN_PREP_SECONDS
        )
      : drills.length > 0
        ? MIN_PREP_SECONDS
        : 10;

  const cooldownSeconds = cooldown
    ? clampCooldownSeconds(parseDrillDurationToSeconds(cooldown.duration) ?? 0)
    : 0;

  const syncedDrills = drills.map((drill) => {
    const role = getDrillRole(drill);

    if (role === "warmup") {
      return {
        ...drill,
        timerRole: role,
        displayDuration: `준비 ${formatTimerDurationLabel(prepSeconds)}`,
      };
    }

    if (role === "cooldown") {
      return {
        ...drill,
        timerRole: role,
        displayDuration: cooldownSeconds
          ? `마무리 ${formatTimerDurationLabel(cooldownSeconds)}`
          : drill.duration,
      };
    }

    return {
      ...drill,
      timerRole: role,
      displayDuration: `라운드 ${workMinutes}분`,
    };
  });

  return {
    rounds,
    workSeconds,
    restSeconds,
    prepSeconds,
    cooldownSeconds,
    syncedDrills,
    scheduleSummary: buildScheduleSummary({
      prepSeconds,
      rounds,
      workSeconds,
      restSeconds,
      cooldownSeconds,
    }),
  };
}

export function buildScheduleSummary({
  prepSeconds,
  rounds,
  workSeconds,
  restSeconds,
  cooldownSeconds,
}) {
  const parts = [];

  if (prepSeconds > 10) {
    parts.push(`준비 ${formatTimerDurationLabel(prepSeconds)}`);
  }

  parts.push(`${rounds}R × ${formatTimerDurationLabel(workSeconds)}`);
  parts.push(`휴식 ${restSeconds}초`);

  if (cooldownSeconds > 0) {
    parts.push(`마무리 ${formatTimerDurationLabel(cooldownSeconds)}`);
  }

  return parts.join(" · ");
}

export function getDrillDisplayDuration(drill, session) {
  const config = resolveSessionTimerConfig(session);
  const synced = config.syncedDrills.find((item) => item.name === drill.name);

  return synced?.displayDuration || drill.duration;
}

function getDrillRoundLabel(drill, totalRounds) {
  if (!drill) return null;

  if (Number.isFinite(drill.roundFrom) && Number.isFinite(drill.roundTo)) {
    const { roundFrom, roundTo } = drill;
    return roundFrom === roundTo ? `R${roundFrom}` : `R${roundFrom}-${roundTo}`;
  }

  const name = drill.name || "";
  const rangeMatch = name.match(/라운드\s*(\d+)\s*[-~]\s*(\d+)/i);

  if (rangeMatch) {
    const from = Number(rangeMatch[1]);
    const to = Number(rangeMatch[2]);
    return from === to ? `R${from}` : `R${from}-${to}`;
  }

  const singleMatch = name.match(/(?:^|\s)라운드\s*(\d+)(?:\s|$)/i);

  if (singleMatch && !/[-~]/.test(name)) {
    return `R${Number(singleMatch[1])}`;
  }

  return null;
}

function pickPrimaryRoundDrill(roundDrills) {
  return (
    roundDrills.find((drill) => /라운드/i.test(drill.duration)) ||
    roundDrills[roundDrills.length - 1] ||
    roundDrills[0] ||
    null
  );
}

/** 커리큘럼 페이지용 — 드릴 목록을 하나의 가이드 카드로 요약 */
export function buildSessionDrillGuide(
  syncedDrills = [],
  totalRounds = 3,
  workSeconds = 120
) {
  const warmup = syncedDrills.find((drill) => drill.timerRole === "warmup");
  const cooldown = syncedDrills.find((drill) => drill.timerRole === "cooldown");
  const roundDrills = syncedDrills.filter((drill) => drill.timerRole === "round");
  const workMinutes = Math.max(1, Math.round(workSeconds / 60));
  const roundTiming = `${totalRounds}R × ${workMinutes}분`;

  if (roundDrills.length <= 1) {
    const primary = pickPrimaryRoundDrill(roundDrills);

    return {
      mode: "single",
      title: primary?.name || "라운드 훈련",
      timing: roundTiming,
      description: primary?.description || "",
      combos: primary?.combos || [],
      prepNote: warmup
        ? `${warmup.name} · ${warmup.displayDuration || warmup.duration}`
        : null,
      cooldownNote: cooldown
        ? `${cooldown.name} · ${cooldown.displayDuration || cooldown.duration}`
        : null,
    };
  }

  return {
    mode: "multi",
    title: `${totalRounds}라운드 구성`,
    timing: roundTiming,
    segments: roundDrills.map((drill) => ({
      roundLabel: getDrillRoundLabel(drill, totalRounds),
      name: drill.name,
      description: drill.description || "",
      combos: drill.combos || [],
    })),
    prepNote: warmup
      ? `${warmup.name} · ${warmup.displayDuration || warmup.duration}`
      : null,
    cooldownNote: cooldown
      ? `${cooldown.name} · ${cooldown.displayDuration || cooldown.duration}`
      : null,
  };
}
