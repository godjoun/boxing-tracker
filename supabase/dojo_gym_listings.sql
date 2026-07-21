-- Supabase SQL Editor에서 실행
-- 체육관 입점(등록) 신청 1차 — 승인·사업자 검증은 나중 (대시보드에서 확인)

create table if not exists public.dojo_gym_listings (
  id uuid primary key default gen_random_uuid(),
  gym_name text not null,
  owner_name text not null default '',
  phone text not null,
  address text not null,
  address_detail text not null default '',
  intro text not null default '',
  area_label text not null default '',
  day_pass_won integer check (day_pass_won is null or day_pass_won >= 0),
  month_pass_won integer check (month_pass_won is null or month_pass_won >= 0),
  rental_hour_won integer check (rental_hour_won is null or rental_hour_won >= 0),
  applicant_actor_id text,
  applicant_nickname text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  source text not null default 'app',
  created_at timestamptz not null default now()
);

create index if not exists dojo_gym_listings_created_at_idx
  on public.dojo_gym_listings (created_at desc);

create index if not exists dojo_gym_listings_status_idx
  on public.dojo_gym_listings (status);

alter table public.dojo_gym_listings enable row level security;

drop policy if exists "Public insert gym listings" on public.dojo_gym_listings;
create policy "Public insert gym listings"
  on public.dojo_gym_listings for insert to anon, authenticated
  with check (true);

-- 열람은 대시보드(service). anon select 없음 = 사업자 정보 보호
drop policy if exists "Public read gym listings" on public.dojo_gym_listings;
drop policy if exists "Public read own gym listings" on public.dojo_gym_listings;
