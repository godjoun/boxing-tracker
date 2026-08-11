/**
 * Field-facing bout sequence for EVENT v0.
 * Internal pairings.order_number stays immutable (never reuse cancelled).
 *
 * Display order = order_number − (cancelled rows with order_number ≤ target)
 * so a hole from cancel pulls later bouts up on screen only.
 */
export function computeEventV0DisplayOrder(orderNumber, pairings) {
  const order = Number(orderNumber) || 0;
  if (order < 1) return order;

  let cancelledAtOrBelow = 0;
  if (Array.isArray(pairings)) {
    for (const pairing of pairings) {
      if (String(pairing?.status || "").toLowerCase() !== "cancelled") {
        continue;
      }
      const n = Number(pairing.orderNumber) || 0;
      if (n >= 1 && n <= order) cancelledAtOrBelow += 1;
    }
  }

  return Math.max(order - cancelledAtOrBelow, 1);
}
