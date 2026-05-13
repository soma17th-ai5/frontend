"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api";
import {
  applicationItemsToMentoringCards,
  fetchApplications,
} from "@/lib/applications";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useChatMessages } from "@/lib/contexts/ChatMessagesContext";
import type { ThreadMessage } from "@/lib/knowledgeChat";

function newId(prefix: string) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function describeApplicationError(cause: unknown): string {
  if (cause instanceof ApiError) {
    if (cause.status === 400 || cause.status === 422) return cause.message;
    if (cause.status >= 500) {
      return "서버가 잠시 응답하지 않습니다. 잠시 후 다시 시도해 주세요.";
    }
    return cause.message;
  }
  if (cause instanceof Error && cause.name === "AbortError") {
    return "요청이 취소되었습니다.";
  }
  if (cause instanceof Error) return cause.message;
  return "알 수 없는 오류가 발생했습니다.";
}

export function useApplicationQuickAction() {
  const ctx = useChatMessages();
  const { user } = useAuth();
  const inflightRef = useRef<AbortController | null>(null);
  const [isApplicationsLoading, setIsApplicationsLoading] = useState(false);

  const abortApplications = useCallback(() => {
    inflightRef.current?.abort();
  }, []);

  const loadApplications = useCallback(async () => {
    if (!ctx) return;

    const userMessage: ThreadMessage = {
      id: newId("u"),
      role: "user",
      text: "내 신청내역 조회",
    };
    ctx.appendMessage(userMessage);

    inflightRef.current?.abort();
    const ac = new AbortController();
    inflightRef.current = ac;
    setIsApplicationsLoading(true);

    try {
      if (!user?.somaUserId) {
        throw new ApiError(401, "로그인 정보가 없어 신청 내역을 조회할 수 없습니다.", {
          code: "SOMA_AUTH_REQUIRED",
        });
      }

      const data = await fetchApplications(
        { somaUserId: user.somaUserId },
        ac.signal,
      );
      const cards = applicationItemsToMentoringCards(data.items);
      ctx.appendMessage({
        id: newId("apps"),
        role: "assistant",
        kind: "applications",
        answer:
          cards.length > 0
            ? `신청 내역 ${cards.length}건을 찾았습니다. 취소하려면 카드의 신청 취소 버튼을 눌러 주세요.`
            : "현재 신청 내역이 없습니다.",
        cards,
      });
    } catch (cause) {
      if (ac.signal.aborted) return;
      ctx.appendMessage({
        id: newId("e"),
        role: "assistant",
        kind: "error",
        message: describeApplicationError(cause),
      });
    } finally {
      setIsApplicationsLoading(false);
    }
  }, [ctx, user]);

  useEffect(() => {
    return () => inflightRef.current?.abort();
  }, []);

  return {
    abortApplications,
    isApplicationsLoading,
    loadApplications,
  };
}
