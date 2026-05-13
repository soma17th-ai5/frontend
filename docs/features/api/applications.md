# Applications API 연동

> 채팅 입력창 위의 **내 신청내역 조회** 버튼에서 사용하는 API.
> 백엔드 실제 스펙 기준: Swagger UI `GET /api/v1/applications List History`.
>
> **백엔드 베이스 URL:** `http://insung-server.servemp3.com:8000` (`.env.local`의 `SOMA_API_BASE_URL`로 주입, 서버 사이드 전용)

---

## 1. 백엔드 실제 스펙

### 1.1 `GET /api/v1/applications`

로그인 사용자의 OpenSoma 신청 내역을 조회한다.

**요청**

```http
GET /api/v1/applications?soma_user_id=<soma_user_id>&force_refresh=false
x-soma-session: <session_id>
```

| 위치   | 필드             | 타입             | 필수   | 기본값  | 설명                               |
| ------ | ---------------- | ---------------- | ------ | ------- | ---------------------------------- |
| query  | `soma_user_id`   | `string`         | 예     | -       | 로그인한 SOMA 사용자 ID            |
| query  | `force_refresh`  | `boolean`        | 아니오 | `false` | 캐시 무시 후 최신 내역 재조회 여부 |
| header | `x-soma-session` | `string \| null` | 예     | -       | OpenSoma 세션 ID                   |

**200 응답**

```json
{
  "items": [
    {
      "apply_sn": 0,
      "qustnr_sn": 0,
      "category": "string",
      "title": "string",
      "target_url": "string",
      "author": "string",
      "session_date_text": "string",
      "applied_at_text": "string",
      "application_status": "string",
      "approval_status": "string"
    }
  ],
  "cached_at": "string",
  "refreshed": true
}
```

### 1.2 `ApplicationHistoryItem`

실제 응답에서는 `qustnr_sn`, `target_url`이 `null`일 수 있다. 프론트 타입은 이 케이스를 허용한다.

```ts
type ApplicationHistoryItem = {
  apply_sn: number;
  qustnr_sn: number | null;
  category: string;
  title: string;
  target_url: string | null;
  author: string;
  session_date_text: string;
  applied_at_text: string;
  application_status: string;
  approval_status: string;
};
```

| 필드                 | 설명                                      |
| -------------------- | ----------------------------------------- |
| `apply_sn`           | 신청 접수 번호. 취소 API body에 필요      |
| `qustnr_sn`          | 신청/취소 식별 번호. 취소 API body에 필요 |
| `category`           | 신청 항목 카테고리                        |
| `title`              | 신청 항목 제목                            |
| `target_url`         | OpenSoma 상세 페이지 경로. 없을 수 있음   |
| `author`             | 멘토/작성자                               |
| `session_date_text`  | 세션 일시 텍스트                          |
| `applied_at_text`    | 신청 일시 텍스트                          |
| `application_status` | 신청 상태. 예: `접수완료`, `접수취소`     |
| `approval_status`    | 승인 상태                                 |

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

| HTTP | code                                        | 의미                       | 비고                                |
| ---- | ------------------------------------------- | -------------------------- | ----------------------------------- |
| 400  | `INVALID_REQUEST`                           | `soma_user_id` 누락        | 백엔드 호출 전 차단                 |
| 401  | `SOMA_AUTH_REQUIRED`                        | 세션 쿠키 없음             | 백엔드 호출 전 차단                 |
| 422  | `INVALID_REQUEST`                           | 백엔드 요청 검증 실패      | FastAPI `detail`을 `details`로 전달 |
| 503  | `UPSTREAM_TIMEOUT` / `UPSTREAM_UNAVAILABLE` | 백엔드 지연 또는 연결 실패 | `somaFetch`에서 생성                |

---

## 2. 프론트 아키텍처

### 2.1 BFF (Backend-For-Frontend) 패턴

브라우저는 **Next.js Route Handler** (`/api/v1/applications`) 만 호출하고, 실제 백엔드 호출은 서버 사이드에서 수행한다.

- `session_id`는 `httpOnly` 쿠키에만 있으므로 브라우저 JS가 직접 `x-soma-session` 헤더를 만들지 않는다.
- 세션 쿠키가 없으면 백엔드로 넘기지 않고 BFF에서 바로 401을 반환한다.
- 기본 조회는 `force_refresh=false`로 보낸다.

```
브라우저 ─────► /api/v1/applications (Next.js Route Handler) ─────► FastAPI /api/v1/applications
              (same-origin, 자동 쿠키)                            (Server-side fetch + x-soma-session)
```

### 2.2 폴더/파일 구성

| 경로                               | 역할                                                            |
| ---------------------------------- | --------------------------------------------------------------- |
| `app/api/v1/applications/route.ts` | `GET` — query 검증, 세션 확인 후 백엔드 applications API 프록시 |
| `lib/types/applications.ts`        | applications 응답 타입                                          |
| `lib/applications.ts`              | 클라이언트 fetch 함수 + 신청내역을 `MentoringCard`로 변환       |
| `components/chat/ChatInput.tsx`    | 입력창 위 빠른 실행 버튼 4개 렌더                               |
| `app/chat/page.tsx`                | 빠른 실행 분기. `내 신청내역 조회`만 applications API 호출      |
| `lib/knowledgeChat.ts`             | `kind: "applications"` 채팅 메시지 타입 추가                    |
| `components/chat/ChatMessage.tsx`  | 신청내역 카드 메시지 렌더링                                     |

