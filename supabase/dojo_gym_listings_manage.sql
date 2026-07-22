-- 이미 dojo_gym_listings 있는 경우 이 파일만 실행
-- 입점 다듬기: 사진 · 수정 · 삭제 (관 계정 전까지 MVP)

alter table public.dojo_gym_listings
  add column if not exists photo_url text not null default '';

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
