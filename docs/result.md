# 최종 구현 요약

작성일: 2026-05-13

본 문서는 현재 프론트 구현 결과를 API 연동 중심으로 정리한다. 화면 배치, 카드 스타일, 아이콘 등 UI 세부 구현은 제외한다.

## 1. 전체 구조

- 브라우저는 백엔드에 직접 붙지 않고 Next.js Route Handler를 BFF로 호출한다.
- `session_id`는 브라우저 JS에서 읽지 않고 `httpOnly` 쿠키(`soma_session`)에 저장한다.
- BFF는 쿠키에서 세션을 꺼내 백엔드 요청의 `x-soma-session` 헤더로 전달한다.
- 백엔드 기준 URL은 `SOMA_API_BASE_URL`이며, 기본값은 `http://insung-server.servemp3.com:8000`이다.
- 공통 백엔드 호출은 `lib/server/somaApi.ts`, 브라우저 호출은 `lib/api.ts`의 `apiFetch`를 사용한다.

## 2. 구현된 기능

| 영역 | 브라우저/BFF 경로 | 실제 백엔드 호출 | 구현 요약 |
| --- | --- | --- | --- |
| 로그인 | `POST /api/auth/login` | `POST /auth/login` | ID/PW 전달, `session_id`를 httpOnly 쿠키로 저장, 사용자 정보만 클라이언트에 반환 |
| 로그아웃 | `POST /api/auth/logout` | `DELETE /auth/session` | 쿠키를 우선 삭제하고 백엔드 세션 삭제 호출 |
| 세션 확인 | `GET /api/auth/whoami` | `GET /auth/whoami` | 쿠키 세션 검증, 401이면 쿠키 삭제 |
| 채팅 | `POST /api/v1/chat` | `POST /api/v1/chat` | 기존 knowledge ask 대신 chat API 사용, `message` 기반 질의 |
| 멘토링 신청 | `POST /api/v1/mentoring/{id}/apply` | 동일 | body는 `{ soma_user_id }`, 세션은 BFF가 헤더로 전달 |
| 멘토링 취소 | `POST /api/v1/mentoring/cancel` | 동일 | body는 `{ apply_sn, qustnr_sn, soma_user_id }` |
| 신청 내역 | `GET /api/v1/applications` | 동일 | `soma_user_id`, `force_refresh=false`로 조회 |

## 3. 인증/세션 구현

- 로그인 성공 시 백엔드 응답의 `session_id`는 클라이언트 응답에 노출하지 않는다.
- 쿠키 옵션은 `httpOnly`, `sameSite=lax`, `path=/`, 운영 환경에서 `secure=true`, `maxAge=24h`다.
- 앱 진입 시 `AuthContext`가 `/api/auth/whoami`를 호출해 세션을 복구한다.
- `/chat`은 인증 상태가 아니면 `/login`으로 이동한다.
- 로그아웃은 백엔드 호출 실패 여부와 관계없이 프론트 상태와 쿠키를 폐기한다.

## 4. 채팅 구현

- 기존 `/api/v1/knowledge/ask` 흐름은 사용하지 않고 `/api/v1/chat`로 단일화했다.
- 요청 body는 `{ message }`만 보낸다.
- 후속 질문 맥락은 별도 `candidates_context` 필드가 아니라 `lib/knowledgeContext.ts`에서 이전 대화 내용을 `message` 문자열에 합쳐 전달한다.
- 응답은 `KnowledgeChatResponse`로 받고, 답변/출처/LLM 사용 여부/멘토링 후보를 내부 메시지 타입으로 변환한다.
- 요청 중 새 요청이 발생하거나 컴포넌트가 해제되면 `AbortController`로 진행 중 요청을 취소한다.

## 5. 멘토링 신청/취소 구현

- 신청은 `mentoring_id` path parameter와 body의 `soma_user_id`를 검증한 뒤 백엔드에 전달한다.
- 취소는 `apply_sn`, `qustnr_sn`, `soma_user_id`를 검증한 뒤 백엔드에 전달한다.
- 백엔드 응답은 `lib/mentoringApply.ts`에서 `ActionResult` 형태로 정규화한다.
- 응답 payload의 `apply_sn`, `qustnr_sn`, `mentoring_id`, `title`은 후속 취소 상태 갱신에 쓰는 application 데이터로 매핑한다.
- 4xx/5xx 응답은 `ApiError`로 파싱하고, 멘토링 액션 결과는 실패 `ActionResult`로 변환한다.

## 6. 신청 내역 구현

- `GET /api/v1/applications?soma_user_id=...&force_refresh=false`로 호출한다.
- `force_refresh`는 명시하지 않으면 항상 `false`로 보낸다.
- BFF는 `soma_user_id` 누락 시 백엔드 호출 전에 400을 반환한다.
- `target_url` 또는 `qustnr_sn`이 `null`일 수 있어 null-safe로 처리한다.
- `session_date_text`의 종료 시각이 현재 시각보다 과거인 항목은 프론트에서 제외한다.
- `접수완료` 항목은 취소 가능한 상태로, `접수취소` 항목은 다시 신청 가능한 상태로 매핑한다.

## 7. 기존 API 문서와 현재 구현의 차이

| 문서 기준 | 현재 구현 | 비고 |
| --- | --- | --- |
| 인증 API가 `/api/v1/auth/login/logout/status` | 브라우저는 `/api/auth/login/logout/whoami`, 백엔드는 `/auth/login`, `/auth/session`, `/auth/whoami` | 실제 백엔드 스펙을 우선 반영 |
| 로그인 응답에 `session_id` 포함 | `session_id`는 쿠키에만 저장하고 클라이언트 응답에는 제외 | httpOnly 쿠키 정책을 강하게 적용 |
| `/api/v1/auth/status`가 `integrations` 반환 | 현재는 `/api/auth/whoami`로 사용자 정보만 확인 | Webex/OpenSoma 통합 상태 확인은 미구현 |
| 모든 `/api/v1/*` 요청에 `X-Soma-Session`, `X-Session-Id` 동봉 | `X-Soma-Session`은 BFF가 쿠키에서 꺼내 백엔드에 전달, `X-Session-Id`는 미구현 | 브라우저는 세션 헤더를 직접 만들지 않음 |
| 세션 만료 시 `X-Soma-Session-Expired` 전역 감지 후 재로그인/재전송 | `whoami` 401과 각 요청 오류를 개별 처리 | 전역 인터셉터/자동 재전송은 미구현 |
| 액션 실행은 `/api/v1/actions/execute` | 멘토링 신청/취소 전용 API를 직접 호출 | 실제 mentoring API 스펙을 우선 반영 |
| 채팅 요청에 `candidates_context` 별도 전달 | 이전 대화 맥락을 `message` 문자열에 합쳐 전달 | 현재 백엔드 chat 스펙에 맞춤 |
| `/api/v1/system/sync-info` 동기화 상태 | 현재 화면/코드에서 제거 | 최종 범위에서 제외 |

## 8. 제거/정리된 범위

- Google Calendar 관련 문구와 동작은 제거했다.
- 기존 knowledge ask API 경로는 채팅에서 사용하지 않는다.
- 사이드바용 목 대화 데이터와 미사용 동기화 상태 코드는 제거했다.
- 문서와 실제 백엔드가 충돌하는 부분은 `docs/features/api/*.md`의 실제 Swagger 기준을 우선했다.

## 9. 검증

- `npm run lint` 통과
- `npm run build` 통과
  - 최초 빌드는 샌드박스 네트워크 제한으로 Google Fonts fetch가 실패했다.
  - 네트워크 허용 후 재실행하여 production build 성공을 확인했다.
