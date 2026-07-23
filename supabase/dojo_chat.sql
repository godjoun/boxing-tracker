-- Supabase SQL Editor에서 실행
-- 모임 채팅 1차: 신청자 ↔ 주최자 DM (실시간 없음 · 새로고침으로 확인)

create table if not exists public.dojo_chat_threads (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.dojo_exchange_events (id) on delete cascade,
  host_actor_id text not null,
  applicant_actor_id text not null,
  host_nickname text not null default '',
  applicant_nickname text not null default '',
  gym_name text not null default '',
  event_label text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, host_actor_id, applicant_actor_id)
);

create index if not exists dojo_chat_threads_host_idx
  on public.dojo_chat_threads (host_actor_id);

create index if not exists dojo_chat_threads_applicant_idx
  on public.dojo_chat_threads (applicant_actor_id);

create index if not exists dojo_chat_threads_updated_idx
  on public.dojo_chat_threads (updated_at desc);

create table if not exists public.dojo_chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.dojo_chat_threads (id) on delete cascade,
  sender_actor_id text not null,
  sender_nickname text not null default '',
  body text not null,
  created_at timestamptz not null default now(),
  check (char_length(trim(body)) > 0),
  check (char_length(body) <= 500)
);

create index if not exists dojo_chat_messages_thread_idx
  on public.dojo_chat_messages (thread_id, created_at);

alter table public.dojo_chat_threads enable row level security;
alter table public.dojo_chat_messages enable row level security;

-- 소프트 론칭: 인증 전이라 열어 둠. auth 붙인 뒤 참가자만으로 강화.
drop policy if exists "Public read chat threads" on public.dojo_chat_threads;
create policy "Public read chat threads"
  on public.dojo_chat_threads for select to anon, authenticated
  using (true);

drop policy if exists "Public insert chat threads" on public.dojo_chat_threads;
create policy "Public insert chat threads"
  on public.dojo_chat_threads for insert to anon, authenticated
  with check (true);

drop policy if exists "Public update chat threads" on public.dojo_chat_threads;
create policy "Public update chat threads"
  on public.dojo_chat_threads for update to anon, authenticated
  using (true) with check (true);

drop policy if exists "Public read chat messages" on public.dojo_chat_messages;
create policy "Public read chat messages"
  on public.dojo_chat_messages for select to anon, authenticated
  using (true);

drop policy if exists "Public insert chat messages" on public.dojo_chat_messages;
create policy "Public insert chat messages"
  on public.dojo_chat_messages for insert to anon, authenticated
  with check (true);

create or replace function public.open_dojo_chat_thread(
  p_event_id uuid,
  p_host_actor_id text,
  p_applicant_actor_id text,
  p_host_nickname text,
  p_applicant_nickname text,
  p_gym_name text,
  p_event_label text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_event_id is null
    or p_host_actor_id is null
    or p_applicant_actor_id is null
    or length(trim(p_host_actor_id)) = 0
    or length(trim(p_applicant_actor_id)) = 0
    or p_host_actor_id = p_applicant_actor_id
  then
    return null;
  end if;

  select id into v_id
  from public.dojo_chat_threads
  where event_id = p_event_id
    and host_actor_id = p_host_actor_id
    and applicant_actor_id = p_applicant_actor_id;

  if found then
    update public.dojo_chat_threads
    set
      host_nickname = coalesce(nullif(trim(p_host_nickname), ''), host_nickname),
      applicant_nickname = coalesce(nullif(trim(p_applicant_nickname), ''), applicant_nickname),
      gym_name = coalesce(nullif(trim(p_gym_name), ''), gym_name),
      event_label = coalesce(nullif(trim(p_event_label), ''), event_label),
      updated_at = now()
    where id = v_id;
    return v_id;
  end if;

  insert into public.dojo_chat_threads (
    event_id,
    host_actor_id,
    applicant_actor_id,
    host_nickname,
    applicant_nickname,
    gym_name,
    event_label
  )
  values (
    p_event_id,
    p_host_actor_id,
    p_applicant_actor_id,
    coalesce(nullif(trim(p_host_nickname), ''), '주최자'),
    coalesce(nullif(trim(p_applicant_nickname), ''), '신청자'),
    coalesce(nullif(trim(p_gym_name), ''), ''),
    coalesce(nullif(trim(p_event_label), ''), '')
  )
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.send_dojo_chat_message(
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
  v_id uuid;
  v_body text;
begin
  v_body := trim(coalesce(p_body, ''));
  if p_thread_id is null
    or p_sender_actor_id is null
    or length(trim(p_sender_actor_id)) = 0
    or length(v_body) = 0
  then
    return null;
  end if;

  if not exists (
    select 1 from public.dojo_chat_threads
    where id = p_thread_id
      and (host_actor_id = p_sender_actor_id or applicant_actor_id = p_sender_actor_id)
  ) then
    return null;
  end if;

  insert into public.dojo_chat_messages (
    thread_id,
    sender_actor_id,
    sender_nickname,
    body
  )
  values (
    p_thread_id,
    p_sender_actor_id,
    coalesce(nullif(trim(p_sender_nickname), ''), '나'),
    left(v_body, 500)
  )
  returning id into v_id;

  update public.dojo_chat_threads
  set updated_at = now()
  where id = p_thread_id;

  return v_id;
end;
$$;

revoke all on function public.open_dojo_chat_thread(uuid, text, text, text, text, text, text) from public;
grant execute on function public.open_dojo_chat_thread(uuid, text, text, text, text, text, text) to anon, authenticated;

revoke all on function public.send_dojo_chat_message(uuid, text, text, text) from public;
grant execute on function public.send_dojo_chat_message(uuid, text, text, text) to anon, authenticated;
