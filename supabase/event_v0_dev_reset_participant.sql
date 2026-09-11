-- EVENT v0 DEV — reset ONE self-registered participant on event-v0-dev
-- Supabase SQL Editor · service role only.
--
-- 목적: 내 Anonymous Auth user_id 기준 테스트 데이터를 지워
--       event-v0-dev 에서 "처음 참가" 상태로 다시 QR 테스트.
--
-- ⚠️ production / 다른 event_id / 다른 참가자 row 삭제 금지.
-- ⚠️ 이 파일을 Run 하기 전에 PART 1 (PREVIEW)만 먼저 실행해 확인할 것.
--
-- FK 관계 (삭제 순서):
--   pairing_history → pairings (RESTRICT)
--   pairings → event_participants A/B (RESTRICT)
--   sparring_requests → event_participants (CASCADE, participant 삭제 시)
--
-- 따라서 participant 삭제 전에:
--   1) 해당 participant 가 포함된 pairings 의 pairing_history 삭제
--   2) 해당 pairings 삭제 (상대 participant row 는 유지)
--   3) target participant 의 sparring_requests 삭제
--   4) target event_participants 삭제
--
-- 상대와 pairing 이 있으면 pairing row 삭제가 필요합니다.
-- v_allow_shared_pairing_removal = false 이면 상대가 있는 pairing 이 있을 때 중단합니다.

-- ============================================================================
-- 설정 — Run 전에 본인 auth.users.id 로 바꿀 것
-- ============================================================================

-- PREVIEW: 아래 uuid 를 본인 것으로 바꾼 뒤 PART 1 만 실행
-- DELETE:  PART 2 실행 전 v_confirm_delete := true 로 바꿀 것

do $$
declare
  v_event_id text := 'event-v0-dev';
  v_target_user_id uuid := '69ba523f-004f-4801-9ff3-9aed7137ef20'; -- ← 본인 user_id
  v_confirm_delete boolean := false;
  v_allow_shared_pairing_removal boolean := false;

  v_participant_id uuid;
  v_pairing_count integer;
  v_shared_pairing_count integer;
  v_history_count integer;
  v_request_count integer;
begin
  raise notice '=== EVENT v0 DEV participant reset (PREVIEW) ===';
  raise notice 'event_id: %', v_event_id;
  raise notice 'target user_id: %', v_target_user_id;

  if v_event_id <> 'event-v0-dev' then
    raise exception 'refusing: event_id must be event-v0-dev only';
  end if;

  if v_target_user_id = '00000000-0000-0000-0000-000000000000'::uuid then
    raise exception 'set v_target_user_id to your auth.users.id before running';
  end if;

  select ep.id
    into v_participant_id
  from public.event_participants ep
  where ep.event_id = v_event_id
    and ep.user_id = v_target_user_id;

  if v_participant_id is null then
    raise notice 'No participant row for this user on event-v0-dev. Nothing to delete.';
    return;
  end if;

  raise notice 'participant_id: %', v_participant_id;

  select count(*)
    into v_request_count
  from public.sparring_requests sr
  where sr.event_id = v_event_id
    and sr.participant_id = v_participant_id;

  select count(*)
    into v_pairing_count
  from public.pairings p
  where p.event_id = v_event_id
    and v_participant_id in (p.participant_a_id, p.participant_b_id);

  select count(*)
    into v_shared_pairing_count
  from public.pairings p
  where p.event_id = v_event_id
    and v_participant_id in (p.participant_a_id, p.participant_b_id)
    and not (
      p.participant_a_id = v_participant_id
      and p.participant_b_id = v_participant_id
    );

  select count(*)
    into v_history_count
  from public.pairing_history ph
  where ph.event_id = v_event_id
    and ph.pairing_id in (
      select p.id
      from public.pairings p
      where p.event_id = v_event_id
        and v_participant_id in (p.participant_a_id, p.participant_b_id)
    );

  raise notice '--- counts to delete (target participant only unless noted) ---';
  raise notice 'sparring_requests (target): %', v_request_count;
  raise notice 'pairings involving target: % (shared with another participant: %)',
    v_pairing_count, v_shared_pairing_count;
  raise notice 'pairing_history rows on those pairings: %', v_history_count;
  raise notice 'event_participants row: 1';

  if not v_confirm_delete then
    raise notice 'PREVIEW only. To delete, set v_confirm_delete := true and re-run this DO block.';
    return;
  end if;

  if v_shared_pairing_count > 0 and not v_allow_shared_pairing_removal then
    raise exception
      'blocked: % pairing(s) include another participant. Set v_allow_shared_pairing_removal := true to remove those pairing rows (opponent participant row is kept; their pairing record is removed).',
      v_shared_pairing_count;
  end if;

  raise notice '=== DELETE starting (transaction) ===';

  -- Re-resolve participant
  select ep.id into v_participant_id
  from public.event_participants ep
  where ep.event_id = v_event_id
    and ep.user_id = v_target_user_id;

  if v_participant_id is null then
    raise notice 'participant already gone.';
    return;
  end if;

  -- Opponent assigned requests → waiting when removing shared pairings
  if v_allow_shared_pairing_removal and v_shared_pairing_count > 0 then
    update public.sparring_requests sr
    set status = 'waiting'
    where sr.event_id = v_event_id
      and sr.status = 'assigned'
      and sr.participant_id <> v_participant_id
      and exists (
        select 1
        from public.pairings p
        where p.event_id = v_event_id
          and v_participant_id in (p.participant_a_id, p.participant_b_id)
          and sr.id in (p.sparring_request_a_id, p.sparring_request_b_id)
      );
    raise notice 'reset opponent assigned sparring_requests → waiting (pairing removal only)';
  end if;

  -- 1) pairing_history for pairings involving target
  delete from public.pairing_history ph
  where ph.event_id = v_event_id
    and ph.pairing_id in (
      select p.id
      from public.pairings p
      where p.event_id = v_event_id
        and v_participant_id in (p.participant_a_id, p.participant_b_id)
    );

  get diagnostics v_history_count = row_count;
  raise notice 'deleted pairing_history: %', v_history_count;

  -- 2) pairings involving target (RESTRICT blocks participant delete until gone)
  delete from public.pairings p
  where p.event_id = v_event_id
    and v_participant_id in (p.participant_a_id, p.participant_b_id);

  get diagnostics v_pairing_count = row_count;
  raise notice 'deleted pairings: %', v_pairing_count;

  -- 3) target sparring_requests (explicit; also cascades on participant delete)
  delete from public.sparring_requests sr
  where sr.event_id = v_event_id
    and sr.participant_id = v_participant_id;

  get diagnostics v_request_count = row_count;
  raise notice 'deleted sparring_requests: %', v_request_count;

  -- 4) target participant only (user_id + event_id guard)
  delete from public.event_participants ep
  where ep.id = v_participant_id
    and ep.event_id = v_event_id
    and ep.user_id = v_target_user_id;

  get diagnostics v_request_count = row_count;
  if v_request_count <> 1 then
    raise exception 'participant delete failed — expected 1 row, got %', v_request_count;
  end if;

  raise notice 'deleted event_participants: 1';
  raise notice '=== DONE — re-open ?event=event-v0-dev to register fresh ===';
