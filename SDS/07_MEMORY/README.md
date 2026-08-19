# Organizational Memory

## 문서 정보

- 소유: SDS
- 독자: CEO, AI 팀, 개발자
- 읽는 시점: 기능 제안·설계·회고 전

## 목적

Memory는 AI를 위한 것이 아니다.  
회사의 기억을 보존하기 위한 것이다.

SDS Organizational Memory는 과거의 증거와 검증된 배움을 다음 의사결정에 재사용한다. Cursor, Claude, GPT 등 사용하는 도구가 바뀌어도 이 기억의 소유자는 회사다.

## 구성

- `EVIDENCE.md`: 무엇을 증거로 인정하고 어떻게 인용하는지
- `PATTERNS.md`: 반복 관찰되어 다른 프로젝트에도 적용 가능한 긍정 패턴
- `LESSONS.md`: 실행과 검증에서 얻은 일반 교훈
- `ANTI_PATTERNS.md`: 피해야 할 반복 실패와 그 근거

## 경계

- 원본 사용자 인터뷰, 제품 피드백, 기능별 검증 데이터는 각 프로젝트의 `docs/`가 소유한다.
- SDS에는 원본 데이터가 아닌, 출처가 있는 재사용 가능한 패턴과 교훈만 기록한다.
- 증거 없는 주장은 사실이나 패턴으로 기록하지 않는다. 가설은 프로젝트 문서에서 가설로 표시한다.

## 기억의 승격

```text
Evidence
  ↓
Candidate Pattern
  ↓
Verified Pattern
  ↓
Golden Principle
```

1. **Evidence** — 프로젝트 `docs/`의 원본 사용자 피드백, 데이터, 실험 결과다.
2. **Candidate Pattern** — 하나 이상의 Evidence에서 나온 가설이다. 적용 범위와 한계를 반드시 적는다.
3. **Verified Pattern** — 여러 독립적인 Evidence에서 반복 확인된 패턴이다. 반례와 검증 조건도 기록한다.
4. **Golden Principle** — 여러 제품에서도 유효성이 확인되어 회사 운영 원칙으로 승격한 패턴이다. `00_BRAIN/`의 CEO 승인 대상 문서에만 기록한다.

원칙은 가장 늦게 만든다. 충분한 근거가 없는 Candidate를 Verified 또는 Golden Principle로 올리지 않는다.

## 사용 순서

새 제안 전에는 작업과 관련된 Evidence 기준, Pattern, Lesson, Anti Pattern만 선택해 읽는다.  
Memory 전체를 기계적으로 읽지 않으며, 새 증거가 기존 패턴과 충돌하면 패턴을 확정하지 않고 재검토한다.
