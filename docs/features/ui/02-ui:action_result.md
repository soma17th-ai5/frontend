# ui:action_result

### Spec 참조

- API 설계 §2.2 `ChatUIBlock.action_result` / §3.1 `ActionExecutionResponse`
- frontEndSpec.md §3.1(컴포넌트 매핑), §3.3(액션 실행 흐름)

### Path

- ChatUIBlock.action_result

### 설명

- 멘토링 신청/취소 같은 사용자 액션의 처리 결과를 채팅 메시지 안에 배너로 표시한다.
- 현재 톤은 `success`, `failed` 두 단계만 사용한다.

---

### 구현 내용

#### 1. 파일 구조

```
lib/
  types/
    action.ts                       ActionType / ApplicationData / ActionResult / 톤 파생
components/
  chat/
    ActionResultBanner.tsx          배너 컴포넌트
    ChatMessage.tsx                 `kind === "action_result"` 분기
```

#### 2. 타입 컨트랙트

```ts
type ActionType = "MENTORING_APPLY" | "MENTORING_CANCEL";

type ActionResult = {
  actionType: ActionType;
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
  error?: { code: string; message: string; recoverable: boolean };
  traceId?: string;
};
```

#### 3. 톤 파생 규칙

```
status === "failed"  → "failed"
otherwise            → "success"
```

#### 4. 배너 UX

| 톤 | 색상 | 상단 라벨 | 본문 강조 |
| --- | --- | --- | --- |
| `success` | emerald | "신청 완료" / "취소 완료" | 멘토링 정보 |
| `failed` | rose | "실패" | `error.code`/`error.message` + recoverable 시 재시도 안내 |

세부:

- **헤더 영역**: 아이콘 + 액션 라벨 + `actionType` 칩.
- **본문**: `result.message`를 그대로 표시한다.
- **`ApplicationSummary`**: 멘토링 제목 / 시작 시각(있을 때만) / 접수번호(`#applySn`). `qustnrSn`은 사용자에게 의미 없으므로 노출하지 않는다.
- **`ErrorSummary`**: 코드 + 메시지 + `recoverable === true`일 때 재시도 가능 안내.

#### 5. 접근성

- `failed` → `role="alert" aria-live="assertive"`
- `success` → `role="status" aria-live="polite"`

#### 6. ChatMessage 통합

`message.kind === "action_result"` 분기를 추가하고, `results` 배열을 순회하며 배너를 렌더링한다.

```tsx
{message.kind === "action_result" && (
  <div className="space-y-2">
    {message.results.map((result, idx) => (
      <ActionResultBanner key={...} result={result} />
    ))}
  </div>
)}
```

#### 7. 검증

- `npm run lint` 통과.
- `npm run build` 통과.

---

#### 8. 후속 PR 반영

- 카드 신청/취소 → 확인 모달 → mentoring API 호출.
- 응답이 도착하면 `MentoringCardList`가 `ChatMessagesContext.appendMessage`를 통해 `kind: "action_result"` 메시지를 채팅 메시지 배열에 추가한다.
- 실패 케이스는 `MentoringCardList`가 클라이언트 측에서 `ActionResult { status: "failed", error }`를 합성하여 동일 흐름으로 표시한다.
