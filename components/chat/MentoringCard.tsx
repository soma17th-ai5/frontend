import { CalendarDays, Clock, Tag, UserRound } from "lucide-react";
import type { MentoringCardData } from "@/lib/mockChat";
import { ActionButton } from "@/components/ui/ActionButton";

export function MentoringCard({ card }: { card: MentoringCardData }) {
  const isClosed = card.status === "closed";

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h4 className="text-sm font-semibold text-slate-900">{card.title}</h4>

      <dl className="mt-3 space-y-1.5 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <UserRound className="h-3.5 w-3.5 text-slate-400" />
          <span>{card.mentor}</span>
          <Tag className="ml-2 h-3.5 w-3.5 text-slate-400" />
          <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[11px] font-medium text-blue-600">
            {card.tag}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
          <span>{card.date}</span>
          <Clock className="ml-2 h-3.5 w-3.5 text-slate-400" />
          <span>{card.time}</span>
        </div>
      </dl>

      <div className="mt-4">
        <ActionButton
          variant={isClosed ? "ghost" : "primary"}
          disabled={isClosed}
        >
          {isClosed ? "신청 마감" : "이 멘토링 신청하기"}
        </ActionButton>
      </div>
    </article>
  );
}
