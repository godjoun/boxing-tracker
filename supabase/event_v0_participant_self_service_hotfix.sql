-- EVENT v0 — participant self-service (update profile / cancel waiting)
-- Supabase SQL Editor에서 이 파일만 Run.
--
-- 테이블/데이터 DELETE·TRUNCATE 없음.
-- pairing / order_number / operator RPC 변경 없음.
-- SECURITY DEFINER + auth.uid() 본인 row만 수정/취소.

-- ---------------------------------------------------------------------------
-- 1) Update own participant profile (no active pairing)
-- ---------------------------------------------------------------------------

create or replace function public.event_v0_update_my_participant(
  p_event_id text,
  p_display_name text,
  p_gym_name text,
  p_weight_kg numeric,
  p_experience text
)
returns public.event_participants
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := public.event_v0_require_auth();
  v_event_id text := trim(p_event_id);
  v_name text := trim(p_display_name);
  v_gym text := trim(p_gym_name);
  v_exp text := coalesce(trim(p_experience), '');
  v_row public.event_participants;
begin
  perform public.event_v0_lock_event(v_event_id);

  if v_name is null or char_length(v_name) < 1 or char_length(v_name) > 40 then
    raise exception 'invalid display_name' using errcode = '22023';
  end if;

  if v_gym is null or char_length(v_gym) < 1 or char_length(v_gym) > 80 then
    raise exception 'invalid gym_name' using errcode = '22023';
  end if;

  if p_weight_kg is null or p_weight_kg < 35 or p_weight_kg > 200 then
    raise exception 'invalid weight_kg' using errcode = '22023';
  end if;

  if v_exp is null or char_length(v_exp) < 1 or char_length(v_exp) > 40 then
    raise exception 'invalid experience' using errcode = '22023';
  end if;

  select *
    into v_row
  from public.event_participants
  where event_id = v_event_id
    and user_id = v_uid
  for update;

  if not found then
    raise exception 'participant not registered' using errcode = 'P0002';
  end if;

  if v_row.attendance_status <> 'active' then
    raise exception 'participant is not active' using errcode = '42501';
  end if;

  -- Own row only via user_id = auth.uid(); no client participant_id.
  perform public.event_v0_assert_not_in_active_pairing(v_event_id, v_row.id);

  update public.event_participants
  set
    display_name = v_name,
    gym_name = v_gym,
    weight_kg = p_weight_kg,
    experience = v_exp
  where id = v_row.id
    and user_id = v_uid
  returning * into v_row;

  return v_row;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2) Cancel own waiting sparring request (not assigned / not paired)
-- ---------------------------------------------------------------------------

create or replace function public.event_v0_cancel_my_sparring_request(
  p_event_id text
)
returns public.sparring_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := public.event_v0_require_auth();
  v_event_id text := trim(p_event_id);
  v_participant public.event_participants;
  v_row public.sparring_requests;
begin
  perform public.event_v0_lock_event(v_event_id);

  select *
    into v_participant
  from public.event_participants
  where event_id = v_event_id
    and user_id = v_uid
  for update;

  if not found then
    raise exception 'participant not registered' using errcode = 'P0002';
  end if;

  perform public.event_v0_assert_not_in_active_pairing(
    v_event_id,
    v_participant.id
  );

  select *
    into v_row
  from public.sparring_requests
  where event_id = v_event_id
    and participant_id = v_participant.id
    and status = 'waiting'
  order by created_at asc
  limit 1
  for update;

  if not found then
    raise exception 'waiting sparring request not found' using errcode = 'P0002';
  end if;

  update public.sparring_requests
  set status = 'cancelled'
  where id = v_row.id
    and participant_id = v_participant.id
    and status = 'waiting'
  returning * into v_row;

  if not found then
    raise exception 'waiting sparring request not found' using errcode = 'P0002';
  end if;

  return v_row;
end;
$$;

revoke all on function public.event_v0_update_my_participant(text, text, text, numeric, text)
  from public, anon;
revoke all on function public.event_v0_cancel_my_sparring_request(text)
  from public, anon;

grant execute on function public.event_v0_update_my_participant(text, text, text, numeric, text)
  to authenticated;
grant execute on function public.event_v0_cancel_my_sparring_request(text)
  to authenticated;
