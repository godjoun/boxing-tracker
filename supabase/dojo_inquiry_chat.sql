-- 문의 채팅 (당근식: 문의 1건 = 대화방 1개)
-- 한국어 저장명: 문의 채팅
-- 실시간(Realtime) 없음 · 앱에서 새로고침/짧은 폴링

create table if not exists public.dojo_inquiry_threads (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.dojo_gym_inquiries (id) on delete cascade,
  owner_actor_id text not null,
  inquirer_actor_id text not null,
  owner_nickname text not null default '',
  inquirer_nickname text not null default '',
  gym_name text not null default '',
  inquiry_label text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (inquiry_id)
);

create index if not exists dojo_inquiry_threads_owner_idx
  on public.dojo_inquiry_threads (owner_actor_id);

create index if not exists dojo_inquiry_threads_inquirer_idx
  on public.dojo_inquiry_threads (inquirer_actor_id);

create table if not exists public.dojo_inquiry_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.dojo_inquiry_threads (id) on delete cascade,
  sender_actor_id text not null,
  sender_nickname text not null default '',
  body text not null,
  created_at timestamptz not null default now(),
  check (char_length(trim(body)) > 0),
  check (char_length(body) <= 500)
);

create index if not exists dojo_inquiry_messages_thread_idx
  on public.dojo_inquiry_messages (thread_id, created_at);

alter table public.dojo_inquiry_threads enable row level security;
alter table public.dojo_inquiry_messages enable row level security;

drop policy if exists "Public read inquiry threads" on public.dojo_inquiry_threads;
create policy "Public read inquiry threads"
  on public.dojo_inquiry_threads for select to anon, authenticated
  using (true);

drop policy if exists "Public insert inquiry threads" on public.dojo_inquiry_threads;
create policy "Public insert inquiry threads"
  on public.dojo_inquiry_threads for insert to anon, authenticated
  with check (true);

drop policy if exists "Public update inquiry threads" on public.dojo_inquiry_threads;
create policy "Public update inquiry threads"
  on public.dojo_inquiry_threads for update to anon, authenticated
  using (true) with check (true);

drop policy if exists "Public read inquiry messages" on public.dojo_inquiry_messages;
create policy "Public read inquiry messages"
  on public.dojo_inquiry_messages for select to anon, authenticated
  using (true);

drop policy if exists "Public insert inquiry messages" on public.dojo_inquiry_messages;
create policy "Public insert inquiry messages"
  on public.dojo_inquiry_messages for insert to anon, authenticated
  with check (true);

-- 내가 보낸 문의
create or replace function public.list_dojo_gym_inquiries_for_sender(p_actor_id text)
returns setof public.dojo_gym_inquiries
language sql
security definer
set search_path = public
as $$
  select *
  from public.dojo_gym_inquiries
  where p_actor_id is not null
    and length(trim(p_actor_id)) > 0
    and user_id = p_actor_id
  order by created_at desc
  limit 80;
$$;

revoke all on function public.list_dojo_gym_inquiries_for_sender(text) from public;
grant execute on function public.list_dojo_gym_inquiries_for_sender(text) to anon, authenticated;

-- 대화방 열기 (없으면 생성). 관장 actor는 입점 행에서 찾음.
create or replace function public.open_dojo_inquiry_chat(
  p_inquiry_id uuid,
  p_actor_id text,
  p_nickname text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inquiry public.dojo_gym_inquiries%rowtype;
  v_owner text;
  v_owner_nick text;
  v_inquirer text;
  v_inquirer_nick text;
  v_label text;
  v_id uuid;
begin
  if p_inquiry_id is null
    or p_actor_id is null
    or length(trim(p_actor_id)) = 0
  then
    return null;
  end if;

  select * into v_inquiry
  from public.dojo_gym_inquiries
  where id = p_inquiry_id;

  if not found then
    return null;
  end if;

  select l.applicant_actor_id, coalesce(nullif(l.applicant_nickname, ''), l.owner_name, l.gym_name)
    into v_owner, v_owner_nick
  from public.dojo_gym_listings l
  where l.id::text = v_inquiry.gym_id
  limit 1;

  if v_owner is null or length(trim(v_owner)) = 0 then
    return null;
  end if;

  v_inquirer := coalesce(nullif(trim(v_inquiry.user_id), ''), '');
  if length(v_inquirer) = 0 then
    return null;
  end if;

  -- 당사자만 (같은 기기 테스트도 허용)
  if p_actor_id <> v_owner and p_actor_id <> v_inquirer then
    return null;
  end if;

  v_inquirer_nick := coalesce(nullif(v_inquiry.nickname, ''), '문의자');
  if p_actor_id = v_owner and length(trim(coalesce(p_nickname, ''))) > 0 then
    v_owner_nick := p_nickname;
  end if;
  if p_actor_id = v_inquirer and length(trim(coalesce(p_nickname, ''))) > 0 then
    v_inquirer_nick := p_nickname;
  end if;

  v_label := case v_inquiry.kind
    when 'rental' then '대여'
    when 'reservation' then '예약'
    else '체험'
  end;

  select id into v_id
  from public.dojo_inquiry_threads
  where inquiry_id = p_inquiry_id;

  if v_id is not null then
    update public.dojo_inquiry_threads
    set
      owner_nickname = case when p_actor_id = v_owner then v_owner_nick else owner_nickname end,
      inquirer_nickname = case when p_actor_id = v_inquirer then v_inquirer_nick else inquirer_nickname end,
      updated_at = now()
    where id = v_id;
    return v_id;
  end if;

  insert into public.dojo_inquiry_threads (
    inquiry_id,
    owner_actor_id,
    inquirer_actor_id,
    owner_nickname,
    inquirer_nickname,
    gym_name,
    inquiry_label
  ) values (
    p_inquiry_id,
    v_owner,
    v_inquirer,
    coalesce(v_owner_nick, '관장'),
    v_inquirer_nick,
    v_inquiry.gym_name,
    v_label
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.open_dojo_inquiry_chat(uuid, text, text) from public;
grant execute on function public.open_dojo_inquiry_chat(uuid, text, text) to anon, authenticated;

create or replace function public.send_dojo_inquiry_chat_message(
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
  v_thread public.dojo_inquiry_threads%rowtype;
  v_id uuid;
  v_body text;
begin
  v_body := trim(coalesce(p_body, ''));
  if p_thread_id is null
    or p_sender_actor_id is null
    or length(trim(p_sender_actor_id)) = 0
    or length(v_body) = 0
    or length(v_body) > 500
  then
    return null;
  end if;

  select * into v_thread
  from public.dojo_inquiry_threads
  where id = p_thread_id;

  if not found then
    return null;
  end if;

  if p_sender_actor_id <> v_thread.owner_actor_id
    and p_sender_actor_id <> v_thread.inquirer_actor_id
  then
    return null;
  end if;

  insert into public.dojo_inquiry_messages (
    thread_id,
    sender_actor_id,
    sender_nickname,
    body
  ) values (
    p_thread_id,
    p_sender_actor_id,
    coalesce(nullif(trim(p_sender_nickname), ''), '나'),
    v_body
  )
  returning id into v_id;

  update public.dojo_inquiry_threads
  set updated_at = now()
  where id = p_thread_id;

  return v_id;
end;
$$;

revoke all on function public.send_dojo_inquiry_chat_message(uuid, text, text, text) from public;
grant execute on function public.send_dojo_inquiry_chat_message(uuid, text, text, text) to anon, authenticated;
