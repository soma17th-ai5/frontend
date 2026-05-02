import { Bot } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/lib/mockChat";
import { SourceChip } from "@/components/ui/SourceChip";
import { MentoringCard } from "@/components/chat/MentoringCard";
import { NoticeBlock } from "@/components/chat/NoticeBlock";
import { WebexThread } from "@/components/chat/WebexThread";
import { StatusToast } from "@/components/chat/StatusToast";

export function ChatMessage({ message }: { message: ChatMessageType }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[78%] rounded-2xl rounded-br-md bg-blue-600 px-4 py-2.5 text-sm leading-relaxed text-white shadow-sm">
          {message.text}
        </div>
      </div>
    );
  }

  if (message.role === "system") {
    return <StatusToast text={message.text} detail={message.detail} />;
  }

  return (
    <div className="flex gap-3">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-900 text-white">
        <Bot className="h-4 w-4" />
      </span>

      <div className="flex w-full max-w-[82%] flex-col gap-3">
        {message.kind === "text" && (
          <p className="rounded-2xl rounded-tl-md bg-white px-4 py-3 text-sm leading-relaxed text-slate-800 shadow-sm ring-1 ring-slate-200">
            {message.text}
          </p>
        )}

        {message.kind === "mentoring" && (
          <div className="space-y-3 rounded-2xl rounded-tl-md bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-800">{message.intro}</p>
            <div className="space-y-3">
              {message.cards.map((card) => (
                <MentoringCard key={card.id} card={card} />
              ))}
            </div>
          </div>
        )}

        {message.kind === "notice" && (
          <div className="space-y-3 rounded-2xl rounded-tl-md bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-800">{message.intro}</p>
            <NoticeBlock items={message.items} />
          </div>
        )}

        {message.kind === "webex" && (
          <div className="space-y-3 rounded-2xl rounded-tl-md bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-800">{message.intro}</p>
            <WebexThread replies={message.replies} />
          </div>
        )}

        {message.source && (
          <div>
            <SourceChip source={message.source} />
          </div>
        )}
      </div>
    </div>
  );
}
