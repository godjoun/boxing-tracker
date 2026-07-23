-- ANIMA 라이벌 채팅 v2
-- 전제: dojo_sparring_v1.sql 실행 완료
-- 서로 관심을 보낸 두 복서만 대화방을 열고 메시지를 읽고 보낼 수 있다.

create table if not exists public.dojo_sparring_threads (
  id uuid primary key default gen_random_uuid(),
  actor_a_id text not null,
  actor_b_id text not null,
  profile_a_id uuid not null references public.dojo_sparring_profiles (id) on delete cascade,
  profile_b_id uuid not null references public.dojo_sparring_profiles (id) on delete cascade,
  last_message_at timestamptz,
  last_message_preview text not null default '',
  last_sender_actor_id text not null default '',
  actor_a_last_read_at timestamptz,
  actor_b_last_read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (actor_a_id, actor_b_id),
  check (actor_a_id < actor_b_id),
  check (char_length(trim(actor_a_id)) >= 20),
  check (char_length(trim(actor_b_id)) >= 20)
);

create table if not exists public.dojo_sparring_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.dojo_sparring_threads (id) on delete cascade,
  sender_actor_id text not null,
  sender_nickname text not null default '',
  body text not null,
  created_at timestamptz not null default now(),
  check (char_length(trim(body)) > 0),
  check (char_length(body) <= 500)
);

create index if not exists dojo_sparring_threads_actor_a_idx
  on public.dojo_sparring_threads (actor_a_id, last_message_at desc nulls last);
create index if not exists dojo_sparring_threads_actor_b_idx
  on public.dojo_sparring_threads (actor_b_id, last_message_at desc nulls last);
create index if not exists dojo_sparring_messages_thread_idx
  on public.dojo_sparring_messages (thread_id, created_at);

alter table public.dojo_sparring_threads enable row level security;
alter table public.dojo_sparring_messages enable row level security;

-- 직접 테이블 접근은 차단하고 아래 RPC만 사용한다.
drop policy if exists "Public read sparring threads" on public.dojo_sparring_threads;
drop policy if exists "Public write sparring threads" on public.dojo_sparring_threads;
drop policy if exists "Public read sparring messages" on public.dojo_sparring_messages;
drop policy if exists "Public write sparring messages" on public.dojo_sparring_messages;

