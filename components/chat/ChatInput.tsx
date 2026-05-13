"use client";

import { ClipboardList, FileText, SendHorizontal, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  type ChangeEvent,
  type KeyboardEvent,
  useCallback,
  useRef,
  useState,
} from "react";

type Props = {
  onSend?: (value: string) => void;
  onQuickAction?: (action: ChatQuickAction) => void;
  disabled?: boolean;
};

export type ChatQuickAction =
  | "backend_mentoring"
  | "planning_mentoring"
  | "notices"
  | "applications";

const QUICK_ACTIONS: Array<{
  id: ChatQuickAction;
  label: string;
  icon: LucideIcon;
}> = [
  { id: "backend_mentoring", label: "백엔드 멘토링 조회", icon: Users },
  { id: "planning_mentoring", label: "기획 멘토링 조회", icon: Users },
  { id: "notices", label: "공지사항 조회", icon: FileText },
  { id: "applications", label: "내 신청내역 조회", icon: ClipboardList },
];

export function ChatInput({ onSend, onQuickAction, disabled = false }: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const canSend = value.trim().length > 0 && !disabled;

  const adjustHeight = useCallback(() => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, 160)}px`;
  }, []);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(event.target.value);
    adjustHeight();
  };

  const handleSubmit = () => {
    if (!canSend) return;
    onSend?.(value.trim());
    setValue("");
    requestAnimationFrame(adjustHeight);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-slate-200 bg-white/80 px-4 py-3 backdrop-blur sm:px-6">
      <div className="mx-auto mb-2 flex max-w-3xl gap-2 overflow-x-auto pb-1">
        {QUICK_ACTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onQuickAction?.(id)}
            disabled={disabled}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>
      <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="지식 베이스에 질문해 보세요."
          disabled={disabled}
          className="chat-input-textarea max-h-40 min-h-[1.75rem] flex-1 resize-none border-0 bg-transparent px-1 py-1 text-sm leading-6 text-slate-800 placeholder:text-slate-400 focus:outline-none disabled:opacity-60"
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSend}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          aria-label="메시지 보내기"
        >
          <SendHorizontal className="h-4 w-4" />
        </button>
      </div>
      <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-slate-400">
        SomaAgent는 실수할 수 있어요. 중요한 정보는 한 번 더 확인해 주세요.
      </p>
    </div>
  );
}
