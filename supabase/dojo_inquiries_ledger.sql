-- 관장 최소 장부: 내 입점관으로 온 문의만 조회
-- 이미 dojo_gym_inquiries · dojo_gym_listings 있는 경우 이 파일만 실행

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