---

## 3. 흐름

### 3.1 빠른 실행 버튼

채팅 입력창 위에 네 개의 버튼을 둔다.

| 버튼                 | 동작                                              |
| -------------------- | ------------------------------------------------- |
| `백엔드 멘토링 조회` | `"백엔드 멘토링 찾아줘"`를 기존 채팅 API로 전송   |
| `기획 멘토링 조회`   | `"기획 멘토링 찾아줘"`를 기존 채팅 API로 전송     |
| `공지사항 조회`      | `"최근 공지사항 요약해줘"`를 기존 채팅 API로 전송 |
| `내 신청내역 조회`   | applications API 호출 후 신청/취소 카드로 표시    |

### 3.2 내 신청내역 조회 흐름

```
사용자: "내 신청내역 조회" 버튼 클릭
       │
       ▼
채팅에 사용자 메시지 append
       │
       ▼
fetchApplications({ somaUserId })  // forceRefresh 기본 false
       │
       ▼
GET /api/v1/applications?soma_user_id=...&force_refresh=false
       │
       ▼ (Route Handler)
쿠키에서 soma_session 추출 → x-soma-session 헤더로 백엔드 호출
       │
       ▼
applicationItemsToMentoringCards(data.items)
       │
       ▼
kind: "applications" assistant 메시지 append
       │
       ▼
MentoringCardList 렌더링
```

### 3.3 신청내역 → 카드 변환 정책

applications 응답은 목록 내역이고, 채팅 UI는 기존 `MentoringCardList`를 재사용한다.

변환 정책:

- 이미 종료된 멘토링은 프론트에서 제외한다.
- `session_date_text`의 종료 시각을 파싱해 현재 시각보다 이전이면 숨긴다.
- `qustnr_sn`이 있으면 카드 `id`로 사용한다.
- `qustnr_sn`이 없고 `target_url`에 숫자가 있으면 마지막 숫자를 fallback ID로 사용한다.
- `application_status`가 `접수취소`를 포함하면 취소된 항목으로 본다.
- 취소되지 않았고 `qustnr_sn`이 있으면 `status: "applied"`로 표시해 취소 버튼을 활성화한다.
- 취소되었고 재신청에 쓸 ID를 찾을 수 있으면 `status: "open"`으로 표시한다.
- 취소도 재신청도 불가능하면 `status: "closed"`로 표시한다.

---

## 4. 구현 결정 사항

| 항목         | 결정                                                         |
| ------------ | ------------------------------------------------------------ |
| API 경로     | 브라우저/BFF: `/api/v1/applications`, 백엔드도 동일 경로     |
| 인증 전달    | `soma_session` httpOnly 쿠키 → `x-soma-session` 헤더         |
| 세션 누락    | BFF에서 즉시 `401 SOMA_AUTH_REQUIRED` 반환                   |
| 기본 refresh | `force_refresh=false`                                        |
| null 대응    | `qustnr_sn`, `target_url` null 허용                          |
| 과거 내역    | 세션 종료 시각이 현재보다 이전이면 숨김                      |
| UI 표시      | `kind: "applications"` 메시지 + `MentoringCardList` 재사용   |
| 취소         | `apply_sn`, `qustnr_sn`이 있는 카드에서 기존 cancel API 사용 |

---

## 5. 반영 내역

### 5.1 BFF Route Handler

- `app/api/v1/applications/route.ts`
  - `soma_user_id` query를 검증한다.
  - `force_refresh` query는 `"true"`일 때만 true로 처리하고, 기본값은 false다.
  - `soma_session` 쿠키가 없으면 백엔드 호출 전에 401을 반환한다.
  - 백엔드 `/api/v1/applications`에 `x-soma-session` 헤더를 붙여 프록시한다.

### 5.2 클라이언트 API와 변환

- `lib/types/applications.ts`
  - applications 응답 타입을 추가했다.
  - 실제 응답에 맞춰 `qustnr_sn`, `target_url`은 nullable로 정의했다.

- `lib/applications.ts`
  - `fetchApplications`를 추가했다.
  - 기본 `forceRefresh`는 false다.
  - `applicationItemsToMentoringCards`를 추가해 신청내역을 멘토링 카드로 변환한다.
  - `session_date_text` 기준으로 이미 종료된 멘토링을 제외한다.
  - `target_url: null`에서도 런타임 오류가 나지 않도록 처리했다.

### 5.3 채팅 UI

- `components/chat/ChatInput.tsx`
  - 입력창 위에 빠른 실행 버튼 4개를 추가했다.

- `app/chat/page.tsx`
  - 앞의 3개 버튼은 기존 채팅 전송 흐름을 사용한다.
  - `내 신청내역 조회`는 applications API를 호출한다.

- `lib/knowledgeChat.ts`, `components/chat/ChatMessage.tsx`
  - `kind: "applications"` 메시지를 추가했다.
  - 신청내역은 기존 `MentoringCardList`로 렌더링한다.

### 5.4 검증

- `npm run lint` 통과
- `npm run build` 통과
