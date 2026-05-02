import { FileText } from "lucide-react";
import type { NoticeItem } from "@/lib/mockChat";

export function NoticeBlock({ items }: { items: NoticeItem[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <FileText className="h-3.5 w-3.5" />
        필독 공지 {items.length}건
      </div>
      <ul className="mt-3 space-y-2 text-sm text-slate-700">
        {items.map((item) => (
          <li key={item.id} className="flex gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
            <span>{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
