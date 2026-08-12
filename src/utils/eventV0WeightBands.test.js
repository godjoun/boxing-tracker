import { describe, expect, it } from "vitest";
import {
  formatEventV0WeightBandLabel,
  getEventV0WeightBandFloor,
  groupEventV0WaitingByWeightBand,
} from "./eventV0WeightBands";

describe("eventV0WeightBands", () => {
  it("floors weights into 5kg bands", () => {
    expect(getEventV0WeightBandFloor(50)).toBe(50);
    expect(getEventV0WeightBandFloor(54.9)).toBe(50);
    expect(getEventV0WeightBandFloor(55)).toBe(55);
    expect(getEventV0WeightBandFloor(64.9)).toBe(60);
    expect(getEventV0WeightBandFloor(null)).toBe(null);
  });

  it("formats band labels", () => {
    expect(formatEventV0WeightBandLabel(60)).toBe("60~64.9kg");
    expect(formatEventV0WeightBandLabel(null)).toBe("체중 미입력");
  });

  it("groups by band and sorts by requestedAt within band", () => {
    const groups = groupEventV0WaitingByWeightBand([
      {
        participantId: "b",
        weightKg: 62,
        requestedAt: "2026-08-12T10:02:00.000Z",
      },
      {
        participantId: "a",
        weightKg: 61.5,
        requestedAt: "2026-08-12T10:00:00.000Z",
      },
      {
        participantId: "c",
        weightKg: 55.2,
        requestedAt: "2026-08-12T09:00:00.000Z",
      },
    ]);

    expect(groups.map((g) => g.label)).toEqual([
      "55~59.9kg",
      "60~64.9kg",
    ]);
    expect(groups[0].items.map((i) => i.participantId)).toEqual(["c"]);
    expect(groups[1].items.map((i) => [i.participantId, i.queueIndex])).toEqual([
      ["a", 1],
      ["b", 2],
    ]);
  });
});
