import { getSupabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { ensureEventV0AuthSession } from "../utils/eventV0Auth";

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

function assertSecret(secret) {
  const value = String(secret ?? "").trim();
  if (!value) throw new Error("운영자 키를 입력해 주세요.");
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

function unwrapRow(data) {
  if (Array.isArray(data)) return data[0] ?? null;
  return data ?? null;
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

function mapWaitingRequest(row) {
  if (!row) return null;
  return {
    requestId: row.request_id,
    participantId: row.participant_id,
    displayName: row.display_name || "",
    gymName: row.gym_name || "",
    weightKg: row.weight_kg == null ? null : Number(row.weight_kg),
    experience: row.experience || "",
    attendanceStatus: row.attendance_status || "",
    requestStatus: row.request_status || "",
    requestedAt: row.requested_at,
  };
}

function mapPairing(row) {
  if (!row) return null;
  return {
    id: row.id,
    eventId: row.event_id,
    participantAId: row.participant_a_id,
    participantBId: row.participant_b_id,
    sparringRequestAId: row.sparring_request_a_id,
    sparringRequestBId: row.sparring_request_b_id,
    orderNumber: Number(row.order_number) || 0,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  };
}

async function withOperatorAuth() {
  requireConfigured();
  await ensureEventV0AuthSession();
  return getSupabase();
}

function opArgs(eventId, secret, extra = {}) {
  return {
    p_event_id: assertEventId(eventId),
    p_operator_secret: assertSecret(secret),
    ...extra,
  };
}

/** Unlock check — list participants with secret. */
export async function verifyEventV0OperatorSecret(eventId, secret) {
  const supabase = await withOperatorAuth();
  const { error } = await supabase.rpc(
    "event_v0_operator_list_participants",
    opArgs(eventId, secret)
  );
  if (error) throw error;
  return true;
}

export async function operatorListParticipants(eventId, secret) {
  const supabase = await withOperatorAuth();
  const { data, error } = await supabase.rpc(
    "event_v0_operator_list_participants",
    opArgs(eventId, secret)
  );
  if (error) throw error;
  return (Array.isArray(data) ? data : []).map(mapParticipant).filter(Boolean);
}

export async function operatorListWaitingRequests(eventId, secret) {
  const supabase = await withOperatorAuth();
  const { data, error } = await supabase.rpc(
    "event_v0_operator_list_sparring_requests",
    opArgs(eventId, secret)
  );
  if (error) throw error;
  return (Array.isArray(data) ? data : [])
    .map(mapWaitingRequest)
    .filter(Boolean);
}

export async function operatorListPairings(eventId, secret) {
  const supabase = await withOperatorAuth();
  const { data, error } = await supabase.rpc(
    "event_v0_operator_list_pairings",
    opArgs(eventId, secret)
  );
  if (error) throw error;
  return (Array.isArray(data) ? data : []).map(mapPairing).filter(Boolean);
}

export async function operatorLoadBoard(eventId, secret) {
  const [participants, waiting, pairings] = await Promise.all([
    operatorListParticipants(eventId, secret),
    operatorListWaitingRequests(eventId, secret),
    operatorListPairings(eventId, secret),
  ]);
  return { participants, waiting, pairings };
}

export async function operatorAddParticipant(
  eventId,
  secret,
  { displayName, gymName, weightKg, experience, attendanceStatus = "active" }
) {
  const supabase = await withOperatorAuth();
  const { data, error } = await supabase.rpc(
    "event_v0_operator_add_participant",
    opArgs(eventId, secret, {
      p_display_name: assertDisplayName(displayName),
      p_gym_name: assertGymName(gymName),
      p_weight_kg: assertWeightKg(weightKg),
      p_experience: assertExperience(experience),
      p_attendance_status: attendanceStatus,
    })
  );
  if (error) throw error;
  return mapParticipant(unwrapRow(data));
}

export async function operatorUpdateParticipant(
  eventId,
  secret,
  participantId,
  patch
) {
  const supabase = await withOperatorAuth();
  const extra = { p_participant_id: participantId };
  if (patch.displayName != null) {
    extra.p_display_name = assertDisplayName(patch.displayName);
  }
  if (patch.gymName != null) {
    extra.p_gym_name = assertGymName(patch.gymName);
  }
  if (patch.weightKg != null) {
    extra.p_weight_kg = assertWeightKg(patch.weightKg);
  }
  if (patch.experience != null) {
    extra.p_experience = assertExperience(patch.experience);
  }
  if (patch.attendanceStatus != null) {
    extra.p_attendance_status = String(patch.attendanceStatus).trim();
  }
  const { data, error } = await supabase.rpc(
    "event_v0_operator_update_participant",
    opArgs(eventId, secret, extra)
  );
  if (error) throw error;
  return mapParticipant(unwrapRow(data));
}

export async function operatorCreateSparringRequest(
  eventId,
  secret,
  participantId
) {
  const supabase = await withOperatorAuth();
  const { data, error } = await supabase.rpc(
    "event_v0_operator_create_sparring_request",
    opArgs(eventId, secret, { p_participant_id: participantId })
  );
  if (error) throw error;
  return unwrapRow(data);
}

export async function operatorCreatePairing(
  eventId,
  secret,
  participantAId,
  participantBId
) {
  const supabase = await withOperatorAuth();
  const { data, error } = await supabase.rpc(
    "event_v0_operator_create_pairing",
    opArgs(eventId, secret, {
      p_participant_a_id: participantAId,
      p_participant_b_id: participantBId,
    })
  );
  if (error) throw error;
  return mapPairing(unwrapRow(data));
}

export async function operatorChangeOpponent(
  eventId,
  secret,
  pairingId,
  replacedParticipantId,
  newParticipantId
) {
  const supabase = await withOperatorAuth();
  const { data, error } = await supabase.rpc(
    "event_v0_operator_change_pairing_opponent",
    opArgs(eventId, secret, {
      p_pairing_id: pairingId,
      p_replaced_participant_id: replacedParticipantId,
      p_new_participant_id: newParticipantId,
    })
  );
  if (error) throw error;
  return mapPairing(unwrapRow(data));
}

export async function operatorChangeOrder(
  eventId,
  secret,
  pairingId,
  newOrderNumber
) {
  const supabase = await withOperatorAuth();
  const { data, error } = await supabase.rpc(
    "event_v0_operator_change_pairing_order",
    opArgs(eventId, secret, {
      p_pairing_id: pairingId,
      p_new_order_number: Number(newOrderNumber),
    })
  );
  if (error) throw error;
  return mapPairing(unwrapRow(data));
}

export async function operatorCancelPairing(eventId, secret, pairingId) {
  const supabase = await withOperatorAuth();
  const { data, error } = await supabase.rpc(
    "event_v0_operator_cancel_pairing",
    opArgs(eventId, secret, { p_pairing_id: pairingId })
  );
  if (error) throw error;
  return mapPairing(unwrapRow(data));
}

export async function operatorCompletePairing(eventId, secret, pairingId) {
  const supabase = await withOperatorAuth();
  const { data, error } = await supabase.rpc(
    "event_v0_operator_complete_pairing",
    opArgs(eventId, secret, { p_pairing_id: pairingId })
  );
  if (error) throw error;
  return mapPairing(unwrapRow(data));
}
