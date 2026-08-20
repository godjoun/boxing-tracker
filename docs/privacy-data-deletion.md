# 개인정보 삭제 요청 운영 절차

## 목적과 범위

이 문서는 PUNCH ERA 운영자 SHIN JO UN이 `punchera.app@gmail.com`으로 접수된 개인정보 삭제 요청을 처리하는 수동 운영 절차다.

이 절차는 production Supabase 데이터를 자동으로 변경하지 않는다. 실행 대상은 SQL Editor의 권한 있는 운영자이며, `supabase/user_data_deletion.sql`의 dry-run을 먼저 검토한 뒤에만 삭제 절차를 진행한다.

현재 출시 범위의 서버 데이터는 다음과 같다.

| 데이터 | 사용자 연결 | 처리 방식 |
| --- | --- | --- |
| `event_participants` | `user_id = auth.users.id` | 직접 개인정보 삭제 또는 비식별화 |
| `sparring_requests` | `participant_id` | 대상 사용자의 요청 삭제 |
| `pairings` | 두 `event_participants` 행 | 상대 참가자 보호를 위해 삭제하지 않음 |
| `pairing_history` | `pairing_id`, JSON payload | 상대 참가자 보호를 위해 삭제하지 않음 |
| `fighter_nicknames` | `user_id = auth.users.id` | 테이블이 있으면 대상 행 삭제 |
| `product_funnel_events` | 사용자 식별자 없음 | 사용자별 삭제 대상 아님 |

훈련 기록, 프로필, 사진 및 대부분의 앱 데이터는 이용자 브라우저 저장소에 있다. 이용자는 앱의 삭제·초기화 기능 또는 브라우저 사이트 데이터 삭제로 이를 삭제할 수 있다. 이 문서는 브라우저 데이터나 외부 서비스 데이터를 대신 삭제하지 않는다.

## 요청 접수와 본인 확인

1. 요청을 이메일로 접수하고, `서버 EVENT 데이터만 삭제`인지 `Supabase Auth 계정까지 삭제`인지 분리해 확인한다.
2. 행사명 또는 event ID, 표시 이름, 소속 체육관, 참가 시점 등 최소 정보를 받아 대상 후보를 찾는다.
3. EVENT v0는 Anonymous Auth 계정을 사용할 수 있다. 이메일 주소만으로는 `auth.users.id`와 참가자 행의 소유자를 증명할 수 없으므로, 정확한 대상 UUID를 운영자가 확인할 수 없으면 실행하지 않는다.
4. 이름·체육관·체중·경력이 같은 참가자가 있거나 요청자가 대상 행을 충분히 특정하지 못하면 수동 검토로 중단한다.
5. 요청 범위, 대상 UUID, 확인 근거, dry-run 검토 결과를 별도 운영 기록에 남긴다. 이 SQL은 운영 기록 테이블을 만들거나 기록을 자동 저장하지 않는다.

## Dry-run 검토

1. `supabase/user_data_deletion.sql`의 `PART 1`에 정확한 UUID를 입력한다.
2. 참가자 행, 요청 행, 대상 참가자가 포함된 pairing 수를 확인한다.
3. `pairing_history.payload`의 루트 필드 중 아래 값이 대상 participant/request UUID와 같은 행을 확인한다.
   - participant: `participant_a_id`, `participant_b_id`, `replaced_participant_id`, `new_participant_id`, `kept_participant_id`
   - request: `sparring_request_a_id`, `sparring_request_b_id`, `old_sparring_request_id`, `new_sparring_request_id`
4. `actor_ref`는 사용자 식별 근거로 사용하지 않는다.
5. dry-run 결과가 요청 정보와 다르거나 공유 pairing이 예상 밖이면 실행하지 않고 수동 검토한다.

## 삭제 또는 비식별화 규칙

### 공유 pairing 없음

대상 사용자의 `sparring_requests`를 삭제한 뒤 `event_participants` 행을 삭제한다. FK에 따라 대상 요청이 이미 남아 있더라도 참가자 삭제 시 cascade 대상이지만, 작업 범위를 명확히 하기 위해 SQL에서 요청을 먼저 삭제한다.

