-- 문의 채팅 다듬기: 마지막 말 · 읽음 · 대화 목록
-- 한국어 저장명: 문의 채팅 인박스
-- 전제: dojo_inquiry_chat.sql 이미 실행됨
-- 푸시·Realtime 없음

alter table public.dojo_inquiry_threads
  add column if not exists last_message_at timestamptz,
  add column if not exists last_message_preview text not null default '',
  add column if not exists last_sender_actor_id text not null default '',
  add column if not exists owner_last_read_at timestamptz,
  add column if not exists inquirer_last_read_at timestamptz;

create index if not exists dojo_inquiry_threads_last_msg_idx
  on public.dojo_inquiry_threads (last_message_at desc nulls last);

-- 보내기: 미리보기·보낸이·읽음(본인) 갱신
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
  v_preview text;
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

  v_preview := left(v_body, 80);

  update public.dojo_inquiry_threads
  set
    updated_at = now(),
    last_message_at = now(),
    last_message_preview = v_preview,
    last_sender_actor_id = p_sender_actor_id,
    owner_last_read_at = case
      when p_sender_actor_id = owner_actor_id then now()
      else owner_last_read_at
    end,
    inquirer_last_read_at = case
      when p_sender_actor_id = inquirer_actor_id then now()
      else inquirer_last_read_at
    end
  where id = p_thread_id;

  return v_id;
end;
$$;

revoke all on function public.send_dojo_inquiry_chat_message(uuid, text, text, text) from public;
grant execute on function public.send_dojo_inquiry_chat_message(uuid, text, text, text) to anon, authenticated;

-- 대화방 읽음 처리
create or replace function public.mark_dojo_inquiry_thread_read(
  p_thread_id uuid,
  p_actor_id text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_thread public.dojo_inquiry_threads%rowtype;
begin
  if p_thread_id is null
    or p_actor_id is null
    or length(trim(p_actor_id)) = 0
  then
    return false;
  end if;

  select * into v_thread
  from public.dojo_inquiry_threads
  where id = p_thread_id;

  if not found then
    return false;
  end if;

  if p_actor_id <> v_thread.owner_actor_id
    and p_actor_id <> v_thread.inquirer_actor_id
  then
    return false;
  end if;

  update public.dojo_inquiry_threads
  set
    owner_last_read_at = case
      when p_actor_id = owner_actor_id then now()
      else owner_last_read_at
    end,
    inquirer_last_read_at = case
      when p_actor_id = inquirer_actor_id then now()
      else inquirer_last_read_at
    end
  where id = p_thread_id;

  return true;
end;
$$;

revoke all on function public.mark_dojo_inquiry_thread_read(uuid, text) from public;
grant execute on function public.mark_dojo_inquiry_thread_read(uuid, text) to anon, authenticated;

-- 내 대화 목록 (관장·문의자 공통)
create or replace function public.list_dojo_inquiry_threads_for_actor(p_actor_id text)
returns setof public.dojo_inquiry_threads
language sql
security definer
set search_path = public
as $$
  select *
  from public.dojo_inquiry_threads
  where p_actor_id is not null
    and length(trim(p_actor_id)) > 0
    and (
      owner_actor_id = p_actor_id
      or inquirer_actor_id = p_actor_id
    )
  order by coalesce(last_message_at, updated_at) desc
  limit 80;
$$;

revoke all on function public.list_dojo_inquiry_threads_for_actor(text) from public;
grant execute on function public.list_dojo_inquiry_threads_for_actor(text) to anon, authenticated;
