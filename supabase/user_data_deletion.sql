-- PUNCH ERA — production user data deletion runbook
--
-- MANUAL OPERATOR SQL. Do not run as a migration, from the browser, or as part
-- of deployment. Run PART 1 first, record the review, then use PART 2 only
-- with an exact auth.users.id and explicit confirmation.
--
-- Scope:
--   event_participants, sparring_requests, optional fighter_nicknames.
--   pairings and pairing_history are never deleted by this script.
--   product_funnel_events has no user identifier and is intentionally excluded.
--   auth.users deletion is intentionally excluded; see docs/privacy-data-deletion.md.
--
-- If a statement in PART 2 errors, run ROLLBACK before investigating.

-- ============================================================================
-- PART 1 — DRY RUN ONLY
-- Replace the UUID in target, then inspect every result before PART 2.
-- This section performs SELECTs only. actor_ref is deliberately not inspected
-- or used as a user identity signal.
-- ============================================================================

-- 1a. Direct EVENT participant rows for the exact Auth user.
with target as (
  select '00000000-0000-0000-0000-000000000000'::uuid as user_id
)
select
  ep.id as participant_id,
  ep.event_id,
  ep.user_id,
  ep.display_name,
  ep.gym_name,
  ep.weight_kg,
  ep.experience,
  ep.attendance_status,
  ep.created_at,
  ep.updated_at
from public.event_participants ep
join target t on t.user_id = ep.user_id
order by ep.event_id, ep.created_at;

-- 1b. Target requests and every pairing that includes a target participant.
with target as (
  select '00000000-0000-0000-0000-000000000000'::uuid as user_id
), participants as (
  select ep.id
  from public.event_participants ep
  join target t on t.user_id = ep.user_id
)
select
  'sparring_request'::text as record_type,
  sr.id as record_id,
  sr.event_id,
  sr.status,
  sr.participant_id as target_participant_id,
  null::uuid as participant_a_id,
  null::uuid as participant_b_id,
  sr.created_at
from public.sparring_requests sr
join participants p on p.id = sr.participant_id
union all
select
  'pairing'::text as record_type,
  pr.id as record_id,
  pr.event_id,
  pr.status,
  null::uuid as target_participant_id,
  pr.participant_a_id,
  pr.participant_b_id,
  pr.created_at
from public.pairings pr
where pr.participant_a_id in (select id from participants)
   or pr.participant_b_id in (select id from participants)
order by event_id, record_type, created_at;

-- 1c. pairing_history payload references to the target's participant/request
-- UUIDs. These payload references are expected to remain when a shared pairing
-- is preserved, but must be reviewed before confirming PART 2.
with target as (
  select '00000000-0000-0000-0000-000000000000'::uuid as user_id
), participants as (
  select ep.id
  from public.event_participants ep
  join target t on t.user_id = ep.user_id
), requests as (
  select sr.id
  from public.sparring_requests sr
  where sr.participant_id in (select id from participants)
), identifiers as (
  select id::text as uuid_value, 'participant'::text as identifier_type
  from participants
  union all
  select id::text as uuid_value, 'sparring_request'::text as identifier_type
  from requests
)
select
  ph.id as history_id,
  ph.event_id,
  ph.pairing_id,
  ph.action,
  identifier_type,
  payload_field.key as payload_field,
  payload_field.value as referenced_uuid,
  ph.created_at
from public.pairing_history ph
cross join lateral jsonb_each_text(coalesce(ph.payload, '{}'::jsonb)) as payload_field(key, value)
join identifiers on identifiers.uuid_value = payload_field.value
where payload_field.key = any (array[
  'participant_a_id',
  'participant_b_id',
  'replaced_participant_id',
  'new_participant_id',
  'kept_participant_id',
  'sparring_request_a_id',
  'sparring_request_b_id',
  'old_sparring_request_id',
  'new_sparring_request_id'
]::text[])
order by ph.event_id, ph.created_at, ph.id;

-- 1d. Check whether the optional nickname table exists. If it does, run the
-- following SELECT with the same target UUID and include its row in the review.
select to_regclass('public.fighter_nicknames') as fighter_nicknames_table;

-- with target as (
--   select '00000000-0000-0000-0000-000000000000'::uuid as user_id
-- )
-- select user_id, nickname, created_at
-- from public.fighter_nicknames
-- where user_id = (select user_id from target);

-- ============================================================================
-- PART 2 — MANUAL ACTION
-- Replace v_target_user_id. Leave both confirmations false until PART 1 has
-- been reviewed and the request ticket has been recorded outside this database.
-- ============================================================================

begin;

