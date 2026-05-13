import { apiFetch } from "@/lib/api";
import type {
  KnowledgeChatRequest,
  KnowledgeChatResponse,
} from "@/lib/types/knowledge";

export async function askKnowledge(
  body: KnowledgeChatRequest,
  signal?: AbortSignal,
): Promise<KnowledgeChatResponse> {
  return apiFetch<KnowledgeChatResponse>("/api/v1/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "same-origin",
    signal,
  });
}
