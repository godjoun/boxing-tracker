# Supabase 중간 점검 (한국어 이름표)

> **Table Editor에 보이는 장부 ≈ 6개**가 정상입니다.  
> 아래 SQL 파일 10개는 **설치·고침 스크립트**라서 개수가 더 많습니다.  
> (같은 장부를 여러 번 손보는 파일이 있음)

## 당신이 보는 것 = 장부 6개

Supabase → **Table Editor**

| # | 한국어 | 테이블 이름 |
|---|--------|-------------|
| 1 | **입점** | `dojo_gym_listings` |
| 2 | **문의** | `dojo_gym_inquiries` |
| 3 | **교류 일정** | `dojo_exchange_events` |
| 4 | **교류 신청** | `dojo_exchange_applies` |
| 5 | **채팅 방** | `dojo_chat_threads` |
| 6 | **채팅 말** | `dojo_chat_messages` |

이게 6개면 **빠진 게 아닙니다.**

(나중에) **닉네임** `fighter_nicknames` 를 돌리면 7번째가 생깁니다. 지금은 없어도 입점·문의·교류는 됩니다.

### 입점 한 줄 운영 (장부 1번만)

| 하고 싶은 것 | `dojo_gym_listings` 에서 |
|--------------|--------------------------|
| 검색에 올리기 | `status` = `approved` |
| 추천 칸 | `is_featured` = `true` |
| 내리기 | `status` = `pending` 또는 `rejected` |

---

## SQL 파일 10개 ≠ 장부 10개

파일은 **「언제 돌리나」**용입니다. 새 장부를 매번 만들지 않습니다.

### 입점 장부 하나(`dojo_gym_listings`)를 만지는 파일 5개

| 한국어 저장명 | 파일 | 새 장부? | 하는 일 |
|---------------|------|----------|---------|
| **입점 신청** | `dojo_gym_listings.sql` | ✅ 장부 만듦 | 테이블 + 신청 |
| **입점 승인 읽기** | `*_approved_read.sql` | ❌ 없음 | 검색에 승인만 |
| **입점 관리** | `*_manage.sql` | ❌ 없음 | 수정·삭제·사진·내 목록 |
| **입점 추천** | `*_featured.sql` | ❌ 없음 | 추천 칸 컬럼 |
| **입점 insert 고침** | `*_insert_fix.sql` | ❌ 없음 | 신청이 안 쌓일 때 |

→ Table Editor에는 여전히 **입점 1줄**만 보입니다.

### 나머지 기능 (장부 + SQL)

| 한국어 저장명 | 파일 | Table Editor에 생기는 것 |
|---------------|------|---------------------------|
| **문의** | `dojo_inquiries.sql` | 문의 1개 |
| **문의 장부** | `dojo_inquiries_ledger.sql` | ❌ 없음 (받은 문의용 RPC만) |
| **문의 insert·장부 고침** | `dojo_inquiries_insert_fix.sql` | ❌ 없음 · 문의 안 쌓일 때 |
| **문의 채팅** | `dojo_inquiry_chat.sql` | 대화방·메시지 2개 + RPC |
| **문의 채팅 인박스** | `dojo_inquiry_chat_inbox.sql` | ❌ 없음 (읽음·미리보기·목록 RPC) |
| **교류** | `dojo_exchange.sql` | 교류 일정 + 교류 신청 = **2개** |
| **교류 채팅** | `dojo_chat.sql` | 채팅 방 + 채팅 말 = **2개** |
| **닉네임** | `fighter_nicknames.sql` | 닉네임 1개 (아직 안 돌려도 됨) |

### 언제 돌리나

- **처음 입점:** 입점 신청 → (이미 있으면) 승인 읽기 · 입점 관리 · 입점 추천
- **고장 시만:** 입점 insert 고침 · **문의 insert·장부 고침**
- **문의 채팅:** `문의 채팅` (`dojo_inquiry_chat.sql`) 한 번 → 안 읽음·미리보기면 `문의 채팅 인박스` (`dojo_inquiry_chat_inbox.sql`)
- **문의·교류·채팅·닉네임:** 그 기능 켤 때 한 번씩

---

## 중간 점검

- [ ] Table Editor에 장부 **6개** (위 표) — OK
- [ ] 앱 등록 → **입점** 장부에 행 생김
- [ ] `approved` → 검색 노출 / `is_featured` → 추천
- [ ] (선택) 문의 장부 SQL · 닉네임 SQL

## 헷갈리기 쉬운 것

| 증상 | 뜻 |
|------|-----|
| SQL 10개인데 장부 6개 | **정상** — 패치 파일이 장부를 안 늘림 |
| 앱 「내 등록」만 있고 입점 장부 0건 | 이 기기에만 저장 · insert 고침 후 다시 보내기 |
| 장부엔 있는데 검색에 안 보임 | 아직 `pending` |

상세: `docs/dojo.md` · 다음: `docs/later.md`
