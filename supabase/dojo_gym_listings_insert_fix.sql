-- 앱에서 등록했는데 Table Editor에 안 뜰 때 이 파일만 실행
-- 원인: insert RLS 정책이 없어서 anon 키로 저장이 막힘
-- (증상: "new row violates row-level security policy")

-- 공개 insert (anon 키로 앱에서 신청)
drop policy if exists "Public insert gym listings" on public.dojo_gym_listings;
create policy "Public insert gym listings"
  on public.dojo_gym_listings for insert to anon, authenticated
  with check (true);

-- 컬럼이 없으면 추가 (구버전 테이블 대비)
alter table public.dojo_gym_listings
  add column if not exists photo_url text not null default '';

alter table public.dojo_gym_listings
  add column if not exists is_featured boolean not null default false;

alter table public.dojo_gym_listings
  add column if not exists source text not null default 'app';

-- 내 신청 목록 RPC도 없으면 같이 준비 (입점관리)
create or replace function public.list_my_dojo_gym_listings(p_actor_id text)
returns setof public.dojo_gym_listings
language sql
security definer
set search_path = public
as $$
  select *
  from public.dojo_gym_listings
  where p_actor_id is not null
    and length(trim(p_actor_id)) > 0
    and applicant_actor_id = p_actor_id
  order by created_at desc
  limit 40;
$$;

revoke all on function public.list_my_dojo_gym_listings(text) from public;
grant execute on function public.list_my_dojo_gym_listings(text) to anon, authenticated;
