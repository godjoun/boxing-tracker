# Supabase 중간 점검 (한국어 이름표)

> **전부 다시 Run 하라는 목록이 아니다.**  
> 이미 되는 기능은 건드리지 말고, 고장 난 기능에 해당하는 파일만 연다.  
> 원본 목록: `supabase/README.md`

## Table Editor = 장부 **12개** (라이벌 채팅 적용 후 정상)

| 한국어로 보면 | Table Editor에 보이는 영어 이름 |
|---------------|--------------------------------|
| 입점 | `dojo_gym_listings` |
| 문의 | `dojo_gym_inquiries` |
| 문의 대화방 | `dojo_inquiry_threads` |
| 문의 메시지 | `dojo_inquiry_messages` |
| 교류 일정 | `dojo_exchange_events` |
| 교류 신청 | `dojo_exchange_applies` |
| 교류 채팅 방 | `dojo_chat_threads` |
| 교류 채팅 말 | `dojo_chat_messages` |
| 라이벌 프로필 | `dojo_sparring_profiles` |
| 라이벌 관심 | `dojo_sparring_interests` |
| 라이벌 대화방 | `dojo_sparring_threads` |
| 라이벌 메시지 | `dojo_sparring_messages` |

(선택) 닉네임 → `fighter_nicknames` = 13번째. 없어도 됨.

## 스니펫 전부 지우고 다시 붙일 때

PRIVATE 스니펫만 지운다. **Table Editor 장부는 지우지 말 것.**

레포 `supabase/` 파일을 열어 복붙 → Save. **저장만 하고, 이미 돌린 건 다시 Run 하지 말 것.**

| # | 저장 이름 | 파일 |
|---|-----------|------|
| 1 | `입점 · dojo_gym_listings` | `dojo_gym_listings.sql` |
| 2 | `입점관리 · dojo_gym_listings_manage` | `dojo_gym_listings_manage.sql` |
| 3 | `입점사진 · dojo_gym_listings_photos` | `dojo_gym_listings_photos.sql` |
| 4 | `문의 · dojo_inquiries` | `dojo_inquiries.sql` |
| 5 | `문의채팅 · dojo_inquiry_chat` | `dojo_inquiry_chat.sql` |
| 6 | `문의채팅인박스 · dojo_inquiry_chat_inbox` | `dojo_inquiry_chat_inbox.sql` |
| 7 | `교류 · dojo_exchange` | `dojo_exchange.sql` |
| 8 | `교류채팅 · dojo_chat` | `dojo_chat.sql` |
| 9 | `라이벌 · dojo_sparring_v1` | `dojo_sparring_v1.sql` |
| 10 | `라이벌채팅 · dojo_sparring_chat` | `dojo_sparring_chat.sql` |
| 11 | `베타RLS · beta_rls_hardening` | `beta_rls_hardening.sql` |

(나중) `supabase/later/` — 닉네임 · 추천파일럿

### 지금 문의 채팅만 고칠 때

이미 5·6을 Run 했으면 → **`#11 베타RLS`만 Run.**

## 입점 한 줄 운영

| 하고 싶은 것 | `dojo_gym_listings` 에서 |
|--------------|--------------------------|
| 검색에 올리기 | `status` = `approved` |
| 추천 칸 | `is_featured` = `true` |
| 내리기 | `status` = `pending` 또는 `rejected` |

공개 주소는 **Vercel 배포만** 사용한다.

`beta_rls_hardening.sql` 적용 후에는 앱에서 입점 수정·삭제, 교류 삭제,
문의 대화 열기·목록·전송을 다시 확인한다.

## 언제 돌리나

- **처음 / 새 DB:** `supabase/README.md` 1→11 순서
- **입점 수정·삭제·사진 막힘:** `#2 입점관리` (또는 `#3 입점사진`)
- **문의·받은 문의:** `#4 문의` (장부 RPC 포함)
- **문의 채팅 서버 미연결:** `#5` → `#6` → **`#11`**
- **라이벌 상호 관심 채팅:** `#9` 실행 후 `#10 라이벌채팅`
- **추천 파일럿 시작:** `later/gym_featured_pilot.sql`

## 헷갈리기 쉬운 것

| 증상 | 뜻 |
|------|-----|
| 스니펫 11개인데 장부 12개 | **정상** (SQL 하나가 장부를 둘 만들기도 함) |
| 앱 「내 등록」만 있고 입점 장부 0건 | 이 기기에만 저장 · `#2 입점관리` 후 다시 보내기 |
| 장부엔 있는데 검색에 안 보임 | 아직 `pending` |
| 문의 채팅 서버 미연결 | `#11 베타RLS` 미실행 가능 |
| 라이벌 대화 버튼이 없음 | 서로 관심 전이거나 `#10 라이벌채팅` 미실행 |

상세: `docs/dojo.md` · 다음: `docs/later.md`
