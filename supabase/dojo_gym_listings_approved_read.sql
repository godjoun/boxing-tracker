-- 이미 dojo_gym_listings 테이블을 만든 경우, 이 파일만 추가로 실행
-- 승인된 입점관만 앱 검색에서 읽기

drop policy if exists "Public read approved gym listings" on public.dojo_gym_listings;
create policy "Public read approved gym listings"
  on public.dojo_gym_listings for select to anon, authenticated
  using (status = 'approved');

-- 승인 예:
-- update public.dojo_gym_listings set status = 'approved' where gym_name = '체육관이름';
