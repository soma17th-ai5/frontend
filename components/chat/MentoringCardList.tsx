"use client";

import { useCallback, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  MentoringCard as MentoringCardComponent,
  type MentoringCardLocalStatus,
} from "@/components/chat/MentoringCard";
import { ApiError } from "@/lib/api";
import { executeAction } from "@/lib/api/actions";
import { useChatMessages } from "@/lib/contexts/ChatMessagesContext";
import {
  type MentoringCard,
  type MentoringStatus,
} from "@/lib/types/mentoring";
import type { ActionResult, ActionType } from "@/lib/types/action";

type Pending =
  | { actionType: "MENTORING_APPLY"; card: MentoringCard }
  | { actionType: "MENTORING_CANCEL"; card: MentoringCard };

type LocalStatusMap = Record<string, MentoringCardLocalStatus>;

const ACTION_COPY: Record<
  ActionType,
  { dialog: { title: string; confirm: string; tone: "primary" | "danger" } }
> = {
  MENTORING_APPLY: {
    dialog: {
      title: "이 멘토링을 신청할까요?",
      confirm: "신청하기",
      tone: "primary",
    },
  },
  MENTORING_CANCEL: {
    dialog: {
      title: "신청을 취소할까요?",
      confirm: "취소하기",
      tone: "danger",
    },
  },
};

function buildInitialStatusMap(items: MentoringCard[]): LocalStatusMap {
  const map: LocalStatusMap = {};
  for (const item of items) {
    map[item.id] = item.status as MentoringCardLocalStatus;
  }
  return map;
}

function describeError(cause: unknown): string {
  if (cause instanceof ApiError) {
    if (cause.status === 409) {
      return "이미 신청되었거나 마감된 멘토링이에요.";
    }
    if (cause.status === 401) {
      return "세션이 만료되었어요. 다시 로그인해 주세요.";
    }
    return cause.message;
  }
  if (cause instanceof Error) return cause.message;
  return "알 수 없는 오류가 발생했어요.";
}

function nextStatusAfterSuccess(actionType: ActionType): MentoringStatus {
  return actionType === "MENTORING_APPLY" ? "applied" : "open";
}

// 실패 시 백엔드가 ActionResult 를 직접 안 줄 수 있어, 클라이언트에서 같은 모양으로 합성한다.
// 이 합성 결과는 ChatMessagesContext.appendMessage 를 통해 채팅 흐름에 action_result 메시지로 들어간다.
function buildSyntheticFailureResult(
  pending: Pending,
  cause: unknown,
): ActionResult {
  const code =
    cause instanceof ApiError && cause.code ? cause.code : "ACTION_FAILED";
  const status = cause instanceof ApiError ? cause.status : undefined;
  return {
    actionType: pending.actionType,
    status: "failed",
    message:
      pending.actionType === "MENTORING_APPLY"
        ? `‘${pending.card.title}’ 멘토링 신청에 실패했어요.`
        : `‘${pending.card.title}’ 신청 취소에 실패했어요.`,
    error: {
      code,
      message: describeError(cause),
      // 4xx 클라이언트 오류는 통상 재시도 무의미, 5xx 는 재시도 가능.
      recoverable: typeof status === "number" ? status >= 500 : true,
    },
    traceId: "",
  };
}

export function MentoringCardList({ items }: { items: MentoringCard[] }) {
  const messagesCtx = useChatMessages();

  const [statusMap, setStatusMap] = useState<LocalStatusMap>(() =>
    buildInitialStatusMap(items),
  );
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);

  const handleApply = useCallback((card: MentoringCard) => {
    setPending({ actionType: "MENTORING_APPLY", card });
  }, []);

  const handleCancelClick = useCallback((card: MentoringCard) => {
    setPending({ actionType: "MENTORING_CANCEL", card });
  }, []);

  const closeDialog = useCallback(() => {
    if (busy) return;
    setPending(null);
  }, [busy]);

  const handleConfirm = useCallback(async () => {
    if (!pending) return;
    setBusy(true);
    setStatusMap((prev) => ({
      ...prev,
      [pending.card.id]:
        pending.actionType === "MENTORING_APPLY" ? "applying" : "cancelling",
    }));

    try {
      const result = await executeAction({
        actionType: pending.actionType,
        payload: {
          mentoringId: pending.card.id,
          ...(pending.card.applySn ? { applySn: pending.card.applySn } : {}),
          ...(pending.card.qustnrSn ? { qustnrSn: pending.card.qustnrSn } : {}),
        },
      });

      // 카드 상태 동기화는 클라이언트가 책임 — 서버가 status 를 포함하지 않을 수 있음.
      const finalStatus = nextStatusAfterSuccess(pending.actionType);
      setStatusMap((prev) => ({ ...prev, [pending.card.id]: finalStatus }));

      // 채팅 흐름에 action_result 메시지로 결과를 영속화 (히스토리 보존).
      messagesCtx?.appendMessage({
        id: `ar-${pending.card.id}-${Date.now()}`,
        role: "agent",
        kind: "action_result",
        results: [result],
      });
    } catch (cause) {
      // 카드 상태는 원복.
      setStatusMap((prev) => ({
        ...prev,
        [pending.card.id]: pending.card.status as MentoringCardLocalStatus,
      }));

      messagesCtx?.appendMessage({
        id: `ar-${pending.card.id}-${Date.now()}`,
        role: "agent",
        kind: "action_result",
        results: [buildSyntheticFailureResult(pending, cause)],
      });
    } finally {
      setBusy(false);
      setPending(null);
    }
  }, [pending, messagesCtx]);

  const dialogCopy = useMemo(() => {
    if (!pending) return null;
    const copy = ACTION_COPY[pending.actionType];
    return {
      ...copy.dialog,
      description: (
        <div className="space-y-2">
          <p className="font-medium text-slate-800">{pending.card.title}</p>
          <p className="text-xs text-slate-500">
            {pending.actionType === "MENTORING_APPLY"
              ? "확인을 누르면 OpenSoma에 신청 요청이 전송되고, Google Calendar에 일정이 추가됩니다."
              : "확인을 누르면 OpenSoma에서 신청이 취소되고 캘린더 일정도 함께 정리됩니다."}
          </p>
        </div>
      ),
    };
  }, [pending]);

  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {items.map((card) => (
          <li key={card.id}>
            <MentoringCardComponent
              card={card}
              status={statusMap[card.id] ?? "open"}
              onApply={handleApply}
              onCancel={handleCancelClick}
            />
          </li>
        ))}
      </ul>

      {pending && dialogCopy && (
        <ConfirmDialog
          open
          title={dialogCopy.title}
          description={dialogCopy.description}
          confirmLabel={dialogCopy.confirm}
          tone={dialogCopy.tone}
          busy={busy}
          onConfirm={handleConfirm}
          onCancel={closeDialog}
        />
      )}
    </div>
  );
}
