/**
 * Visual 5kg weight bands for EVENT v0 operator waiting list.
 * Not official boxing weight classes — operator scan aid only.
 */

const BAND_STEP = 5;

/** @returns {number|null} band low edge (e.g. 60 for 60–64.9), or null if unknown */
export function getEventV0WeightBandFloor(weightKg) {
  if (weightKg == null || weightKg === "") return null;
  const value = Number(weightKg);
  if (!Number.isFinite(value)) return null;
  return Math.floor(value / BAND_STEP) * BAND_STEP;
}

/** @returns {string} e.g. "60~64.9kg" or "체중 미입력" */
export function formatEventV0WeightBandLabel(bandFloor) {
  if (bandFloor == null || !Number.isFinite(Number(bandFloor))) {
    return "체중 미입력";
  }
  const low = Number(bandFloor);
  const high = low + BAND_STEP - 0.1;
  const highLabel = Number.isInteger(high) ? String(high) : high.toFixed(1);
  return `${low}~${highLabel}kg`;
}

function requestTimeMs(requestedAt) {
  if (!requestedAt) return Number.POSITIVE_INFINITY;
  const ms = Date.parse(requestedAt);
  return Number.isFinite(ms) ? ms : Number.POSITIVE_INFINITY;
}

/**
 * Group waiting rows by 5kg band (low → high).
 * Within a band: earliest waiting request first (requested_at / created_at).
 * Each item gets queueIndex (1-based) inside its band.
 *
 * @param {Array<{ participantId: string, weightKg?: number|null, requestedAt?: string|null }>} waitingRows
 * @returns {Array<{ bandFloor: number|null, label: string, items: Array }>}
 */
export function groupEventV0WaitingByWeightBand(waitingRows) {
  const rows = Array.isArray(waitingRows) ? waitingRows.slice() : [];
  const byBand = new Map();

  for (const row of rows) {
    const bandFloor = getEventV0WeightBandFloor(row?.weightKg);
    const key = bandFloor == null ? "none" : String(bandFloor);
    if (!byBand.has(key)) byBand.set(key, []);
    byBand.get(key).push(row);
  }

  const keys = [...byBand.keys()].sort((a, b) => {
    if (a === "none") return 1;
    if (b === "none") return -1;
    return Number(a) - Number(b);
  });

  return keys.map((key) => {
    const bandFloor = key === "none" ? null : Number(key);
    const items = byBand
      .get(key)
      .slice()
      .sort((a, b) => {
        const t = requestTimeMs(a.requestedAt) - requestTimeMs(b.requestedAt);
        if (t !== 0) return t;
        return String(a.participantId || "").localeCompare(
          String(b.participantId || "")
        );
      })
      .map((row, index) => ({
        ...row,
        queueIndex: index + 1,
      }));

    return {
      bandFloor,
      label: formatEventV0WeightBandLabel(bandFloor),
      items,
    };
  });
}
