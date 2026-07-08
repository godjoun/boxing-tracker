-- Supabase SQL Editor에서 실행 (선택)
-- 다른 기기·다른 사용자와 링네임 중복을 서버에서 확인할 때 필요합니다.

create table if not exists public.fighter_nicknames (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null unique,
  created_at timestamptz not null default now()
);

alter table public.fighter_nicknames enable row level security;

-- 기존의 전체 읽기 정책이 있으면 제거 (익명 키로 테이블 전체 열람 방지)
drop policy if exists "Anyone can read nicknames" on public.fighter_nicknames;

-- 읽기는 "내 행"만 허용 (닉네임 목록 전체 수집 방지, upsert 반환값 처리용)
create policy "Users can read own nickname"
  on public.fighter_nicknames
  for select
  to authenticated
  using (auth.uid() = user_id);

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

-- 닉네임 중복 확인은 전체 테이블 열람 없이 boolean만 돌려주는 함수로 처리합니다.
-- security definer 라서 RLS를 우회하지만, 사용 가능 여부(true/false)만 노출합니다.
create or replace function public.check_nickname_available(p_nickname text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from public.fighter_nicknames
    where lower(nickname) = lower(trim(p_nickname))
      and (auth.uid() is null or user_id <> auth.uid())
  );
$$;

revoke all on function public.check_nickname_available(text) from public;
grant execute on function public.check_nickname_available(text) to anon, authenticated;

-- Supabase 대시보드 > Authentication > Providers > Email > Confirm email ON 권장
-- (가짜 메일로 바로 로그인되는 것 방지)
