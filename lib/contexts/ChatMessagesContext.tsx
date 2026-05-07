"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { ChatMessage } from "@/lib/mockChat";

type ChatMessagesContextValue = {
  messages: ChatMessage[];
  appendMessage: (message: ChatMessage) => void;
};

const ChatMessagesContext = createContext<ChatMessagesContextValue | null>(null);

type ProviderProps = {
  initialMessages: ChatMessage[];
  children: ReactNode;
};

export function ChatMessagesProvider({
  initialMessages,
  children,
}: ProviderProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  const appendMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const value = useMemo(
    () => ({ messages, appendMessage }),
    [messages, appendMessage],
  );

  return (
    <ChatMessagesContext.Provider value={value}>
      {children}
    </ChatMessagesContext.Provider>
  );
}

// 컨텍스트 미사용 (예: 단독 시연 페이지) 환경에서도 컴포넌트가 죽지 않도록 nullable 반환.
// 호출자는 반환값이 null 일 때 fallback 동작을 결정한다.
export function useChatMessages(): ChatMessagesContextValue | null {
  return useContext(ChatMessagesContext);
}
