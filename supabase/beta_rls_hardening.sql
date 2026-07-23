-- ANIMA 공개 베타 최소 권한 패치
-- 전제: dojo_gym_listings_manage.sql, dojo_exchange.sql,
--       dojo_inquiry_chat.sql, dojo_inquiry_chat_inbox.sql 적용 후 마지막 실행
--
-- 주의: 베타는 아직 Supabase Auth가 아니라 기기 actor UUID를 사용한다.
-- 이 패치는 무차별 테이블 수정/열람을 막지만, 유료 운영 전에는 관장 Auth로 교체해야 한다.

-- 1) 입점: 직접 update/delete 금지, actor UUID를 확인하는 RPC만 허용
drop policy if exists "Public update gym listings" on public.dojo_gym_listings;
drop policy if exists "Public delete gym listings" on public.dojo_gym_listings;

create or replace function public.update_my_dojo_gym_listing(
  p_listing_id uuid,
  p_actor_id text,
  p_patch jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_listing_id is null
    or length(trim(coalesce(p_actor_id, ''))) < 20
    or p_patch is null
  then
    return false;
  end if;

  update public.dojo_gym_listings
  set
    gym_name = coalesce(nullif(trim(p_patch->>'gym_name'), ''), gym_name),
    owner_name = case when p_patch ? 'owner_name' then coalesce(p_patch->>'owner_name', '') else owner_name end,
    phone = coalesce(nullif(trim(p_patch->>'phone'), ''), phone),
    address = coalesce(nullif(trim(p_patch->>'address'), ''), address),
    address_detail = case when p_patch ? 'address_detail' then coalesce(p_patch->>'address_detail', '') else address_detail end,
    latitude = case when p_patch ? 'latitude' then nullif(p_patch->>'latitude', '')::double precision else latitude end,
    longitude = case when p_patch ? 'longitude' then nullif(p_patch->>'longitude', '')::double precision else longitude end,
    intro = case when p_patch ? 'intro' then coalesce(p_patch->>'intro', '') else intro end,
    area_label = case when p_patch ? 'area_label' then coalesce(p_patch->>'area_label', '') else area_label end,
    day_pass_won = case when p_patch ? 'day_pass_won' then nullif(p_patch->>'day_pass_won', '')::integer else day_pass_won end,
    month_pass_won = case when p_patch ? 'month_pass_won' then nullif(p_patch->>'month_pass_won', '')::integer else month_pass_won end,
    rental_hour_won = case when p_patch ? 'rental_hour_won' then nullif(p_patch->>'rental_hour_won', '')::integer else rental_hour_won end,
    photo_url = case when p_patch ? 'photo_url' then coalesce(p_patch->>'photo_url', '') else photo_url end,
    photo_urls = case
      when p_patch ? 'photo_urls' and jsonb_typeof(p_patch->'photo_urls') = 'array'
      then array(select jsonb_array_elements_text(p_patch->'photo_urls'))
      else photo_urls
    end,
    applicant_nickname = case when p_patch ? 'applicant_nickname' then coalesce(p_patch->>'applicant_nickname', '') else applicant_nickname end
  where id = p_listing_id
    and applicant_actor_id = p_actor_id;

  return found;
end;
$$;

create or replace function public.delete_my_dojo_gym_listing(
  p_listing_id uuid,
  p_actor_id text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_listing_id is null or length(trim(coalesce(p_actor_id, ''))) < 20 then
    return false;
  end if;

  delete from public.dojo_gym_listings
  where id = p_listing_id
    and applicant_actor_id = p_actor_id;

  return found;
end;
$$;

revoke all on function public.update_my_dojo_gym_listing(uuid, text, jsonb) from public;
revoke all on function public.delete_my_dojo_gym_listing(uuid, text) from public;
grant execute on function public.update_my_dojo_gym_listing(uuid, text, jsonb) to anon, authenticated;
grant execute on function public.delete_my_dojo_gym_listing(uuid, text) to anon, authenticated;

-- 2) 교류: 타인 일정 직접 수정/삭제 금지
drop policy if exists "Public update exchange events" on public.dojo_exchange_events;
drop policy if exists "Public delete exchange events" on public.dojo_exchange_events;

create or replace function public.delete_my_dojo_exchange_event(
  p_event_id uuid,
  p_actor_id text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_event_id is null or length(trim(coalesce(p_actor_id, ''))) < 20 then
    return false;
  end if;

  delete from public.dojo_exchange_events
  where id = p_event_id and user_id = p_actor_id;
  return found;
end;
$$;

revoke all on function public.delete_my_dojo_exchange_event(uuid, text) from public;
grant execute on function public.delete_my_dojo_exchange_event(uuid, text) to anon, authenticated;

-- 3) 문의 채팅: 전체 방/메시지 직접 열람·삽입 금지
drop policy if exists "Public read inquiry threads" on public.dojo_inquiry_threads;
drop policy if exists "Public insert inquiry threads" on public.dojo_inquiry_threads;
drop policy if exists "Public update inquiry threads" on public.dojo_inquiry_threads;
drop policy if exists "Public read inquiry messages" on public.dojo_inquiry_messages;
drop policy if exists "Public insert inquiry messages" on public.dojo_inquiry_messages;

create or replace function public.get_dojo_inquiry_thread(
  p_thread_id uuid,
  p_actor_id text
)
returns setof public.dojo_inquiry_threads
language sql
security definer
set search_path = public
as $$
  select *
  from public.dojo_inquiry_threads
  where id = p_thread_id
    and p_actor_id in (owner_actor_id, inquirer_actor_id)
  limit 1;
$$;

create or replace function public.list_dojo_inquiry_messages(
  p_thread_id uuid,
  p_actor_id text
)
returns setof public.dojo_inquiry_messages
language sql
security definer
set search_path = public
as $$
  select m.*
  from public.dojo_inquiry_messages m
  join public.dojo_inquiry_threads t on t.id = m.thread_id
  where m.thread_id = p_thread_id
    and p_actor_id in (t.owner_actor_id, t.inquirer_actor_id)
  order by m.created_at asc
  limit 120;
$$;

revoke all on function public.get_dojo_inquiry_thread(uuid, text) from public;
revoke all on function public.list_dojo_inquiry_messages(uuid, text) from public;
grant execute on function public.get_dojo_inquiry_thread(uuid, text) to anon, authenticated;
grant execute on function public.list_dojo_inquiry_messages(uuid, text) to anon, authenticated;
