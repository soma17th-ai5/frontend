# Mentoring Apply/Cancel API 연동

> 채팅 답변에 표시되는 멘토링 카드의 **신청하기 / 신청 취소하기** 버튼에서 사용하는 API.
> 백엔드 실제 스펙 기준: Swagger UI `POST /api/v1/mentoring/{mentoring_id}/apply`, `POST /api/v1/mentoring/cancel`.
>
> **백엔드 베이스 URL:** `http://insung-server.servemp3.com:8000` (`.env.local`의 `SOMA_API_BASE_URL`로 주입, 서버 사이드 전용)

---

## 1. 백엔드 실제 스펙

> Swagger UI: `http://insung-server.servemp3.com:8000/docs`
> 인증 세션은 `x-soma-session` 헤더로 전달한다. 프론트에서는 브라우저가 이 값을 직접 다루지 않고, Next.js Route Handler가 httpOnly 쿠키에서 꺼내 백엔드로 전달한다.

### 1.1 `POST /api/v1/mentoring/{mentoring_id}/apply`

멘토링을 신청한다.

**요청**

```http
POST /api/v1/mentoring/{mentoring_id}/apply
x-soma-session: <session_id>
Content-Type: application/json

{
  "soma_user_id": "string"
}
```

| 위치 | 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- | --- |
| path | `mentoring_id` | `integer` | 예 | 신청할 멘토링 ID |
| header | `x-soma-session` | `string \| null` | 예 | OpenSoma 세션 ID |
| body | `soma_user_id` | `string` | 예 | 로그인한 SOMA 사용자 ID |

**200 응답**

```json
{
  "type": "string",
  "status": "success",
  "message": "string",
  "payload": {
    "additionalProp1": {}
  }
}
```

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `type` | `string` | 액션 타입. 예: `MENTORING_APPLY`, `mentoring_apply` |
| `status` | `string` | 처리 상태. 현재 프론트는 `success`, `failed`를 해석 |
| `message` | `string` | 사용자에게 표시할 처리 결과 메시지 |
| `payload` | `Record<string, unknown>` | 부가 데이터. `apply_sn`, `qustnr_sn`, `mentoring_id`, `title` 등이 있으면 카드 취소 상태에 활용 |

### 1.2 `POST /api/v1/mentoring/cancel`

신청한 멘토링을 취소한다.

**요청**

```http
POST /api/v1/mentoring/cancel
x-soma-session: <session_id>
Content-Type: application/json

{
  "apply_sn": 1,
  "qustnr_sn": 1,
  "soma_user_id": "string"
}
```

| 위치 | 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- | --- |
| header | `x-soma-session` | `string \| null` | 예 | OpenSoma 세션 ID |
| body | `apply_sn` | `integer` | 예 | 신청 접수 번호 |
| body | `qustnr_sn` | `integer` | 예 | 신청 설문/질문 번호 |
| body | `soma_user_id` | `string` | 예 | 로그인한 SOMA 사용자 ID |

**200 응답**

```json
{
  "type": "string",
  "status": "success",
  "message": "string",
  "payload": {
    "additionalProp1": {}
  }
}
```

### 1.3 에러 응답

백엔드 검증 실패는 FastAPI 표준 422 형태로 내려온다.

```json
{
  "detail": [
    {
      "loc": ["string", 0],
      "msg": "string",
      "type": "string",
      "input": "string",
      "ctx": {}
    }
  ]
}
```

프론트 BFF는 `somaFetch`를 통해 FastAPI 422를 `{ code, message, details }` 형태로 정규화한다.

| HTTP | code | 의미 | 비고 |
| --- | --- | --- | --- |
| 400 | `INVALID_REQUEST` | 프론트 BFF 요청 본문 파싱 실패 또는 필수 값 누락 | 백엔드 호출 전 차단 |
| 401 | `SOMA_AUTH_REQUIRED` | 세션 만료/없음 | 백엔드 응답을 정규화해서 전달 |
| 409 | 백엔드 code | 이미 신청됨, 마감, 취소 불가 등 상태 충돌 | 백엔드 응답을 그대로 표시 |
| 422 | `INVALID_REQUEST` | 백엔드 요청 검증 실패 | FastAPI `detail`을 `details`로 전달 |
| 503 | `UPSTREAM_TIMEOUT` / `UPSTREAM_UNAVAILABLE` | 백엔드 지연 또는 연결 실패 | `somaFetch`에서 생성 |

