-- Product Funnel Analytics (최소)
-- Supabase SQL Editor에서 이 파일만 Run.
-- 기존 dojo_* / exchange / community 테이블·정책과 무관 — 덮어쓰지 않음.
--
-- 목적: 핵심 행동 5개만 집계용으로 기록. PII·user·JSON payload 없음.
-- 클라이언트: INSERT만. SELECT/UPDATE/DELETE는 SQL Editor(서비스 롤)에서만.

create table if not exists public.product_funnel_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  created_at timestamptz not null default now(),
  constraint product_funnel_events_name_allowed check (
    event_name in (
      'app_open',
      'training_start',
      'training_complete',
      'training_card_create',
      'profile_view'
    )
  )
);

create index if not exists product_funnel_events_created_at_idx
  on public.product_funnel_events (created_at);

create index if not exists product_funnel_events_event_name_idx
  on public.product_funnel_events (event_name);

alter table public.product_funnel_events enable row level security;

drop policy if exists "product_funnel_events_insert_anon"
  on public.product_funnel_events;
drop policy if exists "product_funnel_events_insert_authenticated"
  on public.product_funnel_events;

-- INSERT only. No SELECT / UPDATE / DELETE policies for clients.
create policy "product_funnel_events_insert_anon"
  on public.product_funnel_events
  for insert
  to anon
  with check (true);

create policy "product_funnel_events_insert_authenticated"
  on public.product_funnel_events
  for insert
  to authenticated
  with check (true);

revoke all on table public.product_funnel_events from public;
revoke all on table public.product_funnel_events from anon;
revoke all on table public.product_funnel_events from authenticated;
grant insert on table public.product_funnel_events to anon;
grant insert on table public.product_funnel_events to authenticated;

-- ---------------------------------------------------------------------------
-- SQL Editor 집계 예시 (대시보드 UI 없음 — 여기서만 조회)
-- ---------------------------------------------------------------------------

-- 1) 최근 7일 이벤트별 횟수
-- select event_name, count(*) as n
-- from public.product_funnel_events
-- where created_at >= now() - interval '7 days'
-- group by event_name
-- order by n desc;

-- 2) 날짜별 이벤트 횟수
-- select (created_at at time zone 'Asia/Seoul')::date as day_kst,
--        event_name,
--        count(*) as n
-- from public.product_funnel_events
-- group by 1, 2
-- order by 1 desc, 2;

-- 3) 전체 이벤트별 횟수
-- select event_name, count(*) as n
-- from public.product_funnel_events
-- group by event_name
-- order by n desc;
