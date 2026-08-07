import { getSupabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { ensureExchangeAuthSession } from "../utils/exchangeAuth";

const NICKNAME_MAX = 40;
const GYM_NAME_MAX = 80;

function mapParticipation(row) {
  if (!row) return null;
  return {
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id,
    nickname: row.nickname,
    gymName: row.gym_name,
    sparringRounds: Number(row.sparring_rounds) || 0,
    joinedAt: row.joined_at,
    updatedAt: row.updated_at,
  };
}

function assertNickname(nickname) {
  const value = String(nickname ?? "").trim();
  if (!value || value.length > NICKNAME_MAX) {
    throw new Error(`닉네임은 1~${NICKNAME_MAX}자로 입력해 주세요.`);
  }
  return value;
}

function assertGymName(gymName) {
  const value = String(gymName ?? "").trim();
  if (!value || value.length > GYM_NAME_MAX) {
    throw new Error(`체육관명은 1~${GYM_NAME_MAX}자로 입력해 주세요.`);
  }
  return value;
}

function assertRounds(rounds) {
  const value = Number(rounds);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error("스파링 라운드는 0 이상의 정수여야 합니다.");
  }
  return value;
}

function assertEventId(eventId) {
  const value = String(eventId ?? "").trim();
  if (!value) {
    throw new Error("eventId가 필요합니다.");
  }
  return value;
}

function requireConfigured() {
  if (!isSupabaseConfigured || !getSupabase()) {
    throw new Error("Supabase is not configured");
  }
}

/**
 * 내 participation만 조회 (RLS: auth.uid() = user_id).
 * @param {string} eventId
 */
export async function getMyGymExchangeParticipation(eventId) {
  const id = assertEventId(eventId);
  requireConfigured();
  await ensureExchangeAuthSession();

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("dojo_gym_exchange_participations")
    .select("*")
    .eq("event_id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return mapParticipation(data);
}

/**
 * 행사 참가. user_id는 RPC가 auth.uid()로 고정.
 * 동일 (event_id, user_id)면 기존 row 반환.
 * @param {string} eventId
 * @param {string} nickname
 * @param {string} gymName
 */
export async function joinGymExchange(eventId, nickname, gymName) {
  const id = assertEventId(eventId);
  const nick = assertNickname(nickname);
  const gym = assertGymName(gymName);
  requireConfigured();
  await ensureExchangeAuthSession();

  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("join_gym_exchange_participation", {
    p_event_id: id,
    p_nickname: nick,
    p_gym_name: gym,
  });

  if (error) {
    throw error;
  }

  return mapParticipation(Array.isArray(data) ? data[0] : data);
}

/**
 * 내 스파링 라운드를 최종값으로 저장 (절대값). ±1 UI는 나중.
 * 타인 row는 RLS/RPC가 거부.
 * @param {string} eventId
 * @param {number} rounds
 */
export async function updateMySparringRounds(eventId, rounds) {
  const id = assertEventId(eventId);
  const nextRounds = assertRounds(rounds);
  requireConfigured();
  await ensureExchangeAuthSession();

  const supabase = getSupabase();
  const { data, error } = await supabase.rpc(
    "update_my_gym_exchange_sparring_rounds",
    {
      p_event_id: id,
      p_rounds: nextRounds,
    }
  );

  if (error) {
    throw error;
  }

  return mapParticipation(Array.isArray(data) ? data[0] : data);
}