do $$
declare
  v_target_user_id uuid := '00000000-0000-0000-0000-000000000000';
  v_request_ticket text := '';
  v_confirm_delete boolean := false;
  v_confirm_payload_reviewed boolean := false;
  v_pairing_count integer := 0;
  v_history_payload_reference_count integer := 0;
  v_deleted_request_count integer := 0;
  v_deleted_participant_count integer := 0;
  v_anonymized_participant_count integer := 0;
  v_deleted_nickname_count integer := 0;
begin
  if v_target_user_id = '00000000-0000-0000-0000-000000000000'::uuid then
    raise exception 'Set v_target_user_id to the exact auth.users.id from the reviewed dry-run.';
  end if;

  if coalesce(trim(v_request_ticket), '') = '' then
    raise exception 'Set a non-empty external deletion request ticket reference.';
  end if;

  if not v_confirm_delete then
    raise notice 'No action: set v_confirm_delete := true only after reviewing PART 1.';
    return;
  end if;

  -- Serializes duplicate deletion attempts for the same exact Auth user.
  perform pg_advisory_xact_lock(
    hashtext('punch-era-user-data-deletion:' || v_target_user_id::text)
  );

  -- Lock target participant rows, then calculate the live shared-pairing state.
  perform 1
  from public.event_participants ep
  where ep.user_id = v_target_user_id
  for update;

  select count(*)
    into v_pairing_count
  from public.pairings pr
  where pr.participant_a_id in (
          select id from public.event_participants where user_id = v_target_user_id
        )
     or pr.participant_b_id in (
          select id from public.event_participants where user_id = v_target_user_id
        );

  select count(distinct ph.id)
    into v_history_payload_reference_count
  from public.pairing_history ph
  cross join lateral jsonb_each_text(coalesce(ph.payload, '{}'::jsonb)) as payload_field(key, value)
  where payload_field.key = any (array[
    'participant_a_id',
    'participant_b_id',
    'replaced_participant_id',
    'new_participant_id',
    'kept_participant_id',
    'sparring_request_a_id',
    'sparring_request_b_id',
    'old_sparring_request_id',
    'new_sparring_request_id'
  ]::text[])
    and payload_field.value in (
      select id::text
      from public.event_participants
      where user_id = v_target_user_id
      union
      select sr.id::text
      from public.sparring_requests sr
      join public.event_participants ep on ep.id = sr.participant_id
      where ep.user_id = v_target_user_id
    );

  if v_pairing_count > 0 and not v_confirm_payload_reviewed then
    raise exception
      'Shared pairing detected (% pairings, % history payload rows). Review PART 1 and set v_confirm_payload_reviewed := true before proceeding.',
      v_pairing_count,
      v_history_payload_reference_count;
  end if;

  -- Target requests only. Pairing request FKs use ON DELETE SET NULL.
  delete from public.sparring_requests sr
  using public.event_participants ep
  where sr.participant_id = ep.id
    and ep.user_id = v_target_user_id;
  get diagnostics v_deleted_request_count = row_count;

  -- Optional table: do not fail if the planned nickname feature was never run.
  if to_regclass('public.fighter_nicknames') is not null then
    execute 'delete from public.fighter_nicknames where user_id = $1'
      using v_target_user_id;
    get diagnostics v_deleted_nickname_count = row_count;
  end if;

  if v_pairing_count = 0 then
    -- No shared pairing/history dependency: remove target participant rows.
    delete from public.event_participants
    where user_id = v_target_user_id;
    get diagnostics v_deleted_participant_count = row_count;
  else
    -- Preserve the other participant's shared pairing/history while removing
    -- every direct identifier and the Auth-user link from the target row.
    update public.event_participants
    set
      user_id = null,
      display_name = '삭제된 참가자',
      gym_name = '삭제됨',
      weight_kg = null,
      experience = '',
      attendance_status = 'left'
    where user_id = v_target_user_id;
    get diagnostics v_anonymized_participant_count = row_count;
  end if;

  raise notice
    'Completed request %, requests deleted %, nicknames deleted %, participants deleted %, participants anonymized %, shared pairings %, history payload rows reviewed %.',
    v_request_ticket,
    v_deleted_request_count,
    v_deleted_nickname_count,
    v_deleted_participant_count,
    v_anonymized_participant_count,
    v_pairing_count,
    v_history_payload_reference_count;
end;
$$;

commit;

-- ============================================================================
-- PART 3 — POST-ACTION VERIFICATION
-- Re-run with the exact same target UUID. The first query must return zero rows.
-- In a shared-pairing case, PART 1c UUID references may remain by design, but
-- they should no longer join to a direct identifier or auth.users link.
-- ============================================================================

with target as (
  select '00000000-0000-0000-0000-000000000000'::uuid as user_id
)
select ep.*
from public.event_participants ep
join target t on t.user_id = ep.user_id;

-- Auth account deletion is a separate Dashboard/service-role action. Do not
-- delete auth.users directly in this file.
