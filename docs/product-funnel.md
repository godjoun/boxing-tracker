# Product Funnel Analytics (최소)

MANTLE에서 핵심 기능이 **실제로 쓰이는지**만 보는 참고 지표다.  
정교한 리텐션·사용자 추적·관리자 대시보드가 아니다.

## 이벤트 (5개만)

| event_name | 의미 | 기록 시점 |
|---|---|---|
| `app_open` | 프로덕션 앱 셸 진입 | `MainAppShell` mount |
| `training_start` | 타이머/훈련 실제 시작 | `TimerPage` running 진입 |
| `training_complete` | 전체 훈련 정상 완료 + 로그 저장 | 부분 중단 제외 |
| `training_card_create` | 훈련 카드 저장 성공 | `finishSave` 이후 |
| `profile_view` | 프로필 화면 진입 | `ProfilePage` mount 1회 |

그 외 이벤트명·payload·PII는 저장하지 않는다.

## 테이블

- SQL: `supabase/product_funnel_events.sql`
- 컬럼: `id`, `event_name`, `created_at`
- RLS: 클라이언트 `INSERT`만 (`anon` / `authenticated`)
- 조회: Supabase SQL Editor만 (서비스 롤)

## 클라이언트

- `src/utils/productFunnel.js` → `trackProductEvent(name)`
- `import.meta.env.PROD` **그리고** hostname `boxing-tracker.vercel.app`일 때만 Supabase insert
- localhost / Vercel Preview는 전송하지 않음
- 실패해도 앱 기능·UI에 영향 없음 (fire-and-forget)

기존 `@vercel/analytics` / `track`와는 별개다.

## SQL Editor 집계

### 1. 최근 7일 이벤트별 횟수

```sql
select event_name, count(*) as n
from public.product_funnel_events
where created_at >= now() - interval '7 days'
group by event_name
order by n desc;
```

### 2. 날짜별 이벤트 횟수

```sql
select (created_at at time zone 'Asia/Seoul')::date as day_kst,
       event_name,
       count(*) as n
from public.product_funnel_events
group by 1, 2
order by 1 desc, 2;
```

### 3. 전체 이벤트별 횟수

```sql
select event_name, count(*) as n
from public.product_funnel_events
group by event_name
order by n desc;
```

## QA

```bash
node scripts/qa-product-funnel-rls.mjs
```

(전제: 위 SQL을 SQL Editor에서 1회 Run)
