-- 이미 dojo_gym_listings 있는 경우 이 파일만 실행
-- 입점 다듬기: 사진 · 수정 · 삭제 · insert 막힘 고침 (관 계정 전까지 MVP)

alter table public.dojo_gym_listings
  add column if not exists photo_url text not null default '';

alter table public.dojo_gym_listings
  add column if not exists is_featured boolean not null default false;

alter table public.dojo_gym_listings
  add column if not exists source text not null default 'app';

alter table public.dojo_gym_listings
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'dojo_gym_listings_latitude_check'
  ) then
    alter table public.dojo_gym_listings
      add constraint dojo_gym_listings_latitude_check
      check (latitude is null or latitude between 33 and 39);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'dojo_gym_listings_longitude_check'
  ) then
    alter table public.dojo_gym_listings
      add constraint dojo_gym_listings_longitude_check
      check (longitude is null or longitude between 124 and 132);
  end if;
end
$$;

-- 공개 insert (anon 키로 앱에서 신청이 막힐 때)
drop policy if exists "Public insert gym listings" on public.dojo_gym_listings;
create policy "Public insert gym listings"
  on public.dojo_gym_listings for insert to anon, authenticated
  with check (true);

-- 수정: 클라이언트가 id + applicant_actor_id 로 좁혀서 호출
drop policy if exists "Public update gym listings" on public.dojo_gym_listings;
create policy "Public update gym listings"
  on public.dojo_gym_listings for update to anon, authenticated
  using (true)
  with check (true);

-- 삭제
drop policy if exists "Public delete gym listings" on public.dojo_gym_listings;
create policy "Public delete gym listings"
  on public.dojo_gym_listings for delete to anon, authenticated
  using (true);

-- 내 신청 목록 (actor_id로) — pending 포함, 타인 전화 노출 방지용 RPC
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

-- 사진 버킷 (없으면 생성)
insert into storage.buckets (id, name, public)
values ('gym-photos', 'gym-photos', true)
on conflict (id) do nothing;

drop policy if exists "Public read gym photos" on storage.objects;
create policy "Public read gym photos"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'gym-photos');

drop policy if exists "Public upload gym photos" on storage.objects;
create policy "Public upload gym photos"
  on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'gym-photos');

drop policy if exists "Public update gym photos" on storage.objects;
create policy "Public update gym photos"
  on storage.objects for update to anon, authenticated
  using (bucket_id = 'gym-photos')
  with check (bucket_id = 'gym-photos');
