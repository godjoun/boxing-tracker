-- Supabase SQL Editor에서 실행
-- 체육관 문의 리드 (계산대 1차: 서버에 쌓기)
-- 체육관 계정·알림은 아직 없음. 대시보드 Table에서 확인.

create table if not exists public.dojo_gym_inquiries (
  id uuid primary key default gen_random_uuid(),
  gym_id text not null default 'general',
  gym_name text not null,
  kind text not null check (kind in ('trial', 'rental')),
  contact text not null,
  preferred_date text not null default '',
  memo text not null default '',
  party_size integer,
  hours integer,
  user_id text,
  nickname text not null default '',
  source text not null default 'app',
  created_at timestamptz not null default now()
);

create index if not exists dojo_gym_inquiries_created_at_idx
  on public.dojo_gym_inquiries (created_at desc);

create index if not exists dojo_gym_inquiries_gym_id_idx
  on public.dojo_gym_inquiries (gym_id);

alter table public.dojo_gym_inquiries enable row level security;

-- 소프트 론칭: 문의 insert만. 열람은 대시보드(service role).
drop policy if exists "Public insert gym inquiries" on public.dojo_gym_inquiries;
create policy "Public insert gym inquiries"
  on public.dojo_gym_inquiries for insert to anon, authenticated
  with check (true);

drop policy if exists "Public read own gym inquiries" on public.dojo_gym_inquiries;
drop policy if exists "Public read gym inquiries" on public.dojo_gym_inquiries;
-- select 정책 없음 = anon/authenticated는 목록 조회 불가 (연락처 보호)
