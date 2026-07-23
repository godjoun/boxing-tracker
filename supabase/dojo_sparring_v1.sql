-- MANTLE 라이벌 찾기 v1
-- 공개 정보: 닉네임·체급·경력·강도·지역·희망 시간·한 줄 소개
-- 연락처, 신체 수치, 훈련 기록은 저장하거나 반환하지 않는다.
--
-- 베타는 로그인 전 기기 actor UUID를 사용한다. actor UUID는 공개 목록에
-- 반환하지 않으며, 수정·삭제·관심 조회는 RPC 안에서 소유자를 확인한다.
-- 유료/정식 운영 전에는 Supabase Auth 기반 RLS로 교체해야 한다.

create table if not exists public.dojo_sparring_profiles (
  id uuid primary key default gen_random_uuid(),
  actor_id text not null unique,
  nickname text not null default '',
  weight_class text not null default '',
  experience text not null default '',
  style text not null default '',
  area text not null default '',
  meet_when text not null default '',
  note text not null default '',
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(trim(actor_id)) >= 20),
  check (char_length(trim(nickname)) between 1 and 24),
  check (char_length(trim(weight_class)) between 1 and 30),
  check (char_length(trim(experience)) between 1 and 40),
  check (char_length(trim(style)) between 1 and 30),
  check (char_length(trim(area)) between 1 and 80),
  check (char_length(trim(meet_when)) between 1 and 80),
  check (char_length(note) <= 280)
);

create index if not exists dojo_sparring_profiles_active_updated_idx
  on public.dojo_sparring_profiles (active, updated_at desc);
create index if not exists dojo_sparring_profiles_weight_idx
  on public.dojo_sparring_profiles (weight_class);

create table if not exists public.dojo_sparring_interests (
  id uuid primary key default gen_random_uuid(),
  recipient_profile_id uuid not null references public.dojo_sparring_profiles (id) on delete cascade,
  sender_actor_id text not null,
  created_at timestamptz not null default now(),
  unique (recipient_profile_id, sender_actor_id),
  check (char_length(trim(sender_actor_id)) >= 20)
);

create index if not exists dojo_sparring_interests_recipient_idx
  on public.dojo_sparring_interests (recipient_profile_id, created_at desc);
create index if not exists dojo_sparring_interests_sender_idx
  on public.dojo_sparring_interests (sender_actor_id, created_at desc);

alter table public.dojo_sparring_profiles enable row level security;
alter table public.dojo_sparring_interests enable row level security;

-- 직접 테이블 접근은 차단하고 아래 RPC만 사용한다.
drop policy if exists "Public read sparring profiles" on public.dojo_sparring_profiles;
drop policy if exists "Public write sparring profiles" on public.dojo_sparring_profiles;
drop policy if exists "Public read sparring interests" on public.dojo_sparring_interests;
drop policy if exists "Public write sparring interests" on public.dojo_sparring_interests;

create or replace function public.list_dojo_sparring_profiles(
  p_actor_id text,
  p_weight_class text default '',
  p_area_query text default '',
  p_time_query text default ''
)
returns table (
  id uuid,
  nickname text,
  weight_class text,
  experience text,
  style text,
  area text,
  meet_when text,
  note text,
  active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  is_mine boolean
)
language sql
security definer
set search_path = public
as $$
  select
    profile.id,
    profile.nickname,
    profile.weight_class,
    profile.experience,
    profile.style,
    profile.area,
    profile.meet_when,
    profile.note,
    profile.active,
    profile.created_at,
    profile.updated_at,
    profile.actor_id = p_actor_id as is_mine
  from public.dojo_sparring_profiles profile
  where profile.active = true
    and (coalesce(trim(p_weight_class), '') = '' or profile.weight_class = trim(p_weight_class))
    and (
      coalesce(trim(p_area_query), '') = ''
      or profile.area ilike '%' || trim(p_area_query) || '%'
    )
    and (
      coalesce(trim(p_time_query), '') = ''
      or profile.meet_when ilike '%' || trim(p_time_query) || '%'
    )
  order by
    (profile.actor_id = p_actor_id) desc,
    profile.updated_at desc
  limit 100;
$$;

create or replace function public.get_my_dojo_sparring_profile(p_actor_id text)
returns setof public.dojo_sparring_profiles
language sql
security definer
set search_path = public
as $$
  select *
  from public.dojo_sparring_profiles
  where actor_id = p_actor_id
  limit 1;
$$;