create or replace function public.open_dojo_sparring_chat(
  p_actor_id text,
  p_peer_profile_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_my_profile public.dojo_sparring_profiles%rowtype;
  v_peer_profile public.dojo_sparring_profiles%rowtype;
  v_actor_a text;
  v_actor_b text;
  v_profile_a uuid;
  v_profile_b uuid;
  v_thread_id uuid;
begin
  if length(trim(coalesce(p_actor_id, ''))) < 20 or p_peer_profile_id is null then
    return null;
  end if;

  select * into v_my_profile
  from public.dojo_sparring_profiles
  where actor_id = p_actor_id and active = true;

  select * into v_peer_profile
  from public.dojo_sparring_profiles
  where id = p_peer_profile_id and active = true;

  if v_my_profile.id is null
    or v_peer_profile.id is null
    or v_my_profile.actor_id = v_peer_profile.actor_id
  then
    return null;
  end if;

  -- A→B, B→A 관심이 모두 남아 있어야 한다.
  if not exists (
    select 1 from public.dojo_sparring_interests
    where sender_actor_id = v_my_profile.actor_id
      and recipient_profile_id = v_peer_profile.id
  ) or not exists (
    select 1 from public.dojo_sparring_interests
    where sender_actor_id = v_peer_profile.actor_id
      and recipient_profile_id = v_my_profile.id
  ) then
    return null;
  end if;

  if v_my_profile.actor_id < v_peer_profile.actor_id then
    v_actor_a := v_my_profile.actor_id;
    v_actor_b := v_peer_profile.actor_id;
    v_profile_a := v_my_profile.id;
    v_profile_b := v_peer_profile.id;
  else
    v_actor_a := v_peer_profile.actor_id;
    v_actor_b := v_my_profile.actor_id;
    v_profile_a := v_peer_profile.id;
    v_profile_b := v_my_profile.id;
  end if;

  insert into public.dojo_sparring_threads (
    actor_a_id, actor_b_id, profile_a_id, profile_b_id
  ) values (
    v_actor_a, v_actor_b, v_profile_a, v_profile_b
  )
  on conflict (actor_a_id, actor_b_id) do update
    set updated_at = now()
  returning id into v_thread_id;

  return v_thread_id;
end;
$$;

create or replace function public.get_dojo_sparring_thread(
  p_thread_id uuid,
  p_actor_id text
)
returns table (
  id uuid,
  peer_profile_id uuid,
  peer_nickname text,
  peer_weight_class text,
  peer_area text,
  peer_meet_when text,
  last_message_at timestamptz,
  last_message_preview text,
  last_sender_actor_id text,
  my_last_read_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    thread.id,
    case when p_actor_id = thread.actor_a_id then peer_b.id else peer_a.id end,
    case when p_actor_id = thread.actor_a_id then peer_b.nickname else peer_a.nickname end,
    case when p_actor_id = thread.actor_a_id then peer_b.weight_class else peer_a.weight_class end,
    case when p_actor_id = thread.actor_a_id then peer_b.area else peer_a.area end,
    case when p_actor_id = thread.actor_a_id then peer_b.meet_when else peer_a.meet_when end,
    thread.last_message_at,
    thread.last_message_preview,
    thread.last_sender_actor_id,
    case
      when p_actor_id = thread.actor_a_id then thread.actor_a_last_read_at
      else thread.actor_b_last_read_at
    end,
    thread.created_at,
    thread.updated_at
  from public.dojo_sparring_threads thread
  join public.dojo_sparring_profiles peer_a on peer_a.id = thread.profile_a_id
  join public.dojo_sparring_profiles peer_b on peer_b.id = thread.profile_b_id
  where thread.id = p_thread_id
    and p_actor_id in (thread.actor_a_id, thread.actor_b_id)
    and exists (
      select 1 from public.dojo_sparring_interests
      where sender_actor_id = thread.actor_a_id
        and recipient_profile_id = thread.profile_b_id
    )
    and exists (
      select 1 from public.dojo_sparring_interests
      where sender_actor_id = thread.actor_b_id
        and recipient_profile_id = thread.profile_a_id
    )
  limit 1;
$$;

create or replace function public.list_dojo_sparring_messages(
  p_thread_id uuid,
  p_actor_id text
)
returns setof public.dojo_sparring_messages
language sql
security definer
set search_path = public
as $$
  select message.*
  from public.dojo_sparring_messages message
  join public.dojo_sparring_threads thread on thread.id = message.thread_id
  where message.thread_id = p_thread_id
    and p_actor_id in (thread.actor_a_id, thread.actor_b_id)
    and exists (
      select 1 from public.dojo_sparring_interests
      where sender_actor_id = thread.actor_a_id
        and recipient_profile_id = thread.profile_b_id
    )
    and exists (
      select 1 from public.dojo_sparring_interests
      where sender_actor_id = thread.actor_b_id
        and recipient_profile_id = thread.profile_a_id
    )
  order by message.created_at asc
  limit 120;
$$;

create or replace function public.send_dojo_sparring_chat_message(
  p_thread_id uuid,
  p_sender_actor_id text,
  p_sender_nickname text,
  p_body text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_thread public.dojo_sparring_threads%rowtype;
  v_message_id uuid;
  v_body text := trim(coalesce(p_body, ''));
begin
  if p_thread_id is null
    or length(trim(coalesce(p_sender_actor_id, ''))) < 20
    or length(v_body) = 0
    or length(v_body) > 500
  then
    return null;
  end if;

  select * into v_thread
  from public.dojo_sparring_threads
  where id = p_thread_id
    and p_sender_actor_id in (actor_a_id, actor_b_id);

  if not found
    or not exists (
      select 1 from public.dojo_sparring_interests
      where sender_actor_id = v_thread.actor_a_id
        and recipient_profile_id = v_thread.profile_b_id
    )
    or not exists (
      select 1 from public.dojo_sparring_interests
      where sender_actor_id = v_thread.actor_b_id
        and recipient_profile_id = v_thread.profile_a_id
    )
  then
    return null;
  end if;

  insert into public.dojo_sparring_messages (
    thread_id, sender_actor_id, sender_nickname, body
  ) values (
    p_thread_id,
    p_sender_actor_id,
    left(trim(coalesce(p_sender_nickname, '복서')), 24),
    v_body
  )
  returning id into v_message_id;

  update public.dojo_sparring_threads
  set
    last_message_at = now(),
    last_message_preview = left(v_body, 80),
    last_sender_actor_id = p_sender_actor_id,
    updated_at = now()
  where id = p_thread_id;

  return v_message_id;
end;
$$;

create or replace function public.mark_dojo_sparring_thread_read(
  p_thread_id uuid,
  p_actor_id text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.dojo_sparring_threads
  set
    actor_a_last_read_at = case when actor_a_id = p_actor_id then now() else actor_a_last_read_at end,
    actor_b_last_read_at = case when actor_b_id = p_actor_id then now() else actor_b_last_read_at end
  where id = p_thread_id
    and p_actor_id in (actor_a_id, actor_b_id);
  return found;
end;
$$;

revoke all on function public.open_dojo_sparring_chat(text, uuid) from public;
revoke all on function public.get_dojo_sparring_thread(uuid, text) from public;
revoke all on function public.list_dojo_sparring_messages(uuid, text) from public;
revoke all on function public.send_dojo_sparring_chat_message(uuid, text, text, text) from public;
revoke all on function public.mark_dojo_sparring_thread_read(uuid, text) from public;

grant execute on function public.open_dojo_sparring_chat(text, uuid) to anon, authenticated;
grant execute on function public.get_dojo_sparring_thread(uuid, text) to anon, authenticated;
grant execute on function public.list_dojo_sparring_messages(uuid, text) to anon, authenticated;
grant execute on function public.send_dojo_sparring_chat_message(uuid, text, text, text) to anon, authenticated;
grant execute on function public.mark_dojo_sparring_thread_read(uuid, text) to anon, authenticated;
