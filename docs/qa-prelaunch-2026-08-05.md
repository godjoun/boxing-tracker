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
| 5 전체 메뉴 | **PASS** | iPhone 13 뷰포트 재검증 2026-08-06 · IA 승인·동결 |
| 6 커뮤니티/관 | PASS | 빈 상태 관찰 · 실오류/느린망은 실기 |
| 7 reload | PASS | |
| 8 연타 저장 | PASS | delta≤1 |
| 9 탭 전환 | PASS | 타이머 중 종료는 실기 |
| 10 BG 타이머 | **PASS** | iPhone 실기 2026-08-06 · 타이머 P0 닫음 |
| 11 소리 | **PASS** | iPhone 실기 2026-08-06 · 단계 전환음 · 오디오 P1 닫음 |
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
| 실기 필수 (풀 루프·BG 타이머·소리·GPS·iPhone 잘림) | **부분 진행** · 타이머 P0·오디오 P1·메뉴 IA **닫음** · GPS·풀 루프 등 대기 |

실기 중 **제품 코드 수정 금지.** FAIL은 승인 전 분석만.  
실기 출시 게이트: (1) 훈련 완료→기록 (2) 잠금/앱전환 경과 (3) iPhone 치명 잘림 없음.

## 타이머 P0 — iPhone 실기 마감 (2026-08-06)

**상태: 해결 완료 · 닫음.** 구현 유지 · 추가 리팩터링 없음.

| 항목 | 결과 |
|------|------|
| 준비 건너뛰기 | **PASS** |
| 포그라운드 시간 정확성 | **PASS** |
| 화면 잠금 후 경과 시간 반영 | **PASS** |
| 일시정지 상태에서 화면 잠금 | **PASS** |

관련 배포(요약): 벽시계 catch-up · running 중 syncFromClock 시계 권한 · 준비 건너뛰기 원자 저장.  
프로덕션: `https://boxing-tracker.vercel.app`

출시 게이트 (2) 잠금/앱전환 경과 · 타이머 시계 정확성은 위 PASS로 충족.

## 오디오 P1 — iPhone 실기 마감 (2026-08-06)

**상태: PASS · 닫음.** 분석·제품 코드 수정·리팩터링 **중단**. 현재 오디오 구현 유지.

| 항목 | 결과 |
|------|------|
| 단계 전환 알림음 | **PASS** |
| 훈련 시작 | **PASS** |
| 운동 → 휴식 | **PASS** |
| 휴식 → 다음 운동 | **PASS** |
| 훈련 종료 | **PASS** |

비고: 최초 1회 무음 현상이 있었으나 **이후 재현되지 않음**. iPhone 전체 타이머 흐름에서 시작·휴식·재시작·종료음 확인 완료.

## 전체 메뉴 IA — 승인·동결 (2026-08-06)

**상태: 승인 완료 · 동결.** 메뉴 UI·라우팅·문구 추가 변경 없음. 커밋 `74b9199`.

| 항목 | 결과 |
|------|------|
| 전체 화면 최상위 3항목 | **PASS** |
| 앱 설정 → 전체 복귀 | **PASS** |
| 개인정보처리방침·이용약관 링크 | **PASS** |
| 제목·설명·하단 내비 잘림·겹침 (iPhone 13 뷰포트) | **PASS** |

최상위: 함께하기 · 훈련 카드 만들기 · 앱 설정.

## 부트 스플래시 — iPhone 냉간 마감·동결 (2026-08-07)

**상태: PASS · 완료 · 동결.** 현재 구현 유지. PNG/WebP/SVG 추가 최적화·전환 재작업 **금지**.

동결 커밋: `9fda203` · 프로덕션: `https://boxing-tracker.vercel.app`

| 항목 | 결과 |
|------|------|
| 첫 프레임부터 MANTLE 로고 | **PASS** |
| 빈 흰 화면 없음 | **PASS** |
| 로고·홈 겹침 없음 | **PASS** |
| 하단 검정줄 없음 | **PASS** |
| 전환 지연 없음 | **PASS** |
| light → light 홈 / dark → dark 홈 | **PASS** (중간 light 홈 플래시 없음) |

동결 구현 요약:
- 흰 배경 정적 `#boot-splash` (`index.html`)
- 192×192 압축 PNG **data URI 인라인** 유지 (추가 압축·포맷 변경 없음)
- `#root`는 `.app-ready` 전 숨김 · 준비 후 스플래시 제거 → 저장 테마 홈 즉시 표시
- 인위적 1.1s / opacity 페이드 없음
- iOS `apple-touch-startup-image` (`public/splash/*`) 포함

관련 파일 (동결): `index.html` · `src/utils/bootSplash.js` · `src/utils/theme.js` · `src/App.jsx` · `src/index.css` · `public/splash/*`

## 복싱 체력 — iPhone 실기 마감·동결 (2026-08-07)

**상태: PASS · 완료 · 동결.** 현재 구현 유지. 타이머 엔진·운동 구성·화면 구조 추가 수정 **금지**.

동결 커밋: `b2ef8d9` · 프로덕션: `https://boxing-tracker.vercel.app`  
표기명: **복싱 체력** (route/`strength` id 유지)

| 항목 | 결과 |
|------|------|
| 40초 운동 / 20초 휴식 | **PASS** |
| 동작명·바퀴·진행 표시 | **PASS** |
| 사이드 플랭크 1바퀴 왼쪽 · 2바퀴 오른쪽 | **PASS** |
| 운동·휴식·완료 알림음 | **PASS** |
| 완료 기록 1건 (`신체 · 10분 코어` 등) | **PASS** |
| 앱 재실행 후 기록 유지 | **PASS** |

동결 구현 요약:
- 3루틴: 10분 코어 · 10분 하체 · 10분 상체·어깨 (소요 보조 표기 **약 10분** · 실측 9:40)
- 10R × 40초 work / 20초 rest · 마지막 라운드 뒤 휴식 없음
- 집·무도구 · 월~토 헬스장 표·줄넘기 필수 워밍업 제거

관련 파일 (동결): `src/utils/strengthProgram.js` · `StrengthProgramPage.jsx/.css` · `StrengthTimerGuide.jsx/.css` · `TimerPage.jsx`(strength 연동부) · `appMenu.js` · `TrainingHubPage.jsx`

나머지 실기(풀 루프·GPS·치명 잘림 등)는 **계속 대기** — 제품 코드 추가 수정 없이 다음 iPhone QA 결과를 기다린다.
