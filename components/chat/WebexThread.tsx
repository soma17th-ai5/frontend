import type { WebexReply } from "@/lib/mockChat";

export function WebexThread({ replies }: { replies: WebexReply[] }) {
  return (
    <div className="space-y-2">
      {replies.map((reply) => (
        <div
          key={reply.id}
          className="rounded-xl border border-slate-200 bg-white p-3"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{reply.author}</span>
            <span>{reply.time}</span>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
            {reply.text}
          </p>
        </div>
      ))}
    </div>
  );
}
