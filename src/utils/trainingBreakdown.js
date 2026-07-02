function getMinutes(log) {
  return Number(log.minutes || log.duration || 0) || 0;
}

function getRounds(log) {
  return (
    Number(
      log.rounds ||
        log.totalRounds ||
        log.completedRounds ||
        log.round ||
        0
    ) || 0
  );
}

export function buildTrainingBreakdown(logs, limit = 6) {
  const totals = {};

  logs.forEach((log) => {
    const type = (log.type || "기타").trim() || "기타";

    if (!totals[type]) {
      totals[type] = { type, count: 0, minutes: 0, rounds: 0 };
    }

    totals[type].count += 1;
    totals[type].minutes += getMinutes(log);
    totals[type].rounds += getRounds(log);
  });

  const items = Object.values(totals).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    if (b.minutes !== a.minutes) return b.minutes - a.minutes;
    return b.rounds - a.rounds;
  });

  const maxCount = items[0]?.count || 0;

  return items.slice(0, limit).map((item) => ({
    ...item,
    percent: maxCount > 0 ? Math.round((item.count / maxCount) * 100) : 0,
  }));
}