create or replace function public.upsert_my_dojo_sparring_profile(
  p_actor_id text,
  p_profile jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nickname text := trim(coalesce(p_profile->>'nickname', ''));
  v_weight_class text := trim(coalesce(p_profile->>'weight_class', ''));
  v_experience text := trim(coalesce(p_profile->>'experience', ''));
  v_style text := trim(coalesce(p_profile->>'style', ''));
  v_area text := trim(coalesce(p_profile->>'area', ''));
  v_meet_when text := trim(coalesce(p_profile->>'meet_when', ''));
  v_note text := trim(coalesce(p_profile->>'note', ''));
begin
  if length(trim(coalesce(p_actor_id, ''))) < 20
    or length(v_nickname) = 0 or length(v_nickname) > 24
    or length(v_weight_class) = 0 or length(v_weight_class) > 30
    or length(v_experience) = 0 or length(v_experience) > 40
    or length(v_style) = 0 or length(v_style) > 30
    or length(v_area) = 0 or length(v_area) > 80
    or length(v_meet_when) = 0 or length(v_meet_when) > 80
    or length(v_note) > 280
  then
    return false;
  end if;

  insert into public.dojo_sparring_profiles (
    actor_id, nickname, weight_class, experience, style, area, meet_when, note, active
  ) values (
    p_actor_id, v_nickname, v_weight_class, v_experience, v_style, v_area,
    v_meet_when, v_note, coalesce((p_profile->>'active')::boolean, false)
  )
  on conflict (actor_id) do update set
    nickname = excluded.nickname,
    weight_class = excluded.weight_class,
    experience = excluded.experience,
    style = excluded.style,
    area = excluded.area,
    meet_when = excluded.meet_when,
    note = excluded.note,
    active = excluded.active,
    updated_at = now();

  return true;
end;
$$;

create or replace function public.delete_my_dojo_sparring_profile(p_actor_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if length(trim(coalesce(p_actor_id, ''))) < 20 then
    return false;
  end if;

  delete from public.dojo_sparring_profiles where actor_id = p_actor_id;
  return found;
end;
$$;

create or replace function public.send_dojo_sparring_interest(
  p_sender_actor_id text,
  p_recipient_profile_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient_actor_id text;
begin
  if length(trim(coalesce(p_sender_actor_id, ''))) < 20
    or p_recipient_profile_id is null
  then
    return false;
  end if;

  select actor_id into v_recipient_actor_id
  from public.dojo_sparring_profiles
  where id = p_recipient_profile_id and active = true;

  if not found or v_recipient_actor_id = p_sender_actor_id then
    return false;
  end if;

  if not exists (
    select 1
    from public.dojo_sparring_profiles
    where actor_id = p_sender_actor_id and active = true
  ) then
    return false;
  end if;

  insert into public.dojo_sparring_interests (recipient_profile_id, sender_actor_id)
  values (p_recipient_profile_id, p_sender_actor_id)
  on conflict (recipient_profile_id, sender_actor_id) do nothing;

  return true;
end;
$$;

create or replace function public.cancel_dojo_sparring_interest(
  p_sender_actor_id text,
  p_recipient_profile_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.dojo_sparring_interests
  where sender_actor_id = p_sender_actor_id
    and recipient_profile_id = p_recipient_profile_id;
  return found;
end;
$$;

create or replace function public.list_my_dojo_sparring_interests(p_actor_id text)
returns table (
  id uuid,
  direction text,
  profile_id uuid,
  nickname text,
  weight_class text,
  area text,
  meet_when text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    interest.id,
    'sent'::text,
    profile.id,
    profile.nickname,
    profile.weight_class,
    profile.area,
    profile.meet_when,
    interest.created_at
  from public.dojo_sparring_interests interest
  join public.dojo_sparring_profiles profile on profile.id = interest.recipient_profile_id
  where interest.sender_actor_id = p_actor_id

  union all

  select
    interest.id,
    'received'::text,
    sender_profile.id,
    sender_profile.nickname,
    sender_profile.weight_class,
    sender_profile.area,
    sender_profile.meet_when,
    interest.created_at
  from public.dojo_sparring_interests interest
  join public.dojo_sparring_profiles recipient on recipient.id = interest.recipient_profile_id
  join public.dojo_sparring_profiles sender_profile on sender_profile.actor_id = interest.sender_actor_id
  where recipient.actor_id = p_actor_id
  order by created_at desc
  limit 100;
$$;

revoke all on function public.list_dojo_sparring_profiles(text, text, text, text) from public;
revoke all on function public.get_my_dojo_sparring_profile(text) from public;
revoke all on function public.upsert_my_dojo_sparring_profile(text, jsonb) from public;
revoke all on function public.delete_my_dojo_sparring_profile(text) from public;
revoke all on function public.send_dojo_sparring_interest(text, uuid) from public;
revoke all on function public.cancel_dojo_sparring_interest(text, uuid) from public;
revoke all on function public.list_my_dojo_sparring_interests(text) from public;

grant execute on function public.list_dojo_sparring_profiles(text, text, text, text) to anon, authenticated;
grant execute on function public.get_my_dojo_sparring_profile(text) to anon, authenticated;
grant execute on function public.upsert_my_dojo_sparring_profile(text, jsonb) to anon, authenticated;
grant execute on function public.delete_my_dojo_sparring_profile(text) to anon, authenticated;
grant execute on function public.send_dojo_sparring_interest(text, uuid) to anon, authenticated;
grant execute on function public.cancel_dojo_sparring_interest(text, uuid) to anon, authenticated;
grant execute on function public.list_my_dojo_sparring_interests(text) to anon, authenticated;
