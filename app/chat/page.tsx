"use client";

import { CircleHelp } from "lucide-react";
import { useState } from "react";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatHeader } from "@/components/layout/ChatHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { MOCK_MESSAGES } from "@/lib/mockChat";

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-dvh w-full bg-slate-100 text-slate-900">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="relative flex min-w-0 flex-1 flex-col">
        <ChatHeader onToggleSidebar={() => setSidebarOpen(true)} />
        <ChatContainer messages={MOCK_MESSAGES} />
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
  );
}
