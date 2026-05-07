import { Bot } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/lib/mockChat";
import { ActionResultBanner } from "@/components/chat/ActionResultBanner";
import { MentoringCardList } from "@/components/chat/MentoringCardList";
import { NoticeList } from "@/components/chat/NoticeList";
import { SourceList } from "@/components/chat/SourceList";
import { WebexSummary } from "@/components/chat/WebexSummary";
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
            <MentoringCardList items={message.cards} />
          </div>
        )}

        {message.kind === "notice" && (
          <div className="space-y-3 rounded-2xl rounded-tl-md bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-800">{message.intro}</p>
            <NoticeList items={message.items} />
          </div>
        )}

        {message.kind === "webex_summary" && (
          <div className="space-y-3 rounded-2xl rounded-tl-md bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-800">{message.intro}</p>
            <WebexSummary items={message.items} />
          </div>
        )}

        {message.kind === "action_result" && (
          <div className="space-y-2">
            {message.results.map((result, index) => (
              <ActionResultBanner
                key={`${result.actionType}-${result.data?.application?.applySn ?? index}`}
                result={result}
              />
            ))}
          </div>
        )}

        {message.kind !== "action_result" &&
          message.sources &&
          message.sources.length > 0 && (
            <SourceList sources={message.sources} />
          )}
      </div>
    </div>
  );
}
