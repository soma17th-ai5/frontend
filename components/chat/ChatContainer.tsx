"use client";

import { ChatMessage } from "@/components/chat/ChatMessage";
import { useScrollToBottom } from "@/hooks/useScrollToBottom";
import type { ChatMessage as ChatMessageType } from "@/lib/mockChat";

type Props = {
  messages: ChatMessageType[];
};

export function ChatContainer({ messages }: Props) {
  const scrollRef = useScrollToBottom<HTMLDivElement>([messages.length]);

  return (
    <div
      ref={scrollRef}
      className="chat-scroll flex-1 overflow-y-auto bg-slate-50/60 px-4 py-6 sm:px-6"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-5">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
      </div>
    </div>
  );
}
