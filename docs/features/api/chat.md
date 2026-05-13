# Chat API 연동

> SomaAgent FastAPI 백엔드의 채팅 엔드포인트와 Next.js 프론트의 연동 방식을 정리한 문서.
> 백엔드 실제 스펙 기준: Swagger UI `POST /api/v1/chat Ask Knowledge`.
>
> **백엔드 베이스 URL:** `http://insung-server.servemp3.com:8000` (`.env.local`의 `SOMA_API_BASE_URL`로 주입, 서버 사이드 전용)

---

## 1. 백엔드 실제 스펙

> Swagger UI: `http://insung-server.servemp3.com:8000/docs#/default`
> 주의: 기존 knowledge API였던 `/api/v1/knowledge/ask`는 채팅 화면에서 더 이상 사용하지 않는다. 현재 채팅은 **`POST /api/v1/chat`** 를 사용한다.

### 1.1 `POST /api/v1/chat`

**요청**

```http
POST /api/v1/chat
Content-Type: application/json

{
  "message": "이번 주 백엔드 멘토링 찾아줘"
}
```

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `message` | `string` | 예 | 사용자 질문 또는 이전 대화 맥락을 포함한 질문 문자열 |

**200 응답**

```json
{
  "answer": "string",
  "sources": [
    {
      "chunk_id": "string",
      "source_type": "NOTICE",
      "source_id": "string",
      "title": "string",
      "text": "string",
      "official": true,
      "score": 0,
      "created_at": "2026-05-13T01:27:36.165Z",
      "source_url": "string",
      "room_name": "string"
    }
  ],
  "llm_used": true,
  "llm_error": "string",
  "metadata": {
    "additionalProp1": {}
  }
}
```

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `answer` | `string` | 사용자에게 표시할 답변 본문 |
| `sources` | `KnowledgeSource[]` | 답변 근거 목록 |
| `llm_used` | `boolean` | LLM 요약 사용 여부 |
| `llm_error` | `string \| null` | LLM 처리 오류. 없으면 `null` 또는 누락 가능 |
| `metadata` | `Record<string, unknown>` | 백엔드 부가 정보. 현재 UI에서는 표시하지 않음 |

### 1.2 `KnowledgeSource`

```ts
type KnowledgeSource = {
  chunk_id: string;
  source_type: "NOTICE" | "NOTICE_PDF" | "MENTORING" | "WEBEX_MESSAGE";
  source_id: string;
  title: string;
  text: string;
  official: boolean;
  score: number;
  created_at?: string | null;
  source_url?: string | null;
  room_name?: string | null;
};
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
| 400 | `INVALID_REQUEST` | 프론트 BFF 요청 본문 파싱 실패 또는 빈 `message` | 백엔드 호출 전 차단 |
| 401 | `SOMA_AUTH_REQUIRED` | 세션 만료/없음 | 백엔드 응답을 정규화해서 전달 |
| 422 | `INVALID_REQUEST` | 백엔드 요청 검증 실패 | FastAPI `detail`을 `details`로 전달 |
| 503 | `UPSTREAM_TIMEOUT` / `UPSTREAM_UNAVAILABLE` | 백엔드 지연 또는 연결 실패 | `somaFetch`에서 생성 |

---

## 2. 프론트 아키텍처

### 2.1 BFF (Backend-For-Frontend) 패턴

브라우저는 **Next.js Route Handler** (`/api/v1/chat`) 만 호출하고, 실제 백엔드 호출은 서버 사이드에서 수행한다.

- `session_id`는 `httpOnly` 쿠키에만 있으므로 브라우저 JS가 직접 백엔드 `x-soma-session` 헤더를 만들지 않는다.
- 백엔드 베이스 URL을 클라이언트 번들에 노출하지 않는다.
- CORS와 mixed-content 문제를 피한다.
- 기존 `/api/v1/knowledge/ask` 프록시는 제거하고 `/api/v1/chat`로 단일화했다.

```
브라우저 ─────► /api/v1/chat (Next.js Route Handler) ─────► FastAPI /api/v1/chat
              (same-origin, 자동 쿠키)                    (Server-side fetch + x-soma-session)
```

### 2.2 폴더/파일 구성

| 경로 | 역할 |
| --- | --- |
| `app/api/v1/chat/route.ts` | `POST` — 요청 body 검증 후 백엔드 `/api/v1/chat`로 프록시 |
| `app/api/v1/knowledge/ask/route.ts` | 삭제됨 — 기존 knowledge ask 프록시 |
| `lib/knowledge.ts` | 클라이언트용 `askKnowledge({ message })` 함수. same-origin `/api/v1/chat` 호출 |
| `lib/types/knowledge.ts` | `KnowledgeChatRequest`, `KnowledgeChatResponse`, `KnowledgeSource` 타입 |
| `lib/knowledgeContext.ts` | 이전 대화 턴을 `message` 문자열에 합쳐 후속 질문 맥락 구성 |
| `lib/knowledgeChat.ts` | 채팅 스레드 메시지 타입 |
| `app/chat/page.tsx` | 사용자 입력 전송, 응답 메시지 append, 에러 메시지 처리 |
| `components/chat/ChatMessage.tsx` | 답변, LLM 사용 여부, 출처, 멘토링 카드 렌더링 |
| `lib/knowledgeSourceToUi.ts` | `KnowledgeSource`를 공통 `Source` UI 타입으로 변환 |
| `lib/knowledgeToMentoring.ts` | `MENTORING` 출처를 신청 가능한 멘토링 카드 후보로 변환 |

### 2.3 타입 매핑

```ts
export type KnowledgeChatRequest = {
  message: string;
};

