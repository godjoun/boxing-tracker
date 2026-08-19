BEGIN;

-- =============================================================================
-- LAUNCH 1 — dojo server lockdown
-- =============================================================================
-- 목적: 출시 1차에서 입점/문의/모임/DM/라이벌 서버 경로를
--       anon · authenticated 가 쓰지 못하게 한다.
--
-- 하지 않는 것:
--   - row 삭제 없음
--   - EVENT v0 (events / event_participants / sparring_requests /
--     pairings / pairing_history) 미변경
--   - product_funnel_events, fighter_nicknames 미변경
--
-- 방식: RLS 유지 + 기존 policy 전부 제거 + 테이블/RPC EXECUTE 회수.
--       정책이 없으면 anon/authenticated 는 해당 테이블에 접근할 수 없다.
--       service_role(SQL Editor)은 RLS를 우회하므로 운영 조회는 가능하다.
--
-- 아직 production 에서 실행하지 말 것. 운영자가 SQL Editor 에서 직접 Run.
-- 테이블/함수가 없는 프로젝트에서도 에러 없이 넘어간다.
--
-- 다시 켤 때: 원래 supabase/dojo_*.sql · beta_rls_hardening.sql 을
-- Auth/RLS 개선본으로 재적용한다.
-- =============================================================================

-- 1) 위험 테이블: RLS on, 모든 policy drop, client GRANT 회수
do $$
declare
  tbl text;
  pol record;
  tables text[] := array[
    'dojo_gym_listings',
    'dojo_gym_inquiries',
    'dojo_inquiry_threads',
    'dojo_inquiry_messages',
    'dojo_exchange_events',
    'dojo_exchange_applies',
    'dojo_chat_threads',
    'dojo_chat_messages',
    'dojo_sparring_profiles',
    'dojo_sparring_interests',
    'dojo_sparring_threads',
    'dojo_sparring_messages',
    'dojo_gym_exchange_participations'
  ];
begin
  foreach tbl in array tables loop
    if to_regclass('public.' || tbl) is null then
      continue;
    end if;

    execute format(
      'alter table public.%I enable row level security',
      tbl
    );

    for pol in
      select policyname
      from pg_policies
      where schemaname = 'public'
        and tablename = tbl
    loop
      execute format(
        'drop policy if exists %I on public.%I',
        pol.policyname,
        tbl
      );
    end loop;

    execute format(
      'revoke all on table public.%I from public, anon, authenticated',
      tbl
    );
  end loop;
end
$$;

-- 2) 위험 RPC: anon/authenticated/public EXECUTE 회수
do $$
declare
  sig text;
  oid oid;
  signatures text[] := array[
    'public.list_my_dojo_gym_listings(text)',
    'public.update_my_dojo_gym_listing(uuid, text, jsonb)',
    'public.delete_my_dojo_gym_listing(uuid, text)',
    'public.list_dojo_gym_inquiries_for_owner(text)',
    'public.list_dojo_gym_inquiries_for_sender(text)',
    'public.open_dojo_inquiry_chat(uuid, text, text)',
    'public.send_dojo_inquiry_chat_message(uuid, text, text, text)',
    'public.get_dojo_inquiry_thread(uuid, text)',
    'public.list_dojo_inquiry_messages(uuid, text)',
    'public.mark_dojo_inquiry_thread_read(uuid, text)',
    'public.list_dojo_inquiry_threads_for_actor(text)',
    'public.apply_dojo_exchange(uuid, text, text)',
    'public.cancel_dojo_exchange_apply(uuid, text)',
    'public.delete_my_dojo_exchange_event(uuid, text)',
    'public.open_dojo_chat_thread(uuid, text, text, text, text, text, text)',
    'public.send_dojo_chat_message(uuid, text, text, text)',
    'public.list_dojo_sparring_profiles(text, text, text, text)',
    'public.get_my_dojo_sparring_profile(text)',
    'public.upsert_my_dojo_sparring_profile(text, jsonb)',
    'public.delete_my_dojo_sparring_profile(text)',
    'public.send_dojo_sparring_interest(text, uuid)',
    'public.cancel_dojo_sparring_interest(text, uuid)',
    'public.list_my_dojo_sparring_interests(text)',
    'public.open_dojo_sparring_chat(text, uuid)',
    'public.get_dojo_sparring_thread(uuid, text)',
    'public.list_dojo_sparring_messages(uuid, text)',
    'public.send_dojo_sparring_chat_message(uuid, text, text, text)',
    'public.mark_dojo_sparring_thread_read(uuid, text)',
    'public.join_gym_exchange_participation(text, text, text)',
    'public.update_my_gym_exchange_sparring_rounds(text, integer)'
  ];
begin
  foreach sig in array signatures loop
    oid := to_regprocedure(sig);
    if oid is null then
      continue;
    end if;

    execute format(
      'revoke all on function %s from public, anon, authenticated',
      oid::regprocedure
    );
  end loop;
end
$$;

-- 2b) 시그니처가 달라도 dojo_* / gym_exchange RPC는 회수
--     event_v0_* 는 이름 규칙상 포함되지 않는다.
do $$
declare
  r record;
begin
  for r in
    select p.oid
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname not like 'event_v0_%'
      and (
        p.proname like '%dojo_%'
        or p.proname like '%gym_exchange%'
      )
  loop
    execute format(
      'revoke all on function %s from public, anon, authenticated',
      r.oid::regprocedure
    );
  end loop;
end
$$;

-- 3) gym-photos Storage: 공개 읽기/쓰기 정책 제거 (파일은 삭제하지 않음)
do $$
declare
  pol record;
begin
  if to_regclass('storage.objects') is null then
    return;
  end if;

  for pol in
    select policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and (
        coalesce(qual, '') ilike '%gym-photos%'
        or coalesce(with_check, '') ilike '%gym-photos%'
        or policyname ilike '%gym photo%'
      )
  loop
    execute format(
      'drop policy if exists %I on storage.objects',
      pol.policyname
    );
  end loop;

  if to_regclass('storage.buckets') is not null then
    update storage.buckets
    set public = false
    where id = 'gym-photos';
  end if;
end
$$;

COMMIT;
