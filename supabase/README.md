# supabase/

레포의 SQL 원본. Supabase SQL Editor에 **복붙 → Save**.  
이미 돌아가는 DB는 장부를 지우지 말고, 스니펫만 이 목록으로 맞춘다.

## 지금 쓰는 것 (11개)

| # | 저장 이름 | 파일 |
|---|-----------|------|
| 1 | `입점 · dojo_gym_listings` | `dojo_gym_listings.sql` |
| 2 | `입점관리 · dojo_gym_listings_manage` | `dojo_gym_listings_manage.sql` |
| 3 | `입점사진 · dojo_gym_listings_photos` | `dojo_gym_listings_photos.sql` |
| 4 | `문의 · dojo_inquiries` | `dojo_inquiries.sql` |
| 5 | `문의채팅 · dojo_inquiry_chat` | `dojo_inquiry_chat.sql` |
| 6 | `문의채팅인박스 · dojo_inquiry_chat_inbox` | `dojo_inquiry_chat_inbox.sql` |
| 7 | `모임 · dojo_exchange` | `dojo_exchange.sql` |
| 8 | `모임채팅 · dojo_chat` | `dojo_chat.sql` |
| 9 | `라이벌 · dojo_sparring_v1` | `dojo_sparring_v1.sql` |
| 10 | `라이벌채팅 · dojo_sparring_chat` | `dojo_sparring_chat.sql` |
| 11 | `베타RLS · beta_rls_hardening` | `beta_rls_hardening.sql` ← **마지막** |

전부 다시 Run 하지 말 것. 고장 난 기능만.  
라이벌 상호 관심 채팅을 켤 때 → **#10만 Run**.

지도형 체육관 찾기의 입점관 좌표를 켤 때 → 기존 DB에서는 **#2를 Run한 뒤
#11을 다시 Run**한다. 새 DB는 #1부터 순서대로 실행하면 된다.

## later/ (아직 안 붙여도 됨)

| 저장 이름 | 파일 |
|-----------|------|
| `닉네임 · fighter_nicknames` | `later/fighter_nicknames.sql` |
| `추천파일럿 · gym_featured_pilot` | `later/gym_featured_pilot.sql` |

상세: `docs/supabase.md`