---

## 2. 프론트 아키텍처

### 2.1 BFF (Backend-For-Frontend) 패턴

브라우저는 **Next.js Route Handler** (`/api/v1/mentoring/*`) 만 호출하고, 실제 백엔드 호출은 서버 사이드에서 수행한다.

- `session_id`는 `httpOnly` 쿠키에만 있으므로 브라우저 JS가 직접 `x-soma-session` 헤더를 만들지 않는다.
- 백엔드 베이스 URL을 클라이언트 번들에 노출하지 않는다.
- CORS와 mixed-content 문제를 피한다.

```
브라우저 ─────► /api/v1/mentoring/* (Next.js Route Handler) ─────► FastAPI /api/v1/mentoring/*
              (same-origin, 자동 쿠키)                           (Server-side fetch + x-soma-session)
```

### 2.2 폴더/파일 구성

| 경로 | 역할 |
| --- | --- |
| `app/api/v1/mentoring/[mentoringId]/apply/route.ts` | `POST` — 신청 요청 검증 후 백엔드 apply API로 프록시 |
| `app/api/v1/mentoring/cancel/route.ts` | `POST` — 취소 요청 검증 후 백엔드 cancel API로 프록시 |
| `lib/mentoringApply.ts` | 클라이언트용 신청/취소 API 함수와 응답 정규화 |
| `components/chat/MentoringCardList.tsx` | 카드 신청/취소 확인 모달, API 호출, 로컬 카드 상태 갱신 |
| `components/chat/MentoringCard.tsx` | 신청/취소 버튼과 카드 상태 렌더링 |
| `lib/types/action.ts` | 채팅에 append할 `ActionResult` 타입 |
| `lib/types/mentoring.ts` | 멘토링 카드 UI 타입 |

### 2.3 응답 정규화

백엔드는 `type`, `status`, `message`, `payload` 형태를 반환한다. 화면은 기존 `ActionResultBanner`를 재사용하기 위해 이 응답을 `ActionResult`로 변환한다.

```ts
type ActionResult = {
  actionType: "MENTORING_APPLY" | "MENTORING_CANCEL";
  status: "success" | "failed";
  message: string;
  data?: {
    application?: {
      applySn: number;
      qustnrSn: number;
      mentoringId: string;
      title: string;
      sessionStartedAt?: string;
    };
  };
  error?: {
    code: string;
    message: string;
    recoverable: boolean;
  };
};
```

`payload`에 `apply_sn`, `qustnr_sn`이 있으면 `application`으로 변환한다. 신청 성공 후 이 값을 카드 로컬 상태에 저장해야 이후 취소 API를 호출할 수 있다.

---

## 3. 흐름

### 3.1 신청 흐름

```
채팅 답변의 멘토링 카드
       │
       ▼
"이 멘토링 신청하기" 클릭
       │
       ▼
ConfirmDialog에서 확인
       │
       ▼
applyMentoringViaApi(mentoringId, { somaUserId, title })
       │
       ▼
POST /api/v1/mentoring/{mentoringId}/apply (same-origin)
       │
       ▼ (Route Handler)
쿠키에서 soma_session 추출 → x-soma-session 헤더로 백엔드 호출
       │
       ▼
somaFetch("/api/v1/mentoring/{mentoringId}/apply", { json: { soma_user_id }, sessionId })
       │
       ▼
응답을 ActionResult로 정규화
       │
       ▼
성공 시 카드 상태 applied, applySn/qustnrSn 저장
       │
       ▼
채팅 흐름에 action_result 메시지 append
```

### 3.2 취소 흐름

