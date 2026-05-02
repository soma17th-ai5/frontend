"use client";

import { Menu } from "lucide-react";

type Props = {
  onToggleSidebar: () => void;
};

export function ChatHeader({ onToggleSidebar }: Props) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 lg:hidden"
          aria-label="사이드바 열기"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <p className="text-base font-semibold tracking-tight text-slate-900">
            SomaAgent
          </p>
          <p className="text-[11px] text-slate-500">AI 생활 비서</p>
        </div>
      </div>

      <button
        type="button"
        className="grid h-9 w-9 place-items-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 transition hover:bg-blue-200"
        aria-label="내 프로필"
      >
        도
      </button>
    </header>
  );
}
