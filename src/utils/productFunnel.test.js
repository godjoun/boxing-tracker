import { beforeEach, describe, expect, it, vi } from "vitest";

const insert = vi.fn(() => ({
  then: (onFulfilled) => Promise.resolve({ error: null }).then(onFulfilled),
  catch: (onRejected) => Promise.resolve({ error: null }).catch(onRejected),
}));
const from = vi.fn(() => ({ insert }));

vi.mock("../lib/supabaseClient", () => ({
  isSupabaseConfigured: true,
  getSupabase: () => ({ from }),
}));

describe("trackProductEvent", () => {
  beforeEach(() => {
    insert.mockClear();
    from.mockClear();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("exports exactly the five allowed event names", async () => {
    const { PRODUCT_FUNNEL_EVENTS } = await import("./productFunnel");
    expect([...PRODUCT_FUNNEL_EVENTS]).toEqual([
      "app_open",
      "training_start",
      "training_complete",
      "training_card_create",
      "profile_view",
    ]);
  });

  it("does not insert outside PROD", async () => {
    vi.stubEnv("PROD", false);
    const { trackProductEvent } = await import("./productFunnel");
    trackProductEvent("app_open");
    expect(from).not.toHaveBeenCalled();
  });

  it("rejects unknown event names in PROD", async () => {
    vi.stubEnv("PROD", true);
    const { trackProductEvent } = await import("./productFunnel");
    trackProductEvent("card_save");
    expect(from).not.toHaveBeenCalled();
  });

  it("inserts event_name only in PROD for allowed events", async () => {
    vi.stubEnv("PROD", true);
    const { trackProductEvent } = await import("./productFunnel");
    trackProductEvent("training_start");
    expect(from).toHaveBeenCalledWith("product_funnel_events");
    expect(insert).toHaveBeenCalledWith({ event_name: "training_start" });
  });
});
