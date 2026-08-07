import { describe, expect, it } from "vitest";
import {
  GYM_EXCHANGE_DEV_FIXTURE,
  GYM_EXCHANGE_EVENT_V1,
  getPublishableGymExchangeEventById,
  isPublishableGymExchangeEvent,
  listPublishableGymExchangeEvents,
} from "./gymExchangeEvent";

describe("gymExchangeEvent registry", () => {
  it("keeps production event as unpublished draft", () => {
    expect(GYM_EXCHANGE_EVENT_V1.status).toBe("draft");
    expect(isPublishableGymExchangeEvent(GYM_EXCHANGE_EVENT_V1)).toBe(false);
    expect(getPublishableGymExchangeEventById(GYM_EXCHANGE_EVENT_V1.id)).toBeNull();
  });

  it("exposes DEV fixture only when DEV", () => {
    if (import.meta.env.DEV) {
      expect(GYM_EXCHANGE_DEV_FIXTURE?.id).toBe("mantle-gym-exchange-dev-fixture");
      expect(isPublishableGymExchangeEvent(GYM_EXCHANGE_DEV_FIXTURE)).toBe(true);
      expect(
        listPublishableGymExchangeEvents().some(
          (event) => event.id === GYM_EXCHANGE_DEV_FIXTURE.id
        )
      ).toBe(true);
    } else {
      expect(GYM_EXCHANGE_DEV_FIXTURE).toBeNull();
      expect(listPublishableGymExchangeEvents()).toEqual([]);
    }
  });

  it("rejects incomplete events", () => {
    expect(
      isPublishableGymExchangeEvent({
        id: "x",
        title: "T",
        gymA: "A",
        gymB: "B",
        date: "2026-09-01",
        location: "",
        status: "upcoming",
      })
    ).toBe(false);
  });
});
