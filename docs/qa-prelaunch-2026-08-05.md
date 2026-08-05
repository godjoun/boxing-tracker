# 출시 전 통합 QA — 자동/데스크톱 실행 기록

- 실행 시각: 2026-08-05 (KST)
- 빌드: `vite preview` `http://127.0.0.1:4180/` (방금 `npm run build` 산출물)
- 브라우저: Playwright Chromium headless · 뷰포트 390×844 / 320×720
- **격리 컨텍스트**: 사용자 실기기 Safari/Chrome 저장소와 분리. 기존 사용자 데이터 삭제·초기화 없음.
- 원본 JSON: `tmp/qa-prelaunch/desktop-results.json`
- 영상: `tmp/qa-prelaunch/desktop-flows.webm`
- 캡처: `tmp/qa-prelaunch/shots/`
- 스크립트: `scripts/qa-desktop-prelaunch.mjs`

## QA에서 생성된 데이터 (격리 컨텍스트만)

| 종류 | 내용 |
|------|------|
| 닉네임 | `QA데스크톱56608` |
| 로그 | 복싱 1건 (`d05dd0e9-…`) · 연타 테스트 시 추가 복싱 가능 |
| 프로필 | bio `QA데스크톱 소개` |
| localStorage 키 | `fitness-league-logs`, `fitness-league-profile`, theme, tutorial, dojo/feed 관련 키 등 (JSON 참고) |

실사용자 기기 데이터는 변경하지 않음.

## 항목별 결과 요약

| # | 결과 | 비고 |
|---|------|------|
| 17 lint/test/build | **PASS** | lint 0 · test 56 · build 0 |
| 1 탭 | PASS | |
| 2 훈련 진입 | PASS | 풀 완료는 2b BLOCKED |
| 2b 완료→기록 | **BLOCKED** | 실기/단축 세션 |
| 3 4종 기록 | **FAIL*** | 복싱 저장 성공 · 이후 카테고리 자동화 입력 부족(저장 disabled) — 제품 버그 단정 전 수동 재검증 |
| 4 프로필 | PASS | |
| 5 전체 메뉴 | PASS | |
| 6 커뮤니티/관 | PASS | 빈 상태 관찰 · 실오류/느린망은 실기 |
| 7 reload | PASS | |
| 8 연타 저장 | PASS | delta≤1 |
| 9 탭 전환 | PASS | 타이머 중 종료는 실기 |
| 10 BG 타이머 | **BLOCKED** | iPhone |
| 11 소리 | **BLOCKED** | iPhone |
| 12 GPS | **BLOCKED** | iPhone |
| 13 320/390 | PASS | 육안 캡처 · iPhone 최종 |
| 14 44px | PASS | DOM 측정 |
| 15 테마 | PASS | |
| 16 콘솔 | PASS | `_vercel/insights` 404는 로컬 preview 노이즈로 필터 |
| 18 번들 | 기록 | main JS ~937kB · 500kB 경고 → P2 백로그 |

## 자동·데스크톱 QA 마감 (2026-08-05)

**마감.** 제품 코드 미수정 유지.

| 항목 | 결과 |
|------|------|
| lint / test / build | PASS |
| #3 기록 4종 + 연타 (재검증) | **PASS** |
| 그 외 데스크톱 가능 항목 | PASS (기존 보고) |
| 실기 필수 (풀 루프·BG 타이머·소리·GPS·iPhone 잘림) | **실기 QA 대기** |

실기 중 **제품 코드 수정 금지.** FAIL은 승인 전 분석만.  
실기 출시 게이트: (1) 훈련 완료→기록 (2) 잠금/앱전환 경과 (3) iPhone 치명 잘림 없음.
