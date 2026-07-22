-- 문의하기가 서버에 안 쌓일 때 / 받은 문의가 비어 있을 때
-- 한국어 저장명: 문의 insert·장부 고침
-- (증상: RLS insert 막힘 · list_dojo_gym_inquiries_for_owner 없음)

-- 공개 insert
drop policy if exists "Public insert gym inquiries" on public.dojo_gym_inquiries;
create policy "Public insert gym inquiries"
  on public.dojo_gym_inquiries for insert to anon, authenticated
  with check (true);

-- 컬럼 보강 (구버전 대비)
alter table public.dojo_gym_inquiries
  add column if not exists experience text not null default '';

alter table public.dojo_gym_inquiries
  add column if not exists purpose text not null default '';

alter table public.dojo_gym_inquiries
  add column if not exists time_slot text not null default '';

-- 관장 「받은 문의」 RPC
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