end;
$$;

-- ============================================================================
-- PART 1 — PREVIEW only (read-only SELECT). 위 DO 블록 대신 이것만 Run 해도 됨.
-- :target_user_id 를 SQL Editor에서 치환하거나 아래 uuid 수정.
-- ============================================================================

-- \set target_user_id 'YOUR-UUID-HERE'

select
  ep.id as participant_id,
  ep.user_id,
  ep.display_name,
  ep.gym_name,
  ep.attendance_status,
  ep.created_at
from public.event_participants ep
where ep.event_id = 'event-v0-dev'
  and ep.user_id = '00000000-0000-0000-0000-000000000000'::uuid; -- ← 본인 user_id

select
  sr.id as request_id,
  sr.status,
  sr.created_at
from public.sparring_requests sr
join public.event_participants ep on ep.id = sr.participant_id
where sr.event_id = 'event-v0-dev'
  and ep.user_id = '00000000-0000-0000-0000-000000000000'::uuid;

select
  p.id as pairing_id,
  p.order_number,
  p.status as pairing_status,
  pa.display_name as participant_a,
  pb.display_name as participant_b,
  case
    when ep.id = p.participant_a_id then pb.display_name
    else pa.display_name
  end as opponent_name,
  case
    when ep.id = p.participant_a_id then pb.id
    else pa.id
  end as opponent_participant_id
from public.pairings p
join public.event_participants ep
  on ep.event_id = p.event_id
 and ep.user_id = '00000000-0000-0000-0000-000000000000'::uuid
 and ep.id in (p.participant_a_id, p.participant_b_id)
join public.event_participants pa on pa.id = p.participant_a_id
join public.event_participants pb on pb.id = p.participant_b_id
where p.event_id = 'event-v0-dev'
order by p.order_number;

select
  ph.id as history_id,
  ph.pairing_id,
  ph.action,
  ph.created_at
from public.pairing_history ph
where ph.event_id = 'event-v0-dev'
  and ph.pairing_id in (
    select p.id
    from public.pairings p
    join public.event_participants ep
      on ep.event_id = p.event_id
     and ep.user_id = '00000000-0000-0000-0000-000000000000'::uuid
     and ep.id in (p.participant_a_id, p.participant_b_id)
    where p.event_id = 'event-v0-dev'
  )
order by ph.created_at;

-- ============================================================================
-- PART 2 — DELETE
-- 위 DO $$ ... $$ 블록에서:
--   v_target_user_id := '<본인 uuid>';
--   v_confirm_delete := true;
-- 상대와 pairing 이 있었으면 추가로:
--   v_allow_shared_pairing_removal := true;
-- 그다음 DO 블록 전체 Run (service role).
-- ============================================================================