```
신청 완료 상태의 멘토링 카드
       │
       ▼
"신청 취소하기" 클릭
       │
       ▼
ConfirmDialog에서 확인
       │
       ▼
cancelMentoringViaApi({ applySn, qustnrSn, somaUserId })
       │
       ▼
POST /api/v1/mentoring/cancel (same-origin)
       │
       ▼ (Route Handler)
쿠키에서 soma_session 추출 → x-soma-session 헤더로 백엔드 호출
       │
       ▼
somaFetch("/api/v1/mentoring/cancel", { json: { apply_sn, qustnr_sn, soma_user_id }, sessionId })
       │
       ▼
응답을 ActionResult로 정규화
       │
       ▼
성공 시 카드 상태 open, applySn/qustnrSn 제거
       │
       ▼
채팅 흐름에 action_result 메시지 append
```

### 3.3 취소에 필요한 ID

취소 API는 `mentoring_id`가 아니라 `apply_sn`, `qustnr_sn`을 요구한다. 채팅 검색 결과의 멘토링 카드는 처음에는 이 값을 갖지 않을 수 있다.

현재 구현 정책:

- 신청 성공 응답의 `payload.apply_sn`, `payload.qustnr_sn`을 카드 로컬 상태에 저장한다.
- 이후 같은 카드의 취소 버튼을 누르면 저장된 값을 cancel API에 사용한다.
- 값이 없으면 백엔드 호출 전에 실패 `ActionResult`를 채팅에 표시한다.

---

## 4. 구현 결정 사항

| 항목 | 결정 |
| --- | --- |
| 신청 API 경로 | 브라우저/BFF: `/api/v1/mentoring/{mentoringId}/apply`, 백엔드도 동일 경로 |
| 취소 API 경로 | 브라우저/BFF: `/api/v1/mentoring/cancel`, 백엔드도 동일 경로 |
| 인증 전달 | `soma_session` httpOnly 쿠키 → `x-soma-session` 헤더 |
| 신청 요청 body | `{ soma_user_id }`만 전송 |
| 취소 요청 body | `{ apply_sn, qustnr_sn, soma_user_id }` 전송 |
| 응답 처리 | 백엔드 응답을 `ActionResult`로 정규화해 기존 결과 배너 재사용 |
| 신청 성공 상태 | 카드 상태를 `applied`로 변경하고 `applySn/qustnrSn` 저장 |
| 취소 성공 상태 | 카드 상태를 `open`으로 되돌리고 `applySn/qustnrSn` 제거 |
| 취소 ID 누락 | 백엔드 호출 없이 실패 배너 표시 |

---

## 5. 반영 내역

### 5.1 BFF Route Handler

- `app/api/v1/mentoring/[mentoringId]/apply/route.ts`
  - 문서 스펙에 맞춰 요청 body에서 `confirmed`를 제거하고 `{ soma_user_id }`만 백엔드로 전달한다.
  - `mentoringId`는 양의 정수로 검증한다.
  - `soma_user_id`는 빈 문자열을 거부한다.

- `app/api/v1/mentoring/cancel/route.ts`
  - 새 Route Handler를 추가했다.
  - `{ apply_sn, qustnr_sn, soma_user_id }`를 검증한다.
  - 쿠키의 `soma_session`을 `x-soma-session` 헤더로 백엔드 `/api/v1/mentoring/cancel`에 전달한다.

### 5.2 클라이언트 API

- `lib/mentoringApply.ts`
  - `applyMentoringViaApi`가 `{ soma_user_id }`만 전송하도록 변경했다.
  - `cancelMentoringViaApi`를 추가했다.
  - apply/cancel 공통 응답을 `ActionResult`로 정규화하는 `normalizeMentoringResponse`를 추가했다.
  - `payload.apply_sn`, `payload.qustnr_sn`, `payload.mentoring_id`, `payload.title`을 `ActionResult.data.application`으로 매핑한다.

### 5.3 카드 UI 흐름

- `components/chat/MentoringCardList.tsx`
  - `openapi_mentoring` 모드에서 신청뿐 아니라 취소도 실제 mentoring API를 호출하도록 변경했다.
  - 신청 성공 시 응답의 `applySn/qustnrSn`을 카드 로컬 상태에 저장한다.
  - 취소 성공 시 카드 상태를 `open`으로 되돌리고 `applySn/qustnrSn`을 제거한다.
  - 취소에 필요한 ID가 없으면 백엔드 호출 전에 실패 결과를 채팅에 append한다.

### 5.4 검증

- `npm run lint` 통과
- `npm run build` 통과
