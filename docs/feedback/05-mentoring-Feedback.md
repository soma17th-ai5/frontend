components/chat/MentoringCardList.tsx
[문제점]
MentoringCardList 컴포넌트 내의 statusMap과 cardMap 상태는 items 프롭을 기반으로 초기화됩니다. 하지만 useState의 초기화 함수는 컴포넌트가 마운트될 때 단 한 번만 실행되므로, 부모로부터 전달되는 items 프롭이 변경되더라도 statusMap과 cardMap은 이전 items에 대한 상태를 계속 유지하게 됩니다. 이로 인해 items 프롭과 statusMap/cardMap 상태 간의 불일치가 발생할 수 있으며, 이는 예기치 않은 UI 오류나 비정상적인 동작으로 이어질 수 있습니다.

[개선안]
items 프롭의 변경에 반응하여 statusMap과 cardMap을 갱신하도록 useEffect 훅을 사용하거나, items 자체가 자주 변경되지 않고 statusMap/cardMap이 items의 스냅샷 역할을 하는 경우 items 프롭을 직접 useState의 초기값으로 활용하는 방식으로 수정할 수 있습니다. 여기서는 items 변경 시 상태를 재설정하는 useEffect 방식을 제안합니다.

diff --git a/components/chat/MentoringCardList.tsx b/components/chat/MentoringCardList.tsx
index 224e116..ff0e051 100644
--- a/components/chat/MentoringCardList.tsx
+++ b/components/chat/MentoringCardList.tsx
@@ -24,6 +24,7 @@ type Pending =
| { actionType: "MENTORING_CANCEL"; card: MentoringCard };

type LocalStatusMap = Record<string, MentoringCardLocalStatus>;
+// [개선안] cardMap은 items에 기반하여 초기화되므로, items 변경 시 갱신 로직 필요
type LocalCardMap = Record<string, MentoringCard>;

const ACTION_COPY: Record<
@@ -53,10 +54,18 @@ function buildInitialCardMap(items: MentoringCard[]): LocalCardMap {
return map;
}

+// [개선안] items prop 변경 시 statusMap과 cardMap을 갱신하도록 useEffect 추가
export function MentoringCardList({
items,
applyMode = "openapi_mentoring",
}: Props) {
const { user } = useAuth();
const messagesCtx = useChatMessages();

- const [statusMap, setStatusMap] = useState<LocalStatusMap>(() =>
- buildInitialStatusMap(items),
- );
- const [cardMap, setCardMap] = useState<LocalCardMap>(() =>
- buildInitialCardMap(items),
- );
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);

* // [개선안] items 프롭이 변경될 때 statusMap과 cardMap을 재초기화
* const [statusMap, setStatusMap] = useState<LocalStatusMap>(() => buildInitialStatusMap(items));
* const [cardMap, setCardMap] = useState<LocalCardMap>(() => buildInitialCardMap(items));
*
* useEffect(() => {
* setStatusMap(buildInitialStatusMap(items));
* setCardMap(buildInitialCardMap(items));
* }, [items]);
* const handleApply = useCallback(
  (card: MentoringCard) => {
  setStatusMap((prev) => ({ ...prev, [card.id]: "pending_apply" }));

  **[이유]**
  React의 `useState` 초기화 함수는 컴포넌트가 처음 렌더링될 때 한 번만 실행됩니다. 따라서 `items` 프롭이 변경되어도 `statusMap`과 `cardMap`은 기존 값을 유지하게 됩니다. `useEffect`를 사용하여 `items`가 변경될 때마다 `statusMap`과 `cardMap`을 `items`의 최신 값에 따라 재설정함으로써, 프롭과 내부 상태 간의 동기화를 보장하고 데이터 불일치로 인한 잠재적인 버그를 방지할 수 있습니다. 이는 컴포넌트의 **논리적 근거(Logical Grounding)**를 강화하고, 예상 가능한 상태 변화를 만듭니다.

  ---

### 추가 피드백 (선택 사항)

- **`app/api/v1/mentoring/[mentoringId]/apply/route.ts` - `ctx.params` 타입:**
  - 현재 `ctx: { params: Promise<{ mentoringId: string }> }`로 되어 있으나, Next.js Route Handler의 `params`는 일반적으로 `Promise`가 아닌 일반 객체로 전달됩니다 (`{ params: { mentoringId: string } }`). 실제로 `const { mentoringId } = await ctx.params;` 대신 `const { mentoringId } = ctx.params;`로 접근할 것입니다. 이 부분은 실제 Next.js 버전과 사용 방식에 따라 확인이 필요합니다. 만약 `Promise`가 아니라면 타입을 수정하는 것이 더 정확합니다.

전반적으로 이번 PR은 높은 품질과 스타일 가이드를 잘 준수하고 있습니다. 위에 언급된 `MentoringCardList.tsx`의 상태 동기화 문제만 해결된다면 더욱 완벽한 코드가 될 것입니다. 수고하셨습니다!

---

## 처리 내역

### 반영한 피드백

- `components/chat/MentoringCardList.tsx`의 `items` prop 변경 시 `statusMap` / `cardMap`이 갱신되지 않는 문제 제기는 타당하다고 판단했다.
- `items`를 기반으로 한 전체 카드 상태 스냅샷을 state에 보관하지 않도록 변경했다.

다만 피드백의 단순 재초기화 방식은 그대로 적용하지 않았다. 현재 카드 UI는 신청 성공 후 백엔드 응답의 `applySn` / `qustnrSn`을 로컬 `cardMap`에 저장하고, 같은 카드에서 취소 API를 호출할 때 이 값을 사용한다. `items` 배열이 새 참조로 들어올 때마다 전체를 초기화하면 신청 직후 저장한 취소용 ID가 사라질 수 있다.

그래서 다음 방식으로 구현했다.

- `statusMap`과 `cardMap`은 더 이상 `items` 전체 복사본이 아니라 사용자 액션으로 생긴 로컬 override만 저장한다.
- 렌더링 시 항상 최신 `items`를 기준으로 그리고, 필요한 경우에만 `cardMap[item.id]`의 `status` / `applySn` / `qustnrSn`을 덧씌운다.
- 새 item은 별도 동기화 없이 최신 `items`에서 바로 렌더링된다.
- 사라진 item은 `items.map(...)` 대상에서 빠지므로 stale map 항목이 화면에 영향을 주지 않는다.
- 신청 성공 후 받은 `applySn` / `qustnrSn`은 override로 보존되어 취소 API 호출에 계속 사용할 수 있다.

### 반영하지 않은 피드백

- `app/api/v1/mentoring/[mentoringId]/apply/route.ts`의 `ctx.params`를 일반 객체 타입으로 바꾸자는 선택 피드백은 반영하지 않았다.
- 현재 프로젝트는 Next 16이고, `ctx: { params: Promise<{ mentoringId: string }> }` 형태로 `npm run build`가 통과한다. Next 최신 App Router 타입과 충돌하지 않으므로 변경하지 않는 편이 안전하다고 판단했다.

### 검증

- `npm run lint` 통과
- `npm run build` 통과
