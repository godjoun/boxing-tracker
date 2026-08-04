/**
 * 프로필 「교류의 흔적」 — Vision Loop / Community Principle
 * 완료·소속만. 문의·좋아요·배지 없음.
 */

export function buildCommunityTraces({
  profile = {},
  exchangeEvents = [],
  appliedEventIds = [],
  sparringLogs = [],
} = {}) {
  const items = [];

  if (profile.homeGymName) {
    items.push({
      id: `gym-${profile.homeGymId || profile.homeGymName}`,
      type: "체육관",
      title: profile.homeGymName,
      meta: profile.homeGymAddress || profile.area || "내 체육관",
      date: "",
      sortAt: Number.MAX_SAFE_INTEGER,
    });
  }

  const appliedSet = new Set(appliedEventIds.map(String));
  for (const event of exchangeEvents) {
    const id = String(event.id || "");
    const isMine =
      event.isMine ||
      event.isHost ||
      appliedSet.has(id) ||
      event.applied;
    if (!isMine) continue;

    const startsAt = event.startsAt || event.starts_at || event.date || "";
    items.push({
      id: `meet-${id}`,
      type: "모임",
      title: event.title || "모임",
      meta: [event.gymName || event.gym_name, formatTraceDate(startsAt)]
        .filter(Boolean)
        .join(" · "),
      date: formatTraceDate(startsAt),
      sortAt: Date.parse(startsAt) || 0,
    });
  }

  for (const log of sparringLogs) {
    const when = log.date || log.createdAt || "";
    items.push({
      id: `spar-${log.id || when}`,
      type: "스파링",
      title: log.type || "스파링",
      meta: [
        log.rounds || log.totalRounds
          ? `${Number(log.rounds || log.totalRounds || 0)}R`
          : null,
        formatTraceDate(when),
      ]
        .filter(Boolean)
        .join(" · "),
      date: formatTraceDate(when),
      sortAt: Date.parse(when) || 0,
    });
  }

  const history = items
    .filter((item) => item.type !== "체육관")
    .sort((a, b) => b.sortAt - a.sortAt);

  const gymCount = profile.homeGymName ? 1 : 0;
  const meetCount = history.filter((item) => item.type === "모임").length;
  const sparCount = history.filter((item) => item.type === "스파링").length;

  return {
    summary: {
      exchangeCount: meetCount + sparCount,
      sparringCount: sparCount,
      gymCount,
    },
    recent: [
      ...(profile.homeGymName
        ? [
            {
              id: `gym-${profile.homeGymId || profile.homeGymName}`,
              type: "체육관",
              title: profile.homeGymName,
              meta: profile.homeGymAddress || profile.area || "내 체육관",
              date: "",
            },
          ]
        : []),
      ...history.slice(0, 5),
    ].slice(0, 6),
  };
}

function formatTraceDate(value) {
  if (!value) return "";
  const raw = String(value);
  const dateOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnly) {
    return `${dateOnly[1]}.${dateOnly[2]}.${dateOnly[3]}`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return raw.slice(0, 10);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}.${m}.${d}`;
}

export function pickSparringLogs(logs = []) {
  return logs.filter((log) =>
    /스파링|sparring/i.test(String(log.type || log.note || ""))
  );
}
