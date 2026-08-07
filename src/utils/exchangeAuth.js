import { getSupabase, isSupabaseConfigured } from "../lib/supabaseClient";

/**
 * 체육관 교류 participation 소유권용 Auth 세션.
 * TrainingContext userId와 무관. 앱 시작 시 호출하지 말 것.
 *
 * @returns {Promise<string>} auth.users.id (uuid)
 */
export async function ensureExchangeAuthSession() {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured");
  }

  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Supabase is not configured");
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (session?.user?.id) {
    return session.user.id;
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    throw error;
  }

  const userId = data?.user?.id || data?.session?.user?.id;
  if (!userId) {
    throw new Error("Anonymous sign-in did not return a user id");
  }

  return userId;
}
