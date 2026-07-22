-- 노출·추천 자리 1차 (과금 전: Table Editor에서 is_featured = true)
-- 이미 dojo_gym_listings 있는 경우 이 파일만 실행

alter table public.dojo_gym_listings
  add column if not exists is_featured boolean not null default false;

create index if not exists dojo_gym_listings_featured_idx
  on public.dojo_gym_listings (is_featured, status)
  where is_featured = true and status = 'approved';

-- 추천 켜기 예:
-- update public.dojo_gym_listings set is_featured = true where gym_name = '더삼복싱';
