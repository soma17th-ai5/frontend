"use client";

import { CircleHelp, X } from "lucide-react";
import { useState } from "react";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatHeader } from "@/components/layout/ChatHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { MOCK_MESSAGES } from "@/lib/mockChat";

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showHint, setShowHint] = useState(true);

  return (
    <div className="flex h-dvh w-full bg-slate-100 text-slate-900">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="relative flex min-w-0 flex-1 flex-col">
        <ChatHeader onToggleSidebar={() => setSidebarOpen(true)} />
        <ChatContainer messages={MOCK_MESSAGES} />
        <ChatInput />

        {showHint && (
          <div className="pointer-events-none absolute bottom-24 right-6 z-20 flex items-end gap-2">
            <div className="pointer-events-auto flex max-w-[260px] items-start gap-2 rounded-xl bg-slate-900 px-3 py-2 text-[11px] leading-snug text-white shadow-lg">
              <span>
                안내는 도움말 메뉴에서 언제든 다시 볼 수 있어요. 임시 UI라
                실제로는 동작하지 않습니다.
              </span>
              <button
                type="button"
                aria-label="안내 닫기"
                className="-mr-1 -mt-1 rounded p-0.5 text-white/70 hover:text-white"
                onClick={() => setShowHint(false)}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

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
