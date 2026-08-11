-- EVENT v0 RLS recursion hotfix
-- Production DB에 event_v0.sql 적용 후
-- "infinite recursion detected in policy for relation event_participants"
-- 가 날 때 이 파일만 Run.
--
-- 테이블/데이터 DELETE·TRUNCATE·재생성 없음.
-- FUNCTION 추가 + SELECT policy 3개만 교체.

-- ---------------------------------------------------------------------------
-- Helpers (SECURITY DEFINER · bypass RLS · boolean only)
-- ---------------------------------------------------------------------------

-- True when auth.uid() owns this participant row.
create or replace function public.event_v0_is_my_participant(p_participant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.event_participants ep
    where ep.id = p_participant_id
      and ep.user_id = auth.uid()
  );
$$;

-- True when auth.uid() is in an active pairing with this participant
-- (as the other side — not self).
create or replace function public.event_v0_is_active_pairing_opponent(
  p_participant_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.pairings p
    join public.event_participants me
      on me.user_id = auth.uid()
     and me.event_id = p.event_id
    where p.status = 'active'
      and me.id in (p.participant_a_id, p.participant_b_id)
      and p_participant_id in (p.participant_a_id, p.participant_b_id)
      and p_participant_id <> me.id
  );
$$;

-- True when auth.uid() is a side of this pairing.
create or replace function public.event_v0_is_my_pairing(p_pairing_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.pairings p
    join public.event_participants me
      on me.user_id = auth.uid()
     and me.event_id = p.event_id
    where p.id = p_pairing_id
      and me.id in (p.participant_a_id, p.participant_b_id)
  );
$$;

revoke all on function public.event_v0_is_my_participant(uuid)
  from public, anon;
revoke all on function public.event_v0_is_active_pairing_opponent(uuid)
  from public, anon;
revoke all on function public.event_v0_is_my_pairing(uuid)
  from public, anon;

grant execute on function public.event_v0_is_my_participant(uuid)
  to authenticated;
grant execute on function public.event_v0_is_active_pairing_opponent(uuid)
  to authenticated;
grant execute on function public.event_v0_is_my_pairing(uuid)
  to authenticated;

-- ---------------------------------------------------------------------------
-- SELECT policies (no nested RLS on event_participants / pairings)
-- ---------------------------------------------------------------------------

drop policy if exists "event_v0_participants_select_own"
  on public.event_participants;
create policy "event_v0_participants_select_own"
  on public.event_participants
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "event_v0_participants_select_pairing_opponent"
  on public.event_participants;
create policy "event_v0_participants_select_pairing_opponent"
  on public.event_participants
  for select
  to authenticated
  using (
    public.event_v0_is_active_pairing_opponent(event_participants.id)
  );

drop policy if exists "event_v0_sparring_requests_select_own"
  on public.sparring_requests;
create policy "event_v0_sparring_requests_select_own"
  on public.sparring_requests
  for select
  to authenticated
  using (
    public.event_v0_is_my_participant(sparring_requests.participant_id)
  );

drop policy if exists "event_v0_pairings_select_own"
  on public.pairings;
create policy "event_v0_pairings_select_own"
  on public.pairings
  for select
  to authenticated
  using (
    public.event_v0_is_my_pairing(pairings.id)
  );