export type KnowledgeChatResponse = {
  answer: string;
  sources: KnowledgeSource[];
  llm_used: boolean;
  llm_error?: string | null;
  metadata?: Record<string, unknown> | null;
};
```

기존 `KnowledgeAskRequest`의 `query`, `source_types`, `official_only`, `room_name`, `k` 필드는 새 채팅 스펙에 없으므로 제거했다.

### 2.4 출처 UI 변환

`source_type`은 화면 공통 출처 타입으로 변환한다.

| 백엔드 `source_type` | UI `Source.type` |
| --- | --- |
| `NOTICE` | `notice` |
| `NOTICE_PDF` | `notice_pdf` |
| `MENTORING` | `mentoring` |
| `WEBEX_MESSAGE` | `webex_message` |

`source_url`이 있으면 링크로 사용하고, 링크가 없으면 `text` 일부를 `rawRef`로 보여준다.

---

## 3. 흐름

### 3.1 정상 질문 흐름

```
[/chat 페이지]
  사용자: 메시지 입력
       │
       ▼
ChatInput.onSend(text)
       │
       ▼
buildKnowledgeQueryWithContext(priorMessages, text)
       │
       ▼
askKnowledge({ message: messageForApi }, signal)
       │
       ▼
POST /api/v1/chat (same-origin, JSON body)
       │
       ▼ (Route Handler)
쿠키에서 soma_session 추출 → x-soma-session 헤더로 백엔드 호출
       │
       ▼
somaFetch("/api/v1/chat", { json: { message }, sessionId })
       │
       ▼
응답 answer/sources/llm_used/llm_error를 ThreadMessage로 append
       │
       ▼
ChatMessage가 답변, LLM 상태, 출처, 멘토링 카드 렌더링
```

### 3.2 후속 질문 맥락 처리

새 백엔드 스펙은 요청 body에 `message`만 받는다. 별도 `candidates_context`나 `history` 필드가 없으므로, 현재 구현은 최근 대화 턴을 문자열로 접어서 `message`에 포함한다.

정책:

- 최근 사용자/assistant knowledge 메시지만 사용한다.
- 최대 최근 3턴을 포함한다.
- assistant 답변은 최대 600자, user 입력은 최대 400자로 자른다.
- 출처 제목 일부를 함께 넣어 "이거", "그 멘토링" 같은 후속 질문의 지시 대상을 보강한다.

### 3.3 요청 취소

새 메시지를 보내면 이전 진행 중 요청은 `AbortController`로 취소한다. 취소된 요청은 에러 메시지를 화면에 append하지 않는다.

---

## 4. 에러 처리

### 4.1 BFF 요청 검증

`app/api/v1/chat/route.ts`는 백엔드 호출 전에 다음을 검증한다.

```ts
typeof message === "string" && message.trim().length > 0
```

검증 실패 시:

```json
{
  "code": "INVALID_REQUEST",
  "message": "메시지(message)를 한 글자 이상 입력해 주세요."
}
```

### 4.2 클라이언트 사용자 메시지

`app/chat/page.tsx`의 `describeKnowledgeError`가 사용자 노출 메시지를 결정한다.

| 조건 | 사용자 메시지 |
| --- | --- |
| 400 / 422 | 서버가 내려준 메시지 |
| 500 이상 | `서버가 잠시 응답하지 않습니다. 잠시 후 다시 시도해 주세요.` |
| AbortError | `요청이 취소되었습니다.` |
| 기타 Error | `error.message` |
| 알 수 없는 오류 | `알 수 없는 오류가 발생했습니다.` |

---

## 5. 구현 결정 사항

| 항목 | 결정 |
| --- | --- |
| 채팅 API 경로 | 브라우저와 BFF 모두 `/api/v1/chat` 사용 |
| 백엔드 실제 호출 | 서버 사이드에서 `SOMA_API_BASE_URL + /api/v1/chat` 호출 |
| 인증 전달 | `soma_session` httpOnly 쿠키 → `x-soma-session` 헤더 |
| 요청 필드 | `{ message }`만 전송 |
| 후속 질문 맥락 | 별도 필드 없이 `message` 문자열에 포함 |
| `metadata` | 타입에는 포함, 현재 UI에서는 표시하지 않음 |
| 기존 knowledge ask | `/api/v1/knowledge/ask`, `query`, `KnowledgeAsk*` 제거 |
| 멘토링 카드 | `sources` 중 `source_type === "MENTORING"`이고 `source_id`가 숫자인 항목만 후보 |
| 검증 | `npm run lint`, `npm run build` 통과 |
