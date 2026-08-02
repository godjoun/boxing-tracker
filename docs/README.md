# docs 안내

필요한 것만 둔다. 결정 로그·옛 로드맵은 두지 않는다.

## 현재 백엔드 스택

Boxing Tracker의 인증·데이터베이스·Storage·권한 기준은 **Supabase**다.

- Supabase Auth
- PostgreSQL
- Row Level Security (`user_id` 기반 소유권)
- Supabase Storage 정책
- 환경변수·키 관리 (`VITE_SUPABASE_*`, 서비스 역할 키는 클라이언트 비노출)
- 일부 기능은 아직 localStorage 병행 — 계정 기반 전환 시 마이그레이션·RLS를 Level 3로 본다

대화·초안 예시에서 Firebase가 언급될 수 있으나, **현재 사용 기술이 아니다.** 과거 검토 사실과 현재 스택을 구분한다.

| 파일 | 볼 때 |
|------|--------|
| `brand.md` | 이름·슬로건·로고·색 잠금 |
| `branding-phase1.md` | 소프트 론칭 브랜딩 1차 전략 |
| `product-philosophy.md` | 화면·카피 판단 |
| `ui-ux-hierarchy.md` | 기존 화면의 행동·시각 계층 기준 |
| `dojo.md` | 모임·문의·라이벌 규칙 |
| `supabase.md` | Supabase 장부·RLS·운영 점검 |
| `monetization.md` | 수익화 (체육관이 낸다) |
| `code-map.md` | 코드 어디 있는지 |
| `later.md` | 다음에 할 일 |
| `brand/logo-locked.png` | 로고 원본 |

코드 상수: `src/utils/brand.js` · 클라이언트: `src/lib/supabaseClient.js`
