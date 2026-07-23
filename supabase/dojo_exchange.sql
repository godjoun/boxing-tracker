-- Supabase SQL Editor에서 실행
-- 도장 모임: 일정·신청이 기기끼리 통하게 (소프트 론칭용)
-- 인증 전이라 RLS는 열어 둠. 스팸 막기는 auth 붙인 뒤 강화.

create table if not exists public.dojo_exchange_events (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  host_nickname text not null default '',
  title text not null default '',
  gym_name text not null,
  address text not null,
  starts_at timestamptz not null,
  capacity integer not null default 12 check (capacity >= 1),
  fee_won integer not null default 0 check (fee_won >= 0),
  note text not null default '',
  applied_count integer not null default 0 check (applied_count >= 0),
  created_at timestamptz not null default now()
);

create index if not exists dojo_exchange_events_starts_at_idx
  on public.dojo_exchange_events (starts_at);

create index if not exists dojo_exchange_events_user_id_idx
  on public.dojo_exchange_events (user_id);

create table if not exists public.dojo_exchange_applies (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.dojo_exchange_events (id) on delete cascade,
  user_id text not null,
  nickname text not null default '',
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create index if not exists dojo_exchange_applies_user_id_idx
  on public.dojo_exchange_applies (user_id);

create index if not exists dojo_exchange_applies_event_id_idx
  on public.dojo_exchange_applies (event_id);

alter table public.dojo_exchange_events enable row level security;
alter table public.dojo_exchange_applies enable row level security;

drop policy if exists "Public read exchange events" on public.dojo_exchange_events;
create policy "Public read exchange events"
  on public.dojo_exchange_events for select to anon, authenticated
  using (true);

drop policy if exists "Public insert exchange events" on public.dojo_exchange_events;
create policy "Public insert exchange events"
  on public.dojo_exchange_events for insert to anon, authenticated
  with check (true);

drop policy if exists "Public update exchange events" on public.dojo_exchange_events;
create policy "Public update exchange events"
  on public.dojo_exchange_events for update to anon, authenticated
  using (true) with check (true);

drop policy if exists "Public delete exchange events" on public.dojo_exchange_events;
create policy "Public delete exchange events"
  on public.dojo_exchange_events for delete to anon, authenticated
  using (true);

drop policy if exists "Public read exchange applies" on public.dojo_exchange_applies;
create policy "Public read exchange applies"
  on public.dojo_exchange_applies for select to anon, authenticated
  using (true);

drop policy if exists "Public insert exchange applies" on public.dojo_exchange_applies;
create policy "Public insert exchange applies"
  on public.dojo_exchange_applies for insert to anon, authenticated
  with check (true);

drop policy if exists "Public delete exchange applies" on public.dojo_exchange_applies;
create policy "Public delete exchange applies"
  on public.dojo_exchange_applies for delete to anon, authenticated
  using (true);

-- 신청 시 applied_count +1 / 취소 시 -1 (원자적)
create or replace function public.apply_dojo_exchange(
  p_event_id uuid,
  p_user_id text,
  p_nickname text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_capacity integer;
  v_count integer;
begin
  if p_event_id is null or p_user_id is null or length(trim(p_user_id)) = 0 then
    return false;
  end if;

  if exists (
    select 1 from public.dojo_exchange_applies
    where event_id = p_event_id and user_id = p_user_id
  ) then
    return false;
  end if;

  select capacity, applied_count
    into v_capacity, v_count
  from public.dojo_exchange_events
  where id = p_event_id
  for update;

  if not found then
    return false;
  end if;

  if v_capacity > 0 and v_count >= v_capacity then
    return false;
  end if;

  insert into public.dojo_exchange_applies (event_id, user_id, nickname)
  values (p_event_id, p_user_id, coalesce(nullif(trim(p_nickname), ''), '나'));

  update public.dojo_exchange_events
  set applied_count = applied_count + 1
  where id = p_event_id;

  return true;
end;
$$;

create or replace function public.cancel_dojo_exchange_apply(
  p_event_id uuid,
  p_user_id text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_event_id is null or p_user_id is null then
    return false;
  end if;

  delete from public.dojo_exchange_applies
  where event_id = p_event_id and user_id = p_user_id;

  if not found then
    return false;
  end if;

  update public.dojo_exchange_events
  set applied_count = greatest(0, applied_count - 1)
  where id = p_event_id;

  return true;
end;
$$;

revoke all on function public.apply_dojo_exchange(uuid, text, text) from public;
grant execute on function public.apply_dojo_exchange(uuid, text, text) to anon, authenticated;

revoke all on function public.cancel_dojo_exchange_apply(uuid, text) from public;
grant execute on function public.cancel_dojo_exchange_apply(uuid, text) to anon, authenticated;
