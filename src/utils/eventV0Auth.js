import { ensureExchangeAuthSession } from "./exchangeAuth";
import { getSupabase, isSupabaseConfigured } from "../lib/supabaseClient";

/**
 * EVENT v0 participant auth — thin wrapper over exchange Anonymous Auth.
 * Does not change exchangeAuth.js behavior.
 *
 * @returns {Promise<string>} auth.users.id
 */
export async function ensureEventV0AuthSession() {
  return ensureExchangeAuthSession();
}

/** Existing session only. No anonymous sign-in. */
export async function getEventV0AuthUserIdIfPresent() {
  if (!isSupabaseConfigured) return null;
  const supabase = getSupabase();
  if (!supabase) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user?.id || null;
}
