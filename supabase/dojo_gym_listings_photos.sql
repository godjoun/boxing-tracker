-- 체육관 시설 사진 최대 5장 + Storage 버킷
-- 한국어 저장명: 입점 사진 여러 장
-- 전제: dojo_gym_listings 테이블 있음
-- 앱 CSP: img-src 에 https: 필요 (index.html)

alter table public.dojo_gym_listings
  add column if not exists photo_url text not null default '',
  add column if not exists photo_urls text[] not null default '{}';

-- 기존 대표 사진 → 배열로 채움 (비어 있을 때만)
update public.dojo_gym_listings
set photo_urls = array[photo_url]
where coalesce(array_length(photo_urls, 1), 0) = 0
  and length(trim(photo_url)) > 0;

-- 공개 사진 버킷 (없으면 생성)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gym-photos',
  'gym-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update
set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

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

drop policy if exists "Public delete gym photos" on storage.objects;
create policy "Public delete gym photos"
  on storage.objects for delete to anon, authenticated
  using (bucket_id = 'gym-photos');
