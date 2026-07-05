-- Supabase SQL Editor에서 실행 (선택)
-- 다른 기기·다른 사용자와 링네임 중복을 서버에서 확인할 때 필요합니다.

create table if not exists public.fighter_nicknames (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null unique,
  created_at timestamptz not null default now()
);

alter table public.fighter_nicknames enable row level security;

create policy "Anyone can read nicknames"
  on public.fighter_nicknames
  for select
  to anon, authenticated
  using (true);

create policy "Users can upsert own nickname"
  on public.fighter_nicknames
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own nickname"
  on public.fighter_nicknames
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own nickname"
  on public.fighter_nicknames
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Supabase 대시보드 > Authentication > Providers > Email > Confirm email ON 권장
-- (가짜 메일로 바로 로그인되는 것 방지)
