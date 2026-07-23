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
  photo_url text not null default '',
  is_featured boolean not null default false,
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

create index if not exists dojo_gym_listings_featured_idx
  on public.dojo_gym_listings (is_featured, status)
  where is_featured = true and status = 'approved';

alter table public.dojo_gym_listings enable row level security;

drop policy if exists "Public insert gym listings" on public.dojo_gym_listings;
create policy "Public insert gym listings"
  on public.dojo_gym_listings for insert to anon, authenticated
  with check (true);

-- pending/rejected는 비공개. approved만 검색 노출용으로 읽기
drop policy if exists "Public read gym listings" on public.dojo_gym_listings;
drop policy if exists "Public read own gym listings" on public.dojo_gym_listings;
drop policy if exists "Public read approved gym listings" on public.dojo_gym_listings;
create policy "Public read approved gym listings"
  on public.dojo_gym_listings for select to anon, authenticated
  using (status = 'approved');

-- 승인(운영): Table Editor에서 status를 approved로 바꾸면 됨 (service role)
-- 예) update public.dojo_gym_listings set status = 'approved' where id = '...';
