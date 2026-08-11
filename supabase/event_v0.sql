-- EVENT v0 — 현장 교류 대진 (2026-09 검증용)
-- Supabase SQL Editor에서 이 파일만 Run.
--
-- 기존 dojo_gym_exchange_participations / dojo_exchange_* / dojo_sparring_* 와 무관.
-- 덮어쓰지 않음. Anonymous Auth ON 권장 (참가자 auth.uid() 식별).
--
-- 운영자 비밀키: 원문·URL query 저장 금지. events.operator_secret_hash 만 보관.
-- 해시 설정 (SQL Editor · service role):
--   select public.event_v0_set_operator_secret_hash('your-event-slug', 'your-secret');
--
-- DEV/QA 행사 seed (production 정보 없음): supabase/event_v0_dev_fixture.sql

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.events (
  id text primary key,
  title text not null default '',
  gym_a text not null default '',
  gym_b text not null default '',
  event_date date,
  location text not null default '',
  status text not null default 'draft',
  operator_secret_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_id_len check (char_length(trim(id)) between 1 and 120),
  constraint events_title_len check (char_length(title) <= 120),
  constraint events_gym_a_len check (char_length(gym_a) <= 80),
  constraint events_gym_b_len check (char_length(gym_b) <= 80),
  constraint events_location_len check (char_length(location) <= 120),
  constraint events_status_valid check (
    status in ('draft', 'upcoming', 'active', 'ended')
  )
);

create table if not exists public.event_participants (
  id uuid primary key default gen_random_uuid(),
  event_id text not null references public.events (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  display_name text not null,
  gym_name text not null,
  weight_kg numeric(5, 1),
  experience text not null default '',
  attendance_status text not null default 'active',
  created_by text not null default 'self',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_participants_display_name_len
    check (char_length(trim(display_name)) between 1 and 40),
  constraint event_participants_gym_name_len
    check (char_length(trim(gym_name)) between 1 and 80),
  constraint event_participants_experience_len
    check (char_length(experience) <= 40),
  constraint event_participants_weight_kg_range check (
    weight_kg is null or (weight_kg >= 35 and weight_kg <= 200)
  ),
  constraint event_participants_attendance_valid check (
    attendance_status in ('active', 'left', 'no_show')
  ),
  constraint event_participants_created_by_valid check (
    created_by in ('self', 'operator')
  )
);

-- Self-register via auth.uid(): one person row per event.
create unique index if not exists event_participants_event_user_unique
  on public.event_participants (event_id, user_id)
  where user_id is not null;

create index if not exists event_participants_event_id_idx
  on public.event_participants (event_id);

create index if not exists event_participants_user_id_idx
  on public.event_participants (user_id)
  where user_id is not null;

create table if not exists public.sparring_requests (
  id uuid primary key default gen_random_uuid(),
  event_id text not null references public.events (id) on delete cascade,
  participant_id uuid not null references public.event_participants (id) on delete cascade,
  status text not null default 'waiting',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sparring_requests_status_valid check (
    status in ('waiting', 'assigned', 'completed', 'cancelled')
  )
);

-- One open queue slot per participant (waiting or assigned to active pairing).
create unique index if not exists sparring_requests_one_open_per_participant
  on public.sparring_requests (participant_id)
  where status in ('waiting', 'assigned');

create index if not exists sparring_requests_event_status_idx
  on public.sparring_requests (event_id, status, created_at);

create index if not exists sparring_requests_participant_idx
  on public.sparring_requests (participant_id, created_at desc);

create table if not exists public.pairings (
  id uuid primary key default gen_random_uuid(),
  event_id text not null references public.events (id) on delete cascade,
  participant_a_id uuid not null references public.event_participants (id) on delete restrict,
  participant_b_id uuid not null references public.event_participants (id) on delete restrict,
  sparring_request_a_id uuid references public.sparring_requests (id) on delete set null,
  sparring_request_b_id uuid references public.sparring_requests (id) on delete set null,
  order_number integer not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint pairings_distinct_participants check (
    participant_a_id <> participant_b_id
  ),
  constraint pairings_order_positive check (order_number >= 1),
  constraint pairings_status_valid check (
    status in ('active', 'completed', 'cancelled')
  )
);

-- Order numbers are never reused within an event (all statuses).
create unique index if not exists pairings_event_order_unique
  on public.pairings (event_id, order_number);

create index if not exists pairings_event_status_order_idx
  on public.pairings (event_id, status, order_number);

create table if not exists public.pairing_history (
  id uuid primary key default gen_random_uuid(),
  pairing_id uuid not null references public.pairings (id) on delete restrict,
  event_id text not null references public.events (id) on delete restrict,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  actor_type text not null default 'operator',
  actor_ref text,
  created_at timestamptz not null default now(),
  constraint pairing_history_action_valid check (
    action in (
      'pairing_created',
      'opponent_changed',
      'order_changed',
      'cancelled',
      'completed'
    )
  ),
  constraint pairing_history_actor_type_valid check (
    actor_type in ('operator', 'participant', 'system')
  )
);

create index if not exists pairing_history_pairing_created_idx
  on public.pairing_history (pairing_id, created_at);

create index if not exists pairing_history_event_created_idx
  on public.pairing_history (event_id, created_at);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

create or replace function public.event_v0_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists events_touch_updated_at on public.events;
create trigger events_touch_updated_at
  before update on public.events
  for each row execute function public.event_v0_touch_updated_at();

drop trigger if exists event_participants_touch_updated_at on public.event_participants;
create trigger event_participants_touch_updated_at
  before update on public.event_participants
  for each row execute function public.event_v0_touch_updated_at();

drop trigger if exists sparring_requests_touch_updated_at on public.sparring_requests;
create trigger sparring_requests_touch_updated_at
  before update on public.sparring_requests
  for each row execute function public.event_v0_touch_updated_at();

drop trigger if exists pairings_touch_updated_at on public.pairings;
create trigger pairings_touch_updated_at
  before update on public.pairings
  for each row execute function public.event_v0_touch_updated_at();

-- pairing_history: append-only (no updated_at, no UPDATE/DELETE policies)

-- ---------------------------------------------------------------------------
-- Internal helpers (not granted to clients)
-- ---------------------------------------------------------------------------

create or replace function public.event_v0_require_auth()
returns uuid
language plpgsql
stable
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  return v_uid;
end;
$$;

create or replace function public.event_v0_assert_event_joinable(p_event_id text)
returns public.events
language plpgsql
stable
set search_path = public
as $$
declare
  v_event public.events;
begin
  select *
    into v_event
  from public.events
  where id = trim(p_event_id);

  if not found then
    raise exception 'event not found' using errcode = 'P0002';
  end if;

  if v_event.status not in ('upcoming', 'active') then
    raise exception 'event is not open for participation' using errcode = '42501';
  end if;

  return v_event;
end;
$$;

create or replace function public.event_v0_verify_operator_secret(
  p_event_id text,
  p_operator_secret text
)
returns public.events
language plpgsql
stable
set search_path = public
as $$
declare
  v_event public.events;
  v_secret text := coalesce(p_operator_secret, '');
begin
  select *
    into v_event
  from public.events
  where id = trim(p_event_id);

  if not found then
    raise exception 'event not found' using errcode = 'P0002';
  end if;

  if v_event.operator_secret_hash is null
     or char_length(trim(v_event.operator_secret_hash)) = 0 then
    raise exception 'operator secret is not configured' using errcode = '42501';
  end if;

  if char_length(trim(v_secret)) = 0 then
    raise exception 'invalid operator secret' using errcode = '42501';
  end if;

  if extensions.crypt(v_secret, v_event.operator_secret_hash) <> v_event.operator_secret_hash then
    raise exception 'invalid operator secret' using errcode = '42501';
  end if;

  return v_event;
end;
$$;

-- Serialize all mutations for one event within the current transaction.
-- pg_advisory_xact_lock auto-releases at COMMIT/ROLLBACK.
create or replace function public.event_v0_lock_event(p_event_id text)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_event_id text := trim(p_event_id);
begin
  if v_event_id is null or char_length(v_event_id) < 1 then
    raise exception 'invalid event_id' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtext('event_v0:' || v_event_id));
