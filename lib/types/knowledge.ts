// docs/features/api/chat.md · OpenAPI chat request / response

export type KnowledgeSourceType =
  | "NOTICE"
  | "NOTICE_PDF"
  | "MENTORING"
  | "WEBEX_MESSAGE";

export type KnowledgeChatRequest = {
  message: string;
};

export type KnowledgeSource = {
  chunk_id: string;
  source_type: KnowledgeSourceType;
  source_id: string;
  title: string;
  text: string;
  official: boolean;
  score: number;
  created_at?: string | null;
  source_url?: string | null;
  room_name?: string | null;
};

export type KnowledgeChatResponse = {
  answer: string;
  sources: KnowledgeSource[];
  llm_used: boolean;
  llm_error?: string | null;
  metadata?: Record<string, unknown> | null;
};