### 공유 pairing 있음

`pairings`는 두 참가자의 공유 기록이고 `pairing_history`는 pairing을 `RESTRICT`로 참조한다. 따라서 대상 참가자 행을 삭제하거나 shared pairing/history를 삭제하지 않는다.

대상 사용자의 `sparring_requests`를 삭제하고, 대상 `event_participants` 행만 아래 값으로 비식별화한다.

```text
user_id = null
display_name = '삭제된 참가자'
gym_name = '삭제됨'
weight_kg = null
experience = ''
attendance_status = 'left'
```

요청 삭제 후 `pairings.sparring_request_a_id` 및 `sparring_request_b_id`는 FK 규칙에 따라 `NULL`이 될 수 있다. 상대 참가자 행, pairing, pairing history는 수정하거나 삭제하지 않는다.

## pairing_history payload 분석

현재 production 구조에서 `pairing_history.payload`는 participant/request UUID를 가질 수 있지만, `auth.users.id`, 표시 이름, 체육관, 체중, 경력을 저장하는 필드로 사용되지 않는다.

공유 pairing 처리 후에는 participant UUID가 비식별화된 `event_participants` 행만 가리키고, request UUID는 삭제된 `sparring_requests` 행을 더 이상 참조하지 않는다. 따라서 알려진 production 테이블 범위에서는 payload UUID만으로 삭제 요청자를 다시 `auth.users` 또는 직접 개인정보에 연결할 수 없다.

단, UUID가 외부 운영 기록, 백업, 로그 또는 아직 조사하지 않은 테이블에 함께 저장되어 있다면 재식별 가능성이 생긴다. SQL 실행 전 dry-run 결과와 운영 기록을 대조해야 하며, 이 절차는 백업·로그·외부 서비스의 삭제를 보장하지 않는다.

## Auth 계정 삭제는 별도 단계

앱 데이터 삭제와 Supabase Auth 삭제를 같은 SQL로 처리하지 않는다.

1. 먼저 `event_participants`와 `fighter_nicknames`를 처리한다.
2. Auth 계정 삭제가 명시적으로 요청된 경우에만 Supabase Dashboard 또는 service-role을 사용하는 신뢰된 서버에서 해당 `auth.users.id`를 삭제한다.
3. 현재 스키마에서 Auth 사용자만 먼저 삭제하면 `event_participants.user_id`는 `NULL`이 되지만 표시 이름·체육관·체중·경력은 남으므로, Auth 삭제를 선행하면 안 된다.
4. Auth 삭제 전에 해당 사용자가 소유한 Storage 객체가 있는지 Dashboard에서 확인한다. 현재 출시 범위에는 이용자 Storage 업로드가 없지만, 실제 객체가 있으면 별도 처리한다.
5. Supabase Auth의 기존 access token은 만료 전까지 유효할 수 있다. 삭제 후 세션과 토큰 처리 상태는 Dashboard 또는 신뢰된 서버 운영 절차에서 확인한다.

## 완료와 회신

1. SQL 실행 직후 `PART 3` 검증 SELECT로 대상 `user_id`가 남아 있지 않은지 확인한다.
2. 공유 pairing이 있던 경우에는 직접 개인정보를 비식별화했고 공유 대진·이력은 상대 참가자 보호를 위해 유지했다는 사실을 기록한다.
3. Auth 삭제를 요청받은 경우에는 앱 데이터 처리와 Auth 계정 처리 결과를 따로 기록한다.
4. 요청자에게 처리 범위와 완료 사실만 회신한다. 다른 참가자의 정보, pairing payload, 운영자 비밀값은 회신하지 않는다.

## 실행 중단 조건

- 대상 UUID가 확정되지 않음
- dry-run 결과가 요청 정보와 일치하지 않음
- 공유 pairing 또는 payload 참조가 예상과 다름
- production schema가 이 문서의 전제와 다름
- SQL 실행 중 오류가 발생함

오류가 발생하면 `ROLLBACK`하고, 재시도 전에 원인을 수동 검토한다. 이 절차는 법률 자문이나 보관 의무 판단을 대체하지 않는다.
