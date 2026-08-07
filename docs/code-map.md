# 코드 맵

| 하고 싶은 일 | 파일 |
|---|---|
| 하단 내비 | `src/App.jsx` · 훈련 · 기록 · **홈** · 커뮤니티 · 전체 |
| 공통 화면 레이아웃 | `src/reference-layout.css` · 화면 여백 · 카드 · 하단 내비 · 시안 재해석 |
| 커뮤니티 IA | `docs/community-ia.md` · Vision Loop · 칩 `교류·체육관·라이벌·모임` |
| 커뮤니티 UI 설계 | `docs/community-ui.md` · 구현 전 |
| 커뮤니티(짐) | `src/pages/GymFinderPage.jsx` · (코드는 구칩 · 문서 잠금과 아직 불일치) |
| 모임 | `ExchangeBoardPanel.jsx` · `utils/dojoExchange.js` · 채팅 `ExchangeChatModal.jsx` · `utils/dojoChat.js` · `api/dojoChatApi.js` |
| 관↔관 교류 | 설계 `docs/gym-exchange.md` · 코드/SQL 없음 (Level 3) |
| 채팅 SQL | `supabase/dojo_chat.sql` |
| 체육관 검색·카드 | `NearbyGymsPanel.jsx` (지도·찜·내 문의·등록 관리) · `GymResultCard.jsx` · `utils/gymPricing.js` |
| 관 상세 | `GymDetailPanel.jsx` · `docs/dojo-ui.md` |
| 문의 | `GymInquiryModal.jsx` · `GymInquiryLedgerPanel.jsx` · `GymSentInquiriesPanel.jsx` · `GymInquiryChatModal.jsx` · `utils/gymInquiry.js` · `api/gymInquiryApi.js` · `api/gymInquiryChatApi.js` |
| 문의 SQL | `supabase/dojo_inquiries.sql` · 채팅 `dojo_inquiry_chat.sql` · 인박스 `dojo_inquiry_chat_inbox.sql` |
| 입점 등록 | `GymListingRegisterPanel.jsx` · `GymMyListingsPanel.jsx` · `utils/gymListing.js` · `api/gymListingApi.js` |
| 입점 SQL | `dojo_gym_listings.sql` · 관리 `*_manage.sql` · 사진 `*_photos.sql` · 목록 `supabase/README.md` |
| 라이벌 | `SparringPartnerPanel.jsx` · `SparringPartnerCard.jsx` · `SparringChatModal.jsx` · `api/sparringPartnerApi.js` · `api/sparringChatApi.js` |
| 라이벌 SQL | `supabase/dojo_sparring_v1.sql` · 채팅 `dojo_sparring_chat.sql` |
| 시드 | `src/data/localDojoData.js` |
| API 자리 | `src/api/dojoApi.js` · 모임 `src/api/dojoExchangeApi.js` |
| 모임 SQL | `supabase/dojo_exchange.sql` |
| 라운드(타이머) | `src/pages/TimerPage.jsx` |
| 기술(4주 코스) | `src/pages/CurriculumPage.jsx` |
| 복싱 체력 | **동결 (2026-08-07 · `b2ef8d9`)** · `StrengthProgramPage.jsx` · `utils/strengthProgram.js` · `StrengthTimerGuide.jsx` · 3×약10분 무도구 · 타이머·구성·화면 추가 수정 금지 |
| 링 메뉴 라벨 | `src/utils/appMenu.js` |
| 이름·슬로건 | `src/utils/brand.js` |
| 오프닝 | `src/components/EntryBanner.jsx` · 온보딩 환영 · 세션 입장 배너 |
| 앱 진입 | iOS `apple-touch-startup-image`만 splash · HTML/React branded splash 없음 · `theme-boot.js` + `revealAppShell()` · onboarding/home 즉시 렌더 |
| 로고 | `public/logo-mark.png` · `docs/brand/logo-locked.png` |

짐 구현 폴더 요약: `src/pages/dojoBreaker/README.md`
나중에: `docs/later.md`
