# Version Policy

## 문서 정보

- 소유: SDS
- 독자: CEO, AI 팀, 개발자
- 읽는 시점: SDS의 기능·절차·정책을 바꾸기 전과 후

## Rule 0

SDS는 절대 현재 상태를 거짓으로 기록하지 않는다. 버전, 로드맵, 완료율, Health는 구현·검증된 현재 상태를 기준으로 쓴다.

## 버전 방식

SDS는 Semantic Versioning의 의미를 따른다. `1.0.0` 이전에는 `0.x` 단위로 운영 역량의 추가를 기록한다.

- `0.x`: 새 운영 역량 또는 중요한 구조 변화
- `0.x.y`: 문서 오류 수정, 명확화, 호환되는 작은 개선
- `1.0.0`: 정의된 Core가 실제 프로젝트에서 검증되어 안정적으로 재사용 가능한 상태

버전은 해당 범위가 실제로 구현되고 검증된 뒤에만 올린다.

## 변경 기록

`SDS/CHANGELOG.md`는 Keep a Changelog 형식을 사용한다.

- Added
- Changed
- Fixed
- Deprecated
- Removed
- Security

각 버전은 날짜와 실제 변경 내용을 기록한다. 예정된 작업은 `SDS/ROADMAP.md`에만 둔다.
