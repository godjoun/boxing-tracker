-- EVENT v0 — field display order (skip cancelled; keep internal order_number)
-- Supabase SQL Editor에서 이 파일만 Run.
--
-- 데이터 DELETE / order_number UPDATE 없음.
-- cancelled pairing / pairing_history 보존.
-- 참가자 RLS로는 전체 pairings를 셀 수 없어 SECURITY DEFINER 헬퍼 필요.
--
-- display = order_number - count(cancelled with order_number <= target)

create or replace function public.event_v0_pairing_display_order(
  p_event_id text,
  p_order_number integer
)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select greatest(
    coalesce(p_order_number, 0) - (
      select count(*)::integer
      from public.pairings p
      where p.event_id = trim(p_event_id)
        and p.status = 'cancelled'
        and p.order_number <= p_order_number
    ),
    1
  );
$$;

revoke all on function public.event_v0_pairing_display_order(text, integer)
  from public, anon;
grant execute on function public.event_v0_pairing_display_order(text, integer)
  to authenticated;

-- Include display_order in participant pairing payload (same formula).
-- RETURNS TABLE shape changed → must DROP before CREATE.
drop function if exists public.event_v0_get_my_pairings(text);

create function public.event_v0_get_my_pairings(p_event_id text)
returns table (
  pairing_id uuid,
  order_number integer,
  display_order integer,
  pairing_status text,
  my_participant_id uuid,
  opponent_participant_id uuid,
  opponent_display_name text,
  opponent_gym_name text,
  opponent_weight_kg numeric,
  opponent_experience text,
  created_at timestamptz,
  completed_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  with me as (
    select ep.id as participant_id
    from public.event_participants ep
    where ep.event_id = trim(p_event_id)
      and ep.user_id = auth.uid()
    limit 1
  )
  select
    p.id as pairing_id,
    p.order_number,
    public.event_v0_pairing_display_order(trim(p_event_id), p.order_number)
      as display_order,
    p.status as pairing_status,
    me.participant_id as my_participant_id,
    case
      when p.participant_a_id = me.participant_id then p.participant_b_id
      else p.participant_a_id
    end as opponent_participant_id,
    opp.display_name as opponent_display_name,
    opp.gym_name as opponent_gym_name,
    opp.weight_kg as opponent_weight_kg,
    opp.experience as opponent_experience,
    p.created_at,
    p.completed_at
  from me
  join public.pairings p
    on p.event_id = trim(p_event_id)
   and me.participant_id in (p.participant_a_id, p.participant_b_id)
  join public.event_participants opp
    on opp.id = case
      when p.participant_a_id = me.participant_id then p.participant_b_id
      else p.participant_a_id
    end
  where p.status = 'active'
  order by p.order_number asc;
$$;

grant execute on function public.event_v0_get_my_pairings(text) to authenticated;
revoke execute on function public.event_v0_get_my_pairings(text) from anon;
