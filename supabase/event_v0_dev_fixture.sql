-- EVENT v0 DEV/QA fixture only — NOT for production September event.
-- Run after supabase/event_v0.sql in SQL Editor (service role).
--
-- 1) insert dev event row
-- 2) set operator secret hash for local QA:
--    select public.event_v0_set_operator_secret_hash('event-v0-dev', 'dev-secret-change-me');

insert into public.events (
  id,
  title,
  gym_a,
  gym_b,
  event_date,
  location,
  status
)
values (
  'event-v0-dev',
  '[DEV] EVENT v0 fixture',
  'Dev Gym Alpha',
  'Dev Gym Beta',
  '2099-01-01',
  'Dev City Ring',
  'upcoming'
)
on conflict (id) do update
set
  title = excluded.title,
  gym_a = excluded.gym_a,
  gym_b = excluded.gym_b,
  event_date = excluded.event_date,
  location = excluded.location,
  status = excluded.status;
