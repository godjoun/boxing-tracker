-- 체육관 교류 행사 participation (Phase 1 · 소유권 기반)
-- Supabase SQL Editor에서 이 파일만 Run.
-- 기존 dojo_exchange_* (모임) / dojo_gym_listings 등과 무관 — 덮어쓰지 않음.
--
-- 전제: Authentication > Providers > Anonymous sign-ins ON
-- user_id = auth.users.id (anonymous 포함). 클라이언트 actor UUID 소유권 금지.

create table if not exists public.dojo_gym_exchange_participations (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  nickname text not null,
  gym_name text not null,
  sparring_rounds integer not null default 0,
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dojo_gym_exchange_participations_event_user_unique
    unique (event_id, user_id),
  constraint dojo_gym_exchange_participations_rounds_nonnegative
    check (sparring_rounds >= 0),
  constraint dojo_gym_exchange_participations_event_id_len
    check (char_length(trim(event_id)) between 1 and 120),
  constraint dojo_gym_exchange_participations_nickname_len
    check (char_length(trim(nickname)) between 1 and 40),
  constraint dojo_gym_exchange_participations_gym_name_len
    check (char_length(trim(gym_name)) between 1 and 80)
);

create index if not exists dojo_gym_exchange_participations_user_id_idx
  on public.dojo_gym_exchange_participations (user_id);

create index if not exists dojo_gym_exchange_participations_event_id_idx
  on public.dojo_gym_exchange_participations (event_id);

alter table public.dojo_gym_exchange_participations enable row level security;

-- 기존 정책 제거 후 재생성 (재실행 안전)
drop policy if exists "gym_exchange_part_select_own"
  on public.dojo_gym_exchange_participations;
drop policy if exists "gym_exchange_part_insert_own"
  on public.dojo_gym_exchange_participations;
drop policy if exists "gym_exchange_part_update_own"
  on public.dojo_gym_exchange_participations;
drop policy if exists "gym_exchange_part_delete_own"
  on public.dojo_gym_exchange_participations;

-- SELECT: 본인 row만 (전체 참가자 목록 공개 없음)
create policy "gym_exchange_part_select_own"
  on public.dojo_gym_exchange_participations
  for select
  to authenticated
  using (auth.uid() = user_id);

-- INSERT: 본인 uid만 (클라이언트가 다른 user_id를 넣으면 거부)
create policy "gym_exchange_part_insert_own"
  on public.dojo_gym_exchange_participations
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- UPDATE: 본인 row만
create policy "gym_exchange_part_update_own"
  on public.dojo_gym_exchange_participations
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- DELETE: MVP에서 참가 취소 없음 — 정책 없음 = 거부

revoke all on table public.dojo_gym_exchange_participations from public;
revoke all on table public.dojo_gym_exchange_participations from anon;
grant select, insert, update on table public.dojo_gym_exchange_participations
  to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: user_id를 클라이언트에 맡기지 않고 auth.uid()로 고정
-- security invoker → RLS + auth.uid()가 호출자 기준
-- ---------------------------------------------------------------------------

create or replace function public.join_gym_exchange_participation(
  p_event_id text,
  p_nickname text,
  p_gym_name text
)
returns public.dojo_gym_exchange_participations
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_event text := trim(p_event_id);
  v_nick text := trim(p_nickname);
  v_gym text := trim(p_gym_name);
  v_row public.dojo_gym_exchange_participations;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if v_event is null or char_length(v_event) < 1 or char_length(v_event) > 120 then
    raise exception 'invalid event_id' using errcode = '22023';
  end if;

  if v_nick is null or char_length(v_nick) < 1 or char_length(v_nick) > 40 then
    raise exception 'invalid nickname' using errcode = '22023';
  end if;

  if v_gym is null or char_length(v_gym) < 1 or char_length(v_gym) > 80 then
    raise exception 'invalid gym_name' using errcode = '22023';
  end if;

  select *
    into v_row
  from public.dojo_gym_exchange_participations
  where event_id = v_event
    and user_id = v_uid;

  if found then
    return v_row;
  end if;

  insert into public.dojo_gym_exchange_participations (
    event_id,
    user_id,
    nickname,
    gym_name
  )
  values (v_event, v_uid, v_nick, v_gym)
  returning * into v_row;

  return v_row;
exception
  when unique_violation then
    -- 동시 join 경쟁: 기존 row 반환
    select *
      into v_row
    from public.dojo_gym_exchange_participations
    where event_id = v_event
      and user_id = v_uid;
    return v_row;
end;
$$;

create or replace function public.update_my_gym_exchange_sparring_rounds(
  p_event_id text,
  p_rounds integer
)
returns public.dojo_gym_exchange_participations
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_event text := trim(p_event_id);
  v_row public.dojo_gym_exchange_participations;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if v_event is null or char_length(v_event) < 1 then
    raise exception 'invalid event_id' using errcode = '22023';
  end if;

  if p_rounds is null or p_rounds < 0 then
    raise exception 'sparring_rounds must be >= 0' using errcode = '22023';
  end if;

  update public.dojo_gym_exchange_participations
  set
    sparring_rounds = p_rounds,
    updated_at = now()
  where event_id = v_event
    and user_id = v_uid
  returning * into v_row;

  if not found then
    raise exception 'participation not found' using errcode = 'P0002';
  end if;

  return v_row;
end;
$$;

revoke all on function public.join_gym_exchange_participation(text, text, text)
  from public;
revoke all on function public.update_my_gym_exchange_sparring_rounds(text, integer)
  from public;

grant execute on function public.join_gym_exchange_participation(text, text, text)
  to authenticated;
grant execute on function public.update_my_gym_exchange_sparring_rounds(text, integer)
  to authenticated;

-- anon은 실행 불가 (미인증 FAIL)
revoke execute on function public.join_gym_exchange_participation(text, text, text)
  from anon;
revoke execute on function public.update_my_gym_exchange_sparring_rounds(text, integer)
  from anon;
