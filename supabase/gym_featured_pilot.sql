-- 2주 체육관 추천 노출 파일럿
-- 결제/구독 기능 없음. 추천 여부와 문의 출처만 기록한다.

alter table public.dojo_gym_inquiries
  add column if not exists acquisition_source text not null default 'organic'
  check (acquisition_source in ('featured', 'organic'));

create index if not exists dojo_gym_inquiries_pilot_source_idx
  on public.dojo_gym_inquiries (gym_id, acquisition_source, created_at);

-- Supabase SQL Editor에서만 확인하는 운영용 집계
create or replace view public.dojo_featured_pilot_inquiry_metrics
with (security_invoker = true)
as
select
  l.id as gym_id,
  l.gym_name,
  l.is_featured,
  i.acquisition_source,
  date_trunc('week', i.created_at) as week_started_at,
  count(i.id) as inquiry_count,
  count(i.id) filter (
    where length(trim(i.contact)) >= 5
  ) as valid_inquiry_count
from public.dojo_gym_listings l
left join public.dojo_gym_inquiries i on i.gym_id = l.id::text
group by
  l.id,
  l.gym_name,
  l.is_featured,
  i.acquisition_source,
  date_trunc('week', i.created_at);

revoke all on public.dojo_featured_pilot_inquiry_metrics from anon, authenticated;