end;
$$;

create or replace function public.event_v0_get_participant_for_user(
  p_event_id text,
  p_user_id uuid
)
returns public.event_participants
language sql
stable
set search_path = public
as $$
  select *
  from public.event_participants
  where event_id = trim(p_event_id)
    and user_id = p_user_id
  limit 1;
$$;

create or replace function public.event_v0_next_order_number(p_event_id text)
returns integer
language sql
volatile
set search_path = public
as $$
  select coalesce(max(order_number), 0) + 1
  from public.pairings
  where event_id = trim(p_event_id);
$$;

create or replace function public.event_v0_append_pairing_history(
  p_pairing_id uuid,
  p_event_id text,
  p_action text,
  p_payload jsonb,
  p_actor_type text default 'operator',
  p_actor_ref text default null
)
returns public.pairing_history
language plpgsql
set search_path = public
as $$
declare
  v_row public.pairing_history;
begin
  insert into public.pairing_history (
    pairing_id,
    event_id,
    action,
    payload,
    actor_type,
    actor_ref
  )
  values (
    p_pairing_id,
    trim(p_event_id),
    p_action,
    coalesce(p_payload, '{}'::jsonb),
    coalesce(p_actor_type, 'operator'),
    p_actor_ref
  )
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.event_v0_pick_waiting_request(
  p_event_id text,
  p_participant_id uuid
)
returns public.sparring_requests
language plpgsql
set search_path = public
as $$
declare
  v_row public.sparring_requests;
begin
  select *
    into v_row
  from public.sparring_requests
  where event_id = trim(p_event_id)
    and participant_id = p_participant_id
    and status = 'waiting'
  order by created_at asc
  limit 1
  for update;

  if not found then
    raise exception 'participant has no waiting sparring request' using errcode = 'P0002';
  end if;

  return v_row;
end;
$$;

create or replace function public.event_v0_assert_participant_active(
  p_participant_id uuid,
  p_event_id text
)
returns public.event_participants
language plpgsql
set search_path = public
as $$
declare
  v_row public.event_participants;
begin
  select *
    into v_row
  from public.event_participants
  where id = p_participant_id
    and event_id = trim(p_event_id)
  for update;

  if not found then
    raise exception 'participant not found' using errcode = 'P0002';
  end if;

  if v_row.attendance_status <> 'active' then
    raise exception 'participant is not active' using errcode = '42501';
  end if;

  return v_row;
end;
$$;

