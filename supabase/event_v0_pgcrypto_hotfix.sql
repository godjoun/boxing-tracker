-- EVENT v0 pgcrypto hotfix — Supabase extensions schema
-- Production DB에 event_v0.sql 적용 후 gen_salt/crypt 오류가 날 때 이 파일만 Run.
-- 테이블/데이터/RLS 변경 없음. 관련 FUNCTION 2개만 CREATE OR REPLACE.
--
-- 전제: pgcrypto가 없으면 아래 한 줄만 먼저 실행 (IF NOT EXISTS · 기존 설치 유지)
--   create extension if not exists pgcrypto with schema extensions;

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

revoke all on function public.event_v0_set_operator_secret_hash(text, text)
  from public, anon, authenticated;
