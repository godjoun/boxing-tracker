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

function stubHostname(hostname) {
  vi.stubGlobal("window", {
    location: { hostname },
  });
}

describe("trackProductEvent", () => {
  beforeEach(() => {
    insert.mockClear();
    from.mockClear();
    insert.mockImplementation(() => ({
      then: (onFulfilled) => Promise.resolve({ error: null }).then(onFulfilled),
      catch: (onRejected) => Promise.resolve({ error: null }).catch(onRejected),
    }));
    vi.unstubAllEnvs();
    vi.resetModules();
    stubHostname("boxing-tracker.vercel.app");
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

  it("blocks DEV (non-PROD)", async () => {
    vi.stubEnv("PROD", false);
    stubHostname("boxing-tracker.vercel.app");
    const { trackProductEvent } = await import("./productFunnel");
    trackProductEvent("app_open");
    expect(from).not.toHaveBeenCalled();
  });

  it("blocks Vercel Preview hostname", async () => {
    vi.stubEnv("PROD", true);
    stubHostname("boxing-tracker-7m2xvz4rd-godjouns-projects.vercel.app");
    const { trackProductEvent } = await import("./productFunnel");
    trackProductEvent("app_open");
    expect(from).not.toHaveBeenCalled();
  });

  it("blocks localhost", async () => {
    vi.stubEnv("PROD", true);
    stubHostname("localhost");
    const { trackProductEvent } = await import("./productFunnel");
    trackProductEvent("training_start");
    expect(from).not.toHaveBeenCalled();
  });

  it("allows boxing-tracker.vercel.app in PROD", async () => {
    vi.stubEnv("PROD", true);
    stubHostname("boxing-tracker.vercel.app");
    const { trackProductEvent } = await import("./productFunnel");
    trackProductEvent("training_start");
    expect(from).toHaveBeenCalledWith("product_funnel_events");
    expect(insert).toHaveBeenCalledWith({ event_name: "training_start" });
  });

  it("rejects unknown event names on production host", async () => {
    vi.stubEnv("PROD", true);
    stubHostname("boxing-tracker.vercel.app");
    const { trackProductEvent } = await import("./productFunnel");
    trackProductEvent("card_save");
    expect(from).not.toHaveBeenCalled();
  });

  it("does not throw when analytics insert fails", async () => {
    vi.stubEnv("PROD", true);
    stubHostname("boxing-tracker.vercel.app");
    insert.mockImplementation(() => {
      throw new Error("insert failed");
    });
    const { trackProductEvent } = await import("./productFunnel");
    expect(() => trackProductEvent("profile_view")).not.toThrow();
  });

  it("does not throw when supabase client throws", async () => {
    vi.stubEnv("PROD", true);
    stubHostname("boxing-tracker.vercel.app");
    from.mockImplementation(() => {
      throw new Error("client boom");
    });
    const { trackProductEvent } = await import("./productFunnel");
    expect(() => trackProductEvent("app_open")).not.toThrow();
  });
});
