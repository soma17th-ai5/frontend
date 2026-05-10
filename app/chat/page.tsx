"use client";

import { CircleHelp, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatHeader } from "@/components/layout/ChatHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/lib/contexts/AuthContext";
import {
  ChatMessagesProvider,
  useChatMessages,
} from "@/lib/contexts/ChatMessagesContext";
import { MOCK_MESSAGES } from "@/lib/mockChat";

function ChatBoard() {
  const ctx = useChatMessages();
  const messages = ctx?.messages ?? MOCK_MESSAGES;
  return <ChatContainer messages={messages} />;
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
    <ChatMessagesProvider initialMessages={MOCK_MESSAGES}>
      <div className="flex h-dvh w-full bg-slate-100 text-slate-900">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="relative flex min-w-0 flex-1 flex-col">
          <ChatHeader onToggleSidebar={() => setSidebarOpen(true)} />
          <ChatBoard />
          <ChatInput />

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
