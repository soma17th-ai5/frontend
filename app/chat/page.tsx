"use client";

import { CircleHelp, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatInput, type ChatQuickAction } from "@/components/chat/ChatInput";
import { ChatHeader } from "@/components/layout/ChatHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/lib/contexts/AuthContext";
import {
  ChatMessagesProvider,
  useChatMessages,
} from "@/lib/contexts/ChatMessagesContext";
import { askKnowledge } from "@/lib/knowledge";
import { buildKnowledgeQueryWithContext } from "@/lib/knowledgeContext";
import type { ThreadMessage } from "@/lib/knowledgeChat";
import { ApiError } from "@/lib/api";
import {
  applicationItemsToMentoringCards,
  fetchApplications,
} from "@/lib/applications";

function newId(prefix: string) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function describeKnowledgeError(cause: unknown): string {
  if (cause instanceof ApiError) {
    if (cause.status === 400 || cause.status === 422) {
      return cause.message;
    }
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

const QUICK_ACTION_MESSAGE: Record<Exclude<ChatQuickAction, "applications">, string> = {
  backend_mentoring: "백엔드 멘토링 찾아줘",
  planning_mentoring: "기획 멘토링 찾아줘",
  notices: "최근 공지사항 요약해줘",
};

function ChatBoard() {
  const ctx = useChatMessages();
  const { user } = useAuth();
  const inflightRef = useRef<AbortController | null>(null);
  const [awaiting, setAwaiting] = useState(false);

  const messages = ctx?.messages ?? [];

  const sendMessage = useCallback(
    async (text: string) => {
      if (!ctx) return;
      const priorForContext = ctx.messages;

      const userMessage: ThreadMessage = {
        id: newId("u"),
        role: "user",
        text,
      };
      ctx.appendMessage(userMessage);

      inflightRef.current?.abort();
      const ac = new AbortController();
      inflightRef.current = ac;
      setAwaiting(true);

      try {
        const messageForApi = buildKnowledgeQueryWithContext(priorForContext, text);
        const data = await askKnowledge({ message: messageForApi }, ac.signal);
        ctx.appendMessage({
          id: newId("a"),
          role: "assistant",
          kind: "knowledge",
          answer: data.answer,
          sources: data.sources,
          llm_used: data.llm_used,
          llm_error: data.llm_error,
        });
      } catch (cause) {
        if (ac.signal.aborted) return;
        ctx.appendMessage({
          id: newId("e"),
          role: "assistant",
          kind: "error",
          message: describeKnowledgeError(cause),
        });
      } finally {
        setAwaiting(false);
      }
    },
    [ctx],
  );

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
    setAwaiting(true);

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
        message: describeKnowledgeError(cause),
      });
    } finally {
      setAwaiting(false);
    }
  }, [ctx, user]);

  const handleQuickAction = useCallback(
    (action: ChatQuickAction) => {
      if (action === "applications") {
        void loadApplications();
        return;
      }
      void sendMessage(QUICK_ACTION_MESSAGE[action]);
    },
    [loadApplications, sendMessage],
  );

  useEffect(() => {
    return () => inflightRef.current?.abort();
  }, []);

  return (
    <>
      <ChatContainer messages={messages} isAwaitingAnswer={awaiting} />
      <ChatInput
        onSend={sendMessage}
        onQuickAction={handleQuickAction}
        disabled={awaiting}
      />
    </>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const { status } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <main className="grid min-h-dvh place-items-center bg-slate-100 text-slate-500">
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          세션 확인 중…
        </div>
      </main>
    );
  }

  return (
    <ChatMessagesProvider initialMessages={[]}>
      <div className="flex h-dvh w-full bg-slate-100 text-slate-900">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="relative flex min-w-0 flex-1 flex-col">
          <ChatHeader onToggleSidebar={() => setSidebarOpen(true)} />
          <ChatBoard />

          <button
            type="button"
            aria-label="도움말 열기"
            className="absolute bottom-24 right-6 z-10 grid h-10 w-10 place-items-center rounded-full bg-white text-slate-600 shadow-md ring-1 ring-slate-200 transition hover:text-blue-600"
          >
            <CircleHelp className="h-5 w-5" />
          </button>
        </div>
      </div>
    </ChatMessagesProvider>
  );
}