create or replace function public.event_v0_assert_not_in_active_pairing(
  p_event_id text,
  p_participant_id uuid
)
returns void
language plpgsql
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.pairings p
    where p.event_id = trim(p_event_id)
      and p.status = 'active'
      and (
        p.participant_a_id = p_participant_id
        or p.participant_b_id = p_participant_id
      )
    for update
  ) then
    raise exception 'participant is already in an active pairing' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.event_v0_assert_waiting_request_belongs(
  p_request public.sparring_requests,
  p_event_id text,
  p_participant_id uuid
)
returns void
language plpgsql
stable
set search_path = public
as $$
begin
  if p_request.id is null then
    raise exception 'sparring request not found' using errcode = 'P0002';
  end if;

  if p_request.event_id <> trim(p_event_id) then
    raise exception 'sparring request belongs to a different event' using errcode = '42501';
  end if;

  if p_request.participant_id <> p_participant_id then
    raise exception 'sparring request belongs to a different participant' using errcode = '42501';
  end if;

  if p_request.status <> 'waiting' then
    raise exception 'sparring request is not waiting' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.event_v0_assert_active_pairing(
  p_pairing_id uuid,
  p_event_id text
)
returns public.pairings
language plpgsql
set search_path = public
as $$
declare
  v_row public.pairings;
begin
  select *
    into v_row
  from public.pairings
  where id = p_pairing_id
    and event_id = trim(p_event_id)
  for update;

  if not found then
    raise exception 'pairing not found' using errcode = 'P0002';
  end if;

  if v_row.status <> 'active' then
    raise exception 'pairing is not active' using errcode = '42501';
  end if;

  return v_row;
end;
$$;

-- ---------------------------------------------------------------------------
-- Public read (no secret)
-- ---------------------------------------------------------------------------

