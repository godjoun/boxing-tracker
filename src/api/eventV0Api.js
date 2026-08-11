import { getSupabase, isSupabaseConfigured } from "../lib/supabaseClient";
import {
  ensureEventV0AuthSession,
  getEventV0AuthUserIdIfPresent,
} from "../utils/eventV0Auth";

const DISPLAY_NAME_MAX = 40;
const GYM_NAME_MAX = 80;
const EXPERIENCE_MAX = 40;

function requireConfigured() {
  if (!isSupabaseConfigured || !getSupabase()) {
    throw new Error("Supabase is not configured");
  }
}

function assertEventId(eventId) {
  const value = String(eventId ?? "").trim();
  if (!value) throw new Error("행사 ID가 필요합니다.");
  return value;
}

function assertDisplayName(name) {
  const value = String(name ?? "").trim();
  if (!value || value.length > DISPLAY_NAME_MAX) {
    throw new Error(`이름은 1~${DISPLAY_NAME_MAX}자로 입력해 주세요.`);
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

function assertWeightKg(weightKg) {
  const value = Number(weightKg);
  if (!Number.isFinite(value) || value < 35 || value > 200) {
    throw new Error("체중은 35~200kg 사이로 입력해 주세요.");
  }
  return Math.round(value * 10) / 10;
}

function assertExperience(experience) {
  const value = String(experience ?? "").trim();
  if (!value || value.length > EXPERIENCE_MAX) {
    throw new Error("복싱 경력을 선택해 주세요.");
  }
  return value;
}

function mapParticipant(row) {
  if (!row) return null;
  return {
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id,
    displayName: row.display_name,
    gymName: row.gym_name,
    weightKg: row.weight_kg == null ? null : Number(row.weight_kg),
    experience: row.experience || "",
    attendanceStatus: row.attendance_status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRequest(row) {
  if (!row) return null;
  return {
    id: row.id,
    eventId: row.event_id,
    participantId: row.participant_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPairing(row) {
  if (!row) return null;
  const orderNumber = Number(row.order_number) || 0;
  const displayOrder =
    row.display_order == null ? orderNumber : Number(row.display_order) || 0;
  return {
    pairingId: row.pairing_id,
    orderNumber,
    displayOrder,
    pairingStatus: row.pairing_status,
    myParticipantId: row.my_participant_id,
    opponentParticipantId: row.opponent_participant_id,
    opponentDisplayName: row.opponent_display_name || "",
    opponentGymName: row.opponent_gym_name || "",
    opponentWeightKg:
      row.opponent_weight_kg == null ? null : Number(row.opponent_weight_kg),
    opponentExperience: row.opponent_experience || "",
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

function unwrapRow(data) {
  if (Array.isArray(data)) return data[0] ?? null;
  return data ?? null;
}

/** Normalize RPC/table payloads that may be null, object, or array. */
function asRowArray(data) {
  if (data == null) return [];
  return Array.isArray(data) ? data : [data];
}

function assertAtMostOneRow(rows, label) {
  if (rows.length > 1) {
    throw new Error(`${label}: multiple rows returned`);
  }
  return rows[0] ?? null;
}

/** Public event metadata (no secret). */
export async function getEventV0PublicEvent(eventId) {
  const id = assertEventId(eventId);
  requireConfigured();
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("event_v0_get_public_event", {
    p_event_id: id,
  });
  if (error) throw error;
  const row = unwrapRow(data);
  if (!row) return null;
  return {
    id: row.id,
    title: row.title || "",
    gymA: row.gym_a || "",
    gymB: row.gym_b || "",
    eventDate: row.event_date || null,
    location: row.location || "",
    status: row.status || "",
  };
}

/**
 * Own participant row for this event (null if none / no session).
 * Filter by user_id: RLS also exposes active-pairing opponents, so
 * event_id-only + maybeSingle() throws PGRST116 when paired.
 */
export async function getMyEventV0Participant(eventId) {
  const id = assertEventId(eventId);
  requireConfigured();
  const uid = await getEventV0AuthUserIdIfPresent();
  if (!uid) return null;

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("event_participants")
    .select("*")
    .eq("event_id", id)
    .eq("user_id", uid);

  if (error) throw error;
  const row = assertAtMostOneRow(asRowArray(data), "event_participants");
  return mapParticipant(row);
}

/**
 * Register as participant + create waiting sparring request.
 * Ensures Anonymous Auth session.
 */
export async function registerEventV0Sparring({
  eventId,
  displayName,
  gymName,
  weightKg,
  experience,
}) {
  const id = assertEventId(eventId);
  const name = assertDisplayName(displayName);
  const gym = assertGymName(gymName);
  const weight = assertWeightKg(weightKg);
  const exp = assertExperience(experience);
  requireConfigured();
  await ensureEventV0AuthSession();

  const supabase = getSupabase();
  const { data: partData, error: partErr } = await supabase.rpc(
    "event_v0_register_participant",
    {
      p_event_id: id,
      p_display_name: name,
      p_gym_name: gym,
      p_weight_kg: weight,
      p_experience: exp,
    }
  );
  if (partErr) throw partErr;
  const participant = mapParticipant(unwrapRow(partData));

  const { data: reqData, error: reqErr } = await supabase.rpc(
    "event_v0_create_sparring_request",
    { p_event_id: id }
  );

  if (reqErr) {
    const msg = String(reqErr.message || "").toLowerCase();
    // Already waiting / already paired — open status instead of failing hard.
    if (
      !msg.includes("waiting sparring request already exists") &&
      !msg.includes("already in an active pairing")
    ) {
      throw reqErr;
    }
    const existing = await getMyEventV0SparringRequests(id);
    const request =
      existing.find((r) => r.status === "assigned") ||
      existing.find((r) => r.status === "waiting") ||
      null;
    return { participant, request };
  }

  const request = mapRequest(unwrapRow(reqData));
  return { participant, request };
}

/** Update own profile. Blocked by RPC when active pairing exists. */
export async function updateMyEventV0Participant({
  eventId,
  displayName,
  gymName,
  weightKg,
  experience,
}) {
  const id = assertEventId(eventId);
  const name = assertDisplayName(displayName);
  const gym = assertGymName(gymName);
  const weight = assertWeightKg(weightKg);
  const exp = assertExperience(experience);
  requireConfigured();
  await ensureEventV0AuthSession();

  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("event_v0_update_my_participant", {
    p_event_id: id,
    p_display_name: name,
    p_gym_name: gym,
    p_weight_kg: weight,
    p_experience: exp,
  });
  if (error) throw error;
  return mapParticipant(unwrapRow(data));
}

/** Cancel own waiting sparring request. Does not delete participant. */
export async function cancelMyEventV0SparringRequest(eventId) {
  const id = assertEventId(eventId);
  requireConfigured();
  await ensureEventV0AuthSession();

  const supabase = getSupabase();
  const { data, error } = await supabase.rpc(
    "event_v0_cancel_my_sparring_request",
    { p_event_id: id }
  );
  if (error) throw error;
  return mapRequest(unwrapRow(data));
}

/** Re-queue waiting after cancel/complete (existing participant). */
export async function createMyEventV0SparringRequest(eventId) {
  const id = assertEventId(eventId);
  requireConfigured();
  await ensureEventV0AuthSession();

  const supabase = getSupabase();
  const { data, error } = await supabase.rpc(
    "event_v0_create_sparring_request",
    { p_event_id: id }
  );
  if (error) throw error;
  return mapRequest(unwrapRow(data));
}

/** Open sparring requests for current user (waiting / assigned). */
export async function getMyEventV0SparringRequests(eventId) {
  const id = assertEventId(eventId);
  requireConfigured();
  const uid = await getEventV0AuthUserIdIfPresent();
  if (!uid) return [];

  const supabase = getSupabase();
  const { data, error } = await supabase.rpc(
    "event_v0_get_my_sparring_requests",
    { p_event_id: id }
  );
  if (error) throw error;
  return asRowArray(data).map(mapRequest).filter(Boolean);
}

/** Active pairings for current user (includes opponent fields). */
export async function getMyEventV0Pairings(eventId) {
  const id = assertEventId(eventId);
  requireConfigured();
  const uid = await getEventV0AuthUserIdIfPresent();
  if (!uid) return [];

  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("event_v0_get_my_pairings", {
    p_event_id: id,
  });
  if (error) throw error;
  const rows = asRowArray(data).map(mapPairing).filter(Boolean);

  // Prefer SECURITY DEFINER helper so participant matches operator (needs hotfix).
  await Promise.all(
    rows.map(async (row) => {
      const { data: display, error: displayErr } = await supabase.rpc(
        "event_v0_pairing_display_order",
        { p_event_id: id, p_order_number: row.orderNumber }
      );
      if (!displayErr && display != null) {
        row.displayOrder = Number(display) || row.orderNumber;
      }
    })
  );

  return rows;
}

/** Combined status poll for participant UI. */
export async function getMyEventV0Status(eventId) {
  const [participant, requests, pairings] = await Promise.all([
    getMyEventV0Participant(eventId),
    getMyEventV0SparringRequests(eventId),
    getMyEventV0Pairings(eventId),
  ]);

  const openRequests = requests.filter(
    (r) => r.status === "assigned" || r.status === "waiting"
  );
  if (openRequests.length > 1) {
    throw new Error("sparring_requests: multiple open rows returned");
  }
  if (pairings.length > 1) {
    throw new Error("pairings: multiple active rows returned");
  }

  const openRequest = openRequests[0] || null;
  const activePairing = pairings[0] || null;

  return {
    participant,
    openRequest,
    activePairing,
    requests,
    pairings,
  };
}

export function formatEventV0Date(dateIso) {
  const raw = String(dateIso || "").trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}.${match[2]}.${match[3]}`;
  return raw;
}
