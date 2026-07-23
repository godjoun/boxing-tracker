-- Supabase SQL Editor에서 실행
-- 체육관 문의 리드 (계산대 1차: 서버에 쌓기)
-- 체육관 계정·알림은 아직 없음. 대시보드 Table에서 확인.

create table if not exists public.dojo_gym_inquiries (
  id uuid primary key default gen_random_uuid(),
  gym_id text not null default 'general',
  gym_name text not null,
  kind text not null check (kind in ('trial', 'rental', 'reservation')),
  contact text not null,
  preferred_date text not null default '',
  memo text not null default '',
  party_size integer,
  hours integer,
  experience text not null default '',
  purpose text not null default '',
  time_slot text not null default '',
  user_id text,
  nickname text not null default '',
  source text not null default 'app',
  created_at timestamptz not null default now()
);

-- 이미 만든 테이블용 업그레이드 (한 번 더 실행해도 됨)
alter table public.dojo_gym_inquiries
  drop constraint if exists dojo_gym_inquiries_kind_check;

alter table public.dojo_gym_inquiries
  add constraint dojo_gym_inquiries_kind_check
  check (kind in ('trial', 'rental', 'reservation'));

alter table public.dojo_gym_inquiries
  add column if not exists experience text not null default '';

alter table public.dojo_gym_inquiries
  add column if not exists purpose text not null default '';

alter table public.dojo_gym_inquiries
  add column if not exists time_slot text not null default '';

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

-- 관장 「받은 문의」 (예전 dojo_inquiries_ledger.sql)
create or replace function public.list_dojo_gym_inquiries_for_owner(p_actor_id text)
returns setof public.dojo_gym_inquiries
language sql
security definer
set search_path = public
as $$
  select i.*
  from public.dojo_gym_inquiries i
  where p_actor_id is not null
    and length(trim(p_actor_id)) > 0
    and (
      i.gym_id in (
        select l.id::text
        from public.dojo_gym_listings l
        where l.applicant_actor_id = p_actor_id
      )
      or i.gym_name in (
        select l.gym_name
        from public.dojo_gym_listings l
        where l.applicant_actor_id = p_actor_id
      )
    )
  order by i.created_at desc
  limit 80;
$$;

revoke all on function public.list_dojo_gym_inquiries_for_owner(text) from public;
grant execute on function public.list_dojo_gym_inquiries_for_owner(text) to anon, authenticated;