create or replace function public.event_v0_get_public_event(p_event_id text)
returns table (
  id text,
  title text,
  gym_a text,
  gym_b text,
  event_date date,
  location text,
  status text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.id,
    e.title,
    e.gym_a,
    e.gym_b,
    e.event_date,
    e.location,
    e.status
  from public.events e
  where e.id = trim(p_event_id)
    and e.status in ('upcoming', 'active', 'ended');
$$;

-- ---------------------------------------------------------------------------
-- Participant RPCs (auth.uid() ownership)
-- ---------------------------------------------------------------------------

create or replace function public.event_v0_register_participant(
  p_event_id text,
  p_display_name text,
  p_gym_name text,
  p_weight_kg numeric default null,
  p_experience text default ''
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
  perform public.event_v0_assert_event_joinable(v_event_id);

  if v_name is null or char_length(v_name) < 1 or char_length(v_name) > 40 then
    raise exception 'invalid display_name' using errcode = '22023';
  end if;

  if v_gym is null or char_length(v_gym) < 1 or char_length(v_gym) > 80 then
    raise exception 'invalid gym_name' using errcode = '22023';
  end if;

  if p_weight_kg is not null
     and (p_weight_kg < 35 or p_weight_kg > 200) then
    raise exception 'invalid weight_kg' using errcode = '22023';
  end if;

  if char_length(v_exp) > 40 then
    raise exception 'invalid experience' using errcode = '22023';
  end if;

  select *
    into v_row
  from public.event_participants
  where event_id = v_event_id
    and user_id = v_uid;

  if found then
    return v_row;
  end if;

  insert into public.event_participants (
    event_id,
    user_id,
    display_name,
    gym_name,
    weight_kg,
    experience,
    attendance_status,
    created_by
  )
  values (
    v_event_id,
    v_uid,
    v_name,
    v_gym,
    p_weight_kg,
    v_exp,
    'active',
    'self'
  )
  returning * into v_row;

  return v_row;
exception
  when unique_violation then
    select *
      into v_row
    from public.event_participants
    where event_id = v_event_id
      and user_id = v_uid;
    return v_row;
end;
$$;

create or replace function public.event_v0_create_sparring_request(p_event_id text)
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
  perform public.event_v0_assert_event_joinable(v_event_id);

  select *
    into v_participant
  from public.event_participants
  where event_id = v_event_id
    and user_id = v_uid
  for update;

  if not found then
    raise exception 'participant not registered' using errcode = 'P0002';
  end if;

  if v_participant.attendance_status <> 'active' then
    raise exception 'participant is not active' using errcode = '42501';
  end if;

  if v_participant.event_id <> v_event_id then
    raise exception 'participant belongs to a different event' using errcode = '42501';
  end if;

  perform public.event_v0_assert_not_in_active_pairing(v_event_id, v_participant.id);

  if exists (
    select 1
    from public.sparring_requests sr
    where sr.participant_id = v_participant.id
      and sr.status = 'waiting'
  ) then
    raise exception 'waiting sparring request already exists' using errcode = '42501';
  end if;

  insert into public.sparring_requests (
    event_id,
    participant_id,
    status
  )
  values (
    v_event_id,
    v_participant.id,
    'waiting'
  )
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.event_v0_get_my_sparring_requests(p_event_id text)
returns setof public.sparring_requests
language sql
stable
security invoker
set search_path = public
as $$
  select sr.*
  from public.sparring_requests sr
  join public.event_participants ep
    on ep.id = sr.participant_id
  where ep.event_id = trim(p_event_id)
    and ep.user_id = auth.uid()
    and sr.status in ('waiting', 'assigned')
  order by sr.created_at desc;
$$;

create or replace function public.event_v0_get_my_pairings(p_event_id text)
returns table (
  pairing_id uuid,
  order_number integer,
  pairing_status text,
  my_participant_id uuid,
  opponent_participant_id uuid,
  opponent_display_name text,
  opponent_gym_name text,
  opponent_weight_kg numeric,
  opponent_experience text,
  created_at timestamptz,
  completed_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  with me as (
    select ep.id as participant_id
    from public.event_participants ep
    where ep.event_id = trim(p_event_id)
      and ep.user_id = auth.uid()
    limit 1
  )
  select
    p.id as pairing_id,
    p.order_number,
    p.status as pairing_status,
    me.participant_id as my_participant_id,
    case
      when p.participant_a_id = me.participant_id then p.participant_b_id
      else p.participant_a_id
    end as opponent_participant_id,
    opp.display_name as opponent_display_name,
    opp.gym_name as opponent_gym_name,
    opp.weight_kg as opponent_weight_kg,
    opp.experience as opponent_experience,
    p.created_at,
    p.completed_at
  from me
  join public.pairings p
    on p.event_id = trim(p_event_id)
   and me.participant_id in (p.participant_a_id, p.participant_b_id)
  join public.event_participants opp
    on opp.id = case
      when p.participant_a_id = me.participant_id then p.participant_b_id
      else p.participant_a_id
    end
  where p.status = 'active'
  order by p.order_number asc;
$$;

-- ---------------------------------------------------------------------------
-- Operator RPCs (security definer · secret verified)
-- ---------------------------------------------------------------------------

create or replace function public.event_v0_operator_add_participant(
  p_event_id text,
  p_operator_secret text,
  p_display_name text,
  p_gym_name text,
  p_weight_kg numeric default null,
  p_experience text default '',
  p_attendance_status text default 'active'
)
returns public.event_participants
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id text := trim(p_event_id);
  v_name text := trim(p_display_name);
  v_gym text := trim(p_gym_name);
  v_exp text := coalesce(trim(p_experience), '');
  v_attendance text := coalesce(nullif(trim(p_attendance_status), ''), 'active');
  v_row public.event_participants;
begin
  perform public.event_v0_verify_operator_secret(v_event_id, p_operator_secret);
  perform public.event_v0_lock_event(v_event_id);

  if v_name is null or char_length(v_name) < 1 or char_length(v_name) > 40 then
    raise exception 'invalid display_name' using errcode = '22023';
  end if;

  if v_gym is null or char_length(v_gym) < 1 or char_length(v_gym) > 80 then
    raise exception 'invalid gym_name' using errcode = '22023';
  end if;

  if p_weight_kg is not null
     and (p_weight_kg < 35 or p_weight_kg > 200) then
    raise exception 'invalid weight_kg' using errcode = '22023';
  end if;

  if char_length(v_exp) > 40 then
    raise exception 'invalid experience' using errcode = '22023';
  end if;

  if v_attendance not in ('active', 'left', 'no_show') then
    raise exception 'invalid attendance_status' using errcode = '22023';
  end if;

  insert into public.event_participants (
    event_id,
    user_id,
    display_name,
    gym_name,
    weight_kg,
    experience,
    attendance_status,
    created_by
  )
  values (
    v_event_id,
    null,
    v_name,
    v_gym,
    p_weight_kg,
    v_exp,
    v_attendance,
    'operator'
  )
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.event_v0_operator_update_participant(
  p_event_id text,
  p_operator_secret text,
  p_participant_id uuid,
  p_display_name text default null,
  p_gym_name text default null,
  p_weight_kg numeric default null,
  p_experience text default null,
  p_attendance_status text default null
)
returns public.event_participants
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id text := trim(p_event_id);
  v_row public.event_participants;
begin
  perform public.event_v0_verify_operator_secret(v_event_id, p_operator_secret);
  perform public.event_v0_lock_event(v_event_id);

  select *
    into v_row
  from public.event_participants
  where id = p_participant_id
    and event_id = v_event_id
  for update;

  if not found then
    raise exception 'participant not found' using errcode = 'P0002';
  end if;

  if p_display_name is not null then
    if char_length(trim(p_display_name)) < 1 or char_length(trim(p_display_name)) > 40 then
      raise exception 'invalid display_name' using errcode = '22023';
    end if;
    v_row.display_name := trim(p_display_name);
  end if;

  if p_gym_name is not null then
    if char_length(trim(p_gym_name)) < 1 or char_length(trim(p_gym_name)) > 80 then
      raise exception 'invalid gym_name' using errcode = '22023';
    end if;
    v_row.gym_name := trim(p_gym_name);
  end if;

  if p_weight_kg is not null then
    if p_weight_kg < 35 or p_weight_kg > 200 then
      raise exception 'invalid weight_kg' using errcode = '22023';
    end if;
    v_row.weight_kg := p_weight_kg;
  end if;

  if p_experience is not null then
    if char_length(trim(p_experience)) > 40 then
      raise exception 'invalid experience' using errcode = '22023';
    end if;
    v_row.experience := trim(p_experience);
  end if;

  if p_attendance_status is not null then
    if trim(p_attendance_status) not in ('active', 'left', 'no_show') then
      raise exception 'invalid attendance_status' using errcode = '22023';
    end if;
    v_row.attendance_status := trim(p_attendance_status);
  end if;

  update public.event_participants
  set
    display_name = v_row.display_name,
    gym_name = v_row.gym_name,
    weight_kg = v_row.weight_kg,
    experience = v_row.experience,
    attendance_status = v_row.attendance_status
  where id = v_row.id
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.event_v0_operator_list_participants(
  p_event_id text,
  p_operator_secret text
)
returns setof public.event_participants
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.event_v0_verify_operator_secret(trim(p_event_id), p_operator_secret);

  return query
  select ep.*
  from public.event_participants ep
  where ep.event_id = trim(p_event_id)
  order by ep.created_at asc;
end;
$$;

create or replace function public.event_v0_operator_list_sparring_requests(
  p_event_id text,
  p_operator_secret text
)
returns table (
  request_id uuid,
  participant_id uuid,
  display_name text,
  gym_name text,
  weight_kg numeric,
  experience text,
  attendance_status text,
  request_status text,
  requested_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.event_v0_verify_operator_secret(trim(p_event_id), p_operator_secret);

  return query
  select
    sr.id as request_id,
    ep.id as participant_id,
    ep.display_name,
    ep.gym_name,
    ep.weight_kg,
    ep.experience,
    ep.attendance_status,
    sr.status as request_status,
    sr.created_at as requested_at
  from public.sparring_requests sr
  join public.event_participants ep on ep.id = sr.participant_id
  where sr.event_id = trim(p_event_id)
    and sr.status = 'waiting'
  order by sr.created_at asc;
end;
$$;

create or replace function public.event_v0_operator_list_pairings(
  p_event_id text,
  p_operator_secret text
)
returns setof public.pairings
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.event_v0_verify_operator_secret(trim(p_event_id), p_operator_secret);

  return query
  select p.*
  from public.pairings p
  where p.event_id = trim(p_event_id)
  order by
    case when p.status = 'active' then 0 else 1 end,
    p.order_number asc,
    p.created_at asc;
end;
$$;

create or replace function public.event_v0_operator_create_pairing(
  p_event_id text,
  p_operator_secret text,
  p_participant_a_id uuid,
  p_participant_b_id uuid
)
returns public.pairings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id text := trim(p_event_id);
  v_req_a public.sparring_requests;
  v_req_b public.sparring_requests;
  v_order integer;
  v_row public.pairings;
begin
  perform public.event_v0_verify_operator_secret(v_event_id, p_operator_secret);
  perform public.event_v0_lock_event(v_event_id);

  if p_participant_a_id = p_participant_b_id then
    raise exception 'participants must be different' using errcode = '22023';
  end if;

  perform public.event_v0_assert_participant_active(p_participant_a_id, v_event_id);
  perform public.event_v0_assert_participant_active(p_participant_b_id, v_event_id);

  perform public.event_v0_assert_not_in_active_pairing(v_event_id, p_participant_a_id);
  perform public.event_v0_assert_not_in_active_pairing(v_event_id, p_participant_b_id);

  -- Lock waiting requests in deterministic participant order.
  if p_participant_a_id::text <= p_participant_b_id::text then
    v_req_a := public.event_v0_pick_waiting_request(v_event_id, p_participant_a_id);
    v_req_b := public.event_v0_pick_waiting_request(v_event_id, p_participant_b_id);
  else
    v_req_b := public.event_v0_pick_waiting_request(v_event_id, p_participant_b_id);
    v_req_a := public.event_v0_pick_waiting_request(v_event_id, p_participant_a_id);
  end if;

  perform public.event_v0_assert_waiting_request_belongs(
    v_req_a, v_event_id, p_participant_a_id
  );
  perform public.event_v0_assert_waiting_request_belongs(
    v_req_b, v_event_id, p_participant_b_id
  );

  v_order := public.event_v0_next_order_number(v_event_id);

  insert into public.pairings (
    event_id,
    participant_a_id,
    participant_b_id,
    sparring_request_a_id,
    sparring_request_b_id,
    order_number,
    status
  )
  values (
    v_event_id,
    p_participant_a_id,
    p_participant_b_id,
    v_req_a.id,
    v_req_b.id,
    v_order,
    'active'
  )
  returning * into v_row;

  update public.sparring_requests
  set status = 'assigned'
  where id in (v_req_a.id, v_req_b.id);

  perform public.event_v0_append_pairing_history(
    v_row.id,
    v_event_id,
    'pairing_created',
    jsonb_build_object(
      'participant_a_id', p_participant_a_id,
      'participant_b_id', p_participant_b_id,
      'sparring_request_a_id', v_req_a.id,
      'sparring_request_b_id', v_req_b.id,
      'order_number', v_order
    ),
    'operator',
    'operator'
  );

  return v_row;
end;
$$;

create or replace function public.event_v0_operator_change_pairing_opponent(
  p_event_id text,
  p_operator_secret text,
  p_pairing_id uuid,
  p_replaced_participant_id uuid,
  p_new_participant_id uuid
)
returns public.pairings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id text := trim(p_event_id);
  v_row public.pairings;
  v_side text;
  v_old_request_id uuid;
  v_new_request public.sparring_requests;
  v_kept_participant_id uuid;
begin
  perform public.event_v0_verify_operator_secret(v_event_id, p_operator_secret);
  perform public.event_v0_lock_event(v_event_id);

  if p_replaced_participant_id = p_new_participant_id then
    raise exception 'new participant must differ from replaced participant'
      using errcode = '22023';
  end if;

  v_row := public.event_v0_assert_active_pairing(p_pairing_id, v_event_id);

  if p_replaced_participant_id not in (v_row.participant_a_id, v_row.participant_b_id) then
    raise exception 'replaced participant is not in this pairing' using errcode = '22023';
  end if;

  if p_new_participant_id in (v_row.participant_a_id, v_row.participant_b_id) then
    raise exception 'new participant is already in this pairing' using errcode = '22023';
  end if;

  perform public.event_v0_assert_participant_active(p_new_participant_id, v_event_id);
  perform public.event_v0_assert_not_in_active_pairing(v_event_id, p_new_participant_id);

  v_new_request := public.event_v0_pick_waiting_request(v_event_id, p_new_participant_id);
  perform public.event_v0_assert_waiting_request_belongs(
    v_new_request, v_event_id, p_new_participant_id
  );

  if v_row.participant_a_id = p_replaced_participant_id then
    v_side := 'a';
    v_old_request_id := v_row.sparring_request_a_id;
    v_kept_participant_id := v_row.participant_b_id;
  else
    v_side := 'b';
    v_old_request_id := v_row.sparring_request_b_id;
    v_kept_participant_id := v_row.participant_a_id;
  end if;

  if v_old_request_id is not null then
    update public.sparring_requests
    set status = 'waiting'
    where id = v_old_request_id;
  end if;

  update public.sparring_requests
  set status = 'assigned'
  where id = v_new_request.id;

  if v_side = 'a' then
    update public.pairings
    set
      participant_a_id = p_new_participant_id,
      sparring_request_a_id = v_new_request.id
    where id = v_row.id
    returning * into v_row;
  else
    update public.pairings
    set
      participant_b_id = p_new_participant_id,
      sparring_request_b_id = v_new_request.id
    where id = v_row.id
    returning * into v_row;
  end if;

  perform public.event_v0_append_pairing_history(
    v_row.id,
    v_event_id,
    'opponent_changed',
    jsonb_build_object(
      'side', v_side,
      'replaced_participant_id', p_replaced_participant_id,
      'new_participant_id', p_new_participant_id,
      'kept_participant_id', v_kept_participant_id,
      'old_sparring_request_id', v_old_request_id,
      'new_sparring_request_id', v_new_request.id,
      'order_number', v_row.order_number,
      'pairing_id', v_row.id
    ),
    'operator',
    'operator'
  );

  return v_row;
end;
$$;

create or replace function public.event_v0_operator_change_pairing_order(
  p_event_id text,
  p_operator_secret text,
  p_pairing_id uuid,
  p_new_order_number integer
)
returns public.pairings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id text := trim(p_event_id);
  v_row public.pairings;
  v_other public.pairings;
  v_old_order integer;
  v_temp_order integer;
begin
  perform public.event_v0_verify_operator_secret(v_event_id, p_operator_secret);
  perform public.event_v0_lock_event(v_event_id);

  if p_new_order_number is null or p_new_order_number < 1 then
    raise exception 'invalid order_number' using errcode = '22023';
  end if;

  v_row := public.event_v0_assert_active_pairing(p_pairing_id, v_event_id);
  v_old_order := v_row.order_number;

  if v_old_order = p_new_order_number then
    return v_row;
  end if;

  -- Retired numbers (completed/cancelled pairings) cannot be targets.
  if exists (
    select 1
    from public.pairings p
    where p.event_id = v_event_id
      and p.order_number = p_new_order_number
      and p.status <> 'active'
  ) then
    raise exception 'order number is retired by a completed or cancelled pairing'
      using errcode = '42501';
  end if;

  -- Reorder is swap-only among active pairings.
  select *
    into v_other
  from public.pairings
  where event_id = v_event_id
    and status = 'active'
    and order_number = p_new_order_number
    and id <> v_row.id
  for update;

  if not found then
    raise exception 'target order must belong to another active pairing'
      using errcode = '42501';
  end if;

  v_temp_order := public.event_v0_next_order_number(v_event_id);

  update public.pairings
  set order_number = v_temp_order
  where id = v_row.id;

  update public.pairings
  set order_number = v_old_order
  where id = v_other.id;

  update public.pairings
  set order_number = p_new_order_number
  where id = v_row.id
  returning * into v_row;

  perform public.event_v0_append_pairing_history(
    v_other.id,
    v_event_id,
    'order_changed',
    jsonb_build_object(
      'old_order_number', p_new_order_number,
      'new_order_number', v_old_order,
      'swapped_with_pairing_id', v_row.id,
      'reason', 'swap'
    ),
    'operator',
    'operator'
  );

  perform public.event_v0_append_pairing_history(
    v_row.id,
    v_event_id,
    'order_changed',
    jsonb_build_object(
      'old_order_number', v_old_order,
      'new_order_number', p_new_order_number,
      'swapped_with_pairing_id', v_other.id,
      'reason', 'swap'
    ),
    'operator',
    'operator'
  );

  return v_row;
end;
$$;

create or replace function public.event_v0_operator_cancel_pairing(
  p_event_id text,
  p_operator_secret text,
  p_pairing_id uuid
)
returns public.pairings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id text := trim(p_event_id);
  v_row public.pairings;
begin
  perform public.event_v0_verify_operator_secret(v_event_id, p_operator_secret);
  perform public.event_v0_lock_event(v_event_id);

  v_row := public.event_v0_assert_active_pairing(p_pairing_id, v_event_id);

  update public.sparring_requests
  set status = 'waiting'
  where id in (v_row.sparring_request_a_id, v_row.sparring_request_b_id)
    and status = 'assigned';

  update public.pairings
  set
    status = 'cancelled',
    completed_at = null
  where id = v_row.id
  returning * into v_row;

  perform public.event_v0_append_pairing_history(
    v_row.id,
    v_event_id,
    'cancelled',
    jsonb_build_object(
      'order_number', v_row.order_number,
      'participant_a_id', v_row.participant_a_id,
      'participant_b_id', v_row.participant_b_id,
      'sparring_request_a_id', v_row.sparring_request_a_id,
      'sparring_request_b_id', v_row.sparring_request_b_id,
      'requests_returned_to', 'waiting'
    ),
    'operator',
    'operator'
  );

  return v_row;
end;
$$;

create or replace function public.event_v0_operator_complete_pairing(
  p_event_id text,
  p_operator_secret text,
  p_pairing_id uuid
)
returns public.pairings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id text := trim(p_event_id);
  v_row public.pairings;
begin
  perform public.event_v0_verify_operator_secret(v_event_id, p_operator_secret);
  perform public.event_v0_lock_event(v_event_id);

  v_row := public.event_v0_assert_active_pairing(p_pairing_id, v_event_id);

  update public.sparring_requests
  set status = 'completed'
  where id in (v_row.sparring_request_a_id, v_row.sparring_request_b_id)
    and status = 'assigned';

  update public.pairings
  set
    status = 'completed',
    completed_at = now()
  where id = v_row.id
  returning * into v_row;

  perform public.event_v0_append_pairing_history(
    v_row.id,
    v_event_id,
    'completed',
    jsonb_build_object(
      'order_number', v_row.order_number,
      'participant_a_id', v_row.participant_a_id,
      'participant_b_id', v_row.participant_b_id,
      'sparring_request_a_id', v_row.sparring_request_a_id,
      'sparring_request_b_id', v_row.sparring_request_b_id,
      'completed_at', v_row.completed_at
    ),
    'operator',
    'operator'
  );

  return v_row;
end;
$$;

-- Operator can create a new waiting request on behalf of a participant after completion.
create or replace function public.event_v0_operator_create_sparring_request(
  p_event_id text,
  p_operator_secret text,
  p_participant_id uuid
)
returns public.sparring_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id text := trim(p_event_id);
  v_participant public.event_participants;
  v_row public.sparring_requests;
begin
  perform public.event_v0_verify_operator_secret(v_event_id, p_operator_secret);
  perform public.event_v0_lock_event(v_event_id);

  v_participant := public.event_v0_assert_participant_active(p_participant_id, v_event_id);

  perform public.event_v0_assert_not_in_active_pairing(v_event_id, v_participant.id);

  if exists (
    select 1
    from public.sparring_requests sr
    where sr.participant_id = v_participant.id
      and sr.status = 'waiting'
  ) then
    raise exception 'waiting sparring request already exists' using errcode = '42501';
  end if;

  insert into public.sparring_requests (
    event_id,
    participant_id,
    status
  )
  values (
    v_event_id,
    v_participant.id,
    'waiting'
  )
  returning * into v_row;

  return v_row;
end;
$$;

-- Setup helper: SQL Editor (service role) only. Not granted to anon/authenticated.
create or replace function public.event_v0_set_operator_secret_hash(
  p_event_id text,
  p_plain_secret text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret text := coalesce(trim(p_plain_secret), '');
begin
  if char_length(v_secret) < 8 then
    raise exception 'operator secret must be at least 8 characters' using errcode = '22023';
  end if;

  update public.events
  set operator_secret_hash = extensions.crypt(v_secret, extensions.gen_salt('bf'))
  where id = trim(p_event_id);

  if not found then
    raise exception 'event not found' using errcode = 'P0002';
  end if;

  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.events enable row level security;
alter table public.event_participants enable row level security;
alter table public.sparring_requests enable row level security;
alter table public.pairings enable row level security;
alter table public.pairing_history enable row level security;

-- events: no direct client access (metadata via event_v0_get_public_event RPC)
drop policy if exists "event_v0_events_deny_all" on public.events;

-- RLS helpers: SECURITY DEFINER so SELECT policies do not re-enter RLS.
create or replace function public.event_v0_is_my_participant(p_participant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.event_participants ep
    where ep.id = p_participant_id
      and ep.user_id = auth.uid()
  );
$$;

create or replace function public.event_v0_is_active_pairing_opponent(
  p_participant_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.pairings p
    join public.event_participants me
      on me.user_id = auth.uid()
     and me.event_id = p.event_id
    where p.status = 'active'
      and me.id in (p.participant_a_id, p.participant_b_id)
      and p_participant_id in (p.participant_a_id, p.participant_b_id)
      and p_participant_id <> me.id
  );
$$;

create or replace function public.event_v0_is_my_pairing(p_pairing_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.pairings p
    join public.event_participants me
      on me.user_id = auth.uid()
     and me.event_id = p.event_id
    where p.id = p_pairing_id
      and me.id in (p.participant_a_id, p.participant_b_id)
  );
$$;

-- event_participants: own row + active-pairing opponents only
drop policy if exists "event_v0_participants_select_own" on public.event_participants;
create policy "event_v0_participants_select_own"
  on public.event_participants
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "event_v0_participants_select_pairing_opponent"
  on public.event_participants;
create policy "event_v0_participants_select_pairing_opponent"
  on public.event_participants
  for select
  to authenticated
  using (
    public.event_v0_is_active_pairing_opponent(event_participants.id)
  );

drop policy if exists "event_v0_participants_insert_self" on public.event_participants;

-- event_participants INSERT: RPC only (event_v0_register_participant / operator RPCs)

-- sparring_requests: own participant's requests only
drop policy if exists "event_v0_sparring_requests_select_own" on public.sparring_requests;
create policy "event_v0_sparring_requests_select_own"
  on public.sparring_requests
  for select
  to authenticated
  using (
    public.event_v0_is_my_participant(sparring_requests.participant_id)
  );

drop policy if exists "event_v0_sparring_requests_insert_own" on public.sparring_requests;

-- sparring_requests INSERT: RPC only (event_v0_create_sparring_request)
-- pairings: only pairings that include the caller
drop policy if exists "event_v0_pairings_select_own" on public.pairings;
create policy "event_v0_pairings_select_own"
  on public.pairings
  for select
  to authenticated
  using (
    public.event_v0_is_my_pairing(pairings.id)
  );

-- pairing_history: no participant direct access (operator via definer RPC only)

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------

revoke all on table public.events from public, anon, authenticated;
revoke all on table public.event_participants from public, anon;
revoke all on table public.sparring_requests from public, anon;
revoke all on table public.pairings from public, anon;
revoke all on table public.pairing_history from public, anon, authenticated;

grant select on table public.event_participants to authenticated;
grant select on table public.sparring_requests to authenticated;
grant select on table public.pairings to authenticated;

revoke all on function public.event_v0_require_auth() from public, anon, authenticated;
revoke all on function public.event_v0_assert_event_joinable(text) from public, anon, authenticated;
revoke all on function public.event_v0_verify_operator_secret(text, text) from public, anon, authenticated;
revoke all on function public.event_v0_lock_event(text) from public, anon, authenticated;
revoke all on function public.event_v0_is_my_participant(uuid) from public, anon;
revoke all on function public.event_v0_is_active_pairing_opponent(uuid) from public, anon;
revoke all on function public.event_v0_is_my_pairing(uuid) from public, anon;
revoke all on function public.event_v0_get_participant_for_user(text, uuid) from public, anon, authenticated;

grant execute on function public.event_v0_is_my_participant(uuid) to authenticated;
grant execute on function public.event_v0_is_active_pairing_opponent(uuid) to authenticated;
grant execute on function public.event_v0_is_my_pairing(uuid) to authenticated;
revoke all on function public.event_v0_next_order_number(text) from public, anon, authenticated;
revoke all on function public.event_v0_append_pairing_history(uuid, text, text, jsonb, text, text)
  from public, anon, authenticated;
revoke all on function public.event_v0_pick_waiting_request(text, uuid) from public, anon, authenticated;
revoke all on function public.event_v0_assert_participant_active(uuid, text) from public, anon, authenticated;
revoke all on function public.event_v0_assert_not_in_active_pairing(text, uuid) from public, anon, authenticated;
revoke all on function public.event_v0_assert_waiting_request_belongs(public.sparring_requests, text, uuid)
  from public, anon, authenticated;
revoke all on function public.event_v0_assert_active_pairing(uuid, text) from public, anon, authenticated;
revoke all on function public.event_v0_touch_updated_at() from public, anon, authenticated;
revoke all on function public.event_v0_set_operator_secret_hash(text, text)
  from public, anon, authenticated;

grant execute on function public.event_v0_get_public_event(text) to anon, authenticated;

grant execute on function public.event_v0_register_participant(text, text, text, numeric, text)
  to authenticated;
grant execute on function public.event_v0_create_sparring_request(text) to authenticated;
grant execute on function public.event_v0_get_my_sparring_requests(text) to authenticated;
grant execute on function public.event_v0_get_my_pairings(text) to authenticated;

grant execute on function public.event_v0_operator_add_participant(text, text, text, text, numeric, text, text)
  to authenticated;
grant execute on function public.event_v0_operator_update_participant(text, text, uuid, text, text, numeric, text, text)
  to authenticated;
grant execute on function public.event_v0_operator_list_participants(text, text) to authenticated;
grant execute on function public.event_v0_operator_list_sparring_requests(text, text) to authenticated;
grant execute on function public.event_v0_operator_list_pairings(text, text) to authenticated;
grant execute on function public.event_v0_operator_create_pairing(text, text, uuid, uuid) to authenticated;
grant execute on function public.event_v0_operator_change_pairing_opponent(text, text, uuid, uuid, uuid)
  to authenticated;
grant execute on function public.event_v0_operator_change_pairing_order(text, text, uuid, integer)
  to authenticated;
grant execute on function public.event_v0_operator_cancel_pairing(text, text, uuid) to authenticated;
grant execute on function public.event_v0_operator_complete_pairing(text, text, uuid) to authenticated;
grant execute on function public.event_v0_operator_create_sparring_request(text, text, uuid)
  to authenticated;

revoke execute on function public.event_v0_register_participant(text, text, text, numeric, text) from anon;
revoke execute on function public.event_v0_create_sparring_request(text) from anon;
revoke execute on function public.event_v0_get_my_sparring_requests(text) from anon;
revoke execute on function public.event_v0_get_my_pairings(text) from anon;
revoke execute on function public.event_v0_operator_add_participant(text, text, text, text, numeric, text, text) from anon;
revoke execute on function public.event_v0_operator_update_participant(text, text, uuid, text, text, numeric, text, text) from anon;
revoke execute on function public.event_v0_operator_list_participants(text, text) from anon;
revoke execute on function public.event_v0_operator_list_sparring_requests(text, text) from anon;
revoke execute on function public.event_v0_operator_list_pairings(text, text) from anon;
revoke execute on function public.event_v0_operator_create_pairing(text, text, uuid, uuid) from anon;
revoke execute on function public.event_v0_operator_change_pairing_opponent(text, text, uuid, uuid, uuid) from anon;
revoke execute on function public.event_v0_operator_change_pairing_order(text, text, uuid, integer) from anon;
revoke execute on function public.event_v0_operator_cancel_pairing(text, text, uuid) from anon;
revoke execute on function public.event_v0_operator_complete_pairing(text, text, uuid) from anon;
revoke execute on function public.event_v0_operator_create_sparring_request(text, text, uuid) from anon;
