import { getSupabase, isSupabaseConfigured } from "../lib/supabaseClient";

export const PRODUCT_FUNNEL_EVENTS = Object.freeze([
  "app_open",
  "training_start",
  "training_complete",
  "training_card_create",
  "profile_view",
]);

const ALLOWED = new Set(PRODUCT_FUNNEL_EVENTS);

const PRODUCTION_HOST = "boxing-tracker.vercel.app";

/**
 * Fire-and-forget product funnel counter.
 * Production host + PROD + configured Supabase only. Never throws. No PII / payload.
 */
export function trackProductEvent(eventName) {
  try {
    if (!import.meta.env.PROD) return;
    if (typeof window === "undefined") return;
    if (window.location.hostname !== PRODUCTION_HOST) return;
    if (!ALLOWED.has(eventName)) return;
    if (!isSupabaseConfigured) return;

    const supabase = getSupabase();
    if (!supabase) return;

    void supabase
      .from("product_funnel_events")
      .insert({ event_name: eventName })
      .then(() => {})
      .catch(() => {});
  } catch {
    // Analytics must never break the app.
  }
}
