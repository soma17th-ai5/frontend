"use client";

import { TriangleAlert, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  MentoringCard as MentoringCardComponent,
  type MentoringCardLocalStatus,
} from "@/components/chat/MentoringCard";
import { ApiError } from "@/lib/api";
import { executeAction } from "@/lib/api/actions";
import {
  type MentoringCard,
  type MentoringStatus,
} from "@/lib/types/mentoring";
import type { ActionType } from "@/lib/types/action";

type Pending =
  | { actionType: "MENTORING_APPLY"; card: MentoringCard }
  | { actionType: "MENTORING_CANCEL"; card: MentoringCard };

type ResultBanner = {
  tone: "success" | "error";
  title: string;
  detail: string;
} | null;

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

function nextStatusAfterSuccess(
  actionType: ActionType,
): MentoringStatus {
  return actionType === "MENTORING_APPLY" ? "applied" : "open";
}

export function MentoringCardList({ items }: { items: MentoringCard[] }) {
  const [statusMap, setStatusMap] = useState<LocalStatusMap>(() =>
    buildInitialStatusMap(items),
  );
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);
  const [resultBanner, setResultBanner] = useState<ResultBanner>(null);

  const handleApply = useCallback((card: MentoringCard) => {
    setResultBanner(null);
    setPending({ actionType: "MENTORING_APPLY", card });
  }, []);

  const handleCancelClick = useCallback((card: MentoringCard) => {
    setResultBanner(null);
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
      await executeAction({
        actionType: pending.actionType,
        payload: {
          mentoringId: pending.card.id,
          ...(pending.card.applySn ? { applySn: pending.card.applySn } : {}),
          ...(pending.card.qustnrSn ? { qustnrSn: pending.card.qustnrSn } : {}),
        },
      });

      const finalStatus = nextStatusAfterSuccess(pending.actionType);
      setStatusMap((prev) => ({ ...prev, [pending.card.id]: finalStatus }));
      setResultBanner({
        tone: "success",
        title:
          pending.actionType === "MENTORING_APPLY"
            ? "신청이 완료됐어요"
            : "신청을 취소했어요",
        detail: pending.card.title,
      });
      setPending(null);
    } catch (cause) {
      setStatusMap((prev) => ({
        ...prev,
        [pending.card.id]: pending.card.status as MentoringCardLocalStatus,
      }));
      setResultBanner({
        tone: "error",
        title:
          pending.actionType === "MENTORING_APPLY"
            ? "신청에 실패했어요"
            : "취소에 실패했어요",
        detail: describeError(cause),
      });
      setPending(null);
    } finally {
      setBusy(false);
    }
  }, [pending]);

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
      {resultBanner && (
        <div
          role={resultBanner.tone === "error" ? "alert" : "status"}
          className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-xs ${
            resultBanner.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {resultBanner.tone === "error" ? (
            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          ) : (
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{resultBanner.title}</p>
            <p className="mt-0.5 opacity-80">{resultBanner.detail}</p>
          </div>
          <button
            type="button"
            aria-label="결과 알림 닫기"
            onClick={() => setResultBanner(null)}
            className="-mr-1 -mt-1 rounded p-0.5 opacity-60 transition hover:opacity-100"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

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
