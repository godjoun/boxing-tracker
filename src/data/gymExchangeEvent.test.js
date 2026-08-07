import { describe, expect, it } from "vitest";
import { GYM_EXCHANGE_EVENT_V1, getGymExchangeEventById } from "../data/gymExchangeEvent";

describe("gymExchangeEvent constant", () => {
  it("exposes a stable id without fabricating gym/date copy", () => {
    expect(GYM_EXCHANGE_EVENT_V1.id).toBe("mantle-gym-exchange-2026-09");
    expect(GYM_EXCHANGE_EVENT_V1.status).toBe("draft");
    expect(GYM_EXCHANGE_EVENT_V1.gymA).toBe("");
    expect(GYM_EXCHANGE_EVENT_V1.gymB).toBe("");
    expect(GYM_EXCHANGE_EVENT_V1.date).toBe("");
  });

  it("looks up by id", () => {
    expect(getGymExchangeEventById(GYM_EXCHANGE_EVENT_V1.id)).toBe(
      GYM_EXCHANGE_EVENT_V1
    );
    expect(getGymExchangeEventById("missing")).toBeNull();
  });
});
