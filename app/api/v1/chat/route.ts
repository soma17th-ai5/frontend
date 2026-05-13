import { cookies } from "next/headers";
import type {
  KnowledgeChatRequest,
  KnowledgeChatResponse,
} from "@/lib/types/knowledge";
import {
  SESSION_COOKIE_NAME,
  errorResponse,
  unexpectedErrorResponse,
} from "@/app/api/auth/_helpers";
import { somaFetch, SomaApiError } from "@/lib/server/somaApi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isKnowledgeChatBody(value: unknown): value is KnowledgeChatRequest {
  if (!value || typeof value !== "object") return false;
  const message = (value as KnowledgeChatRequest).message;
  return typeof message === "string" && message.trim().length > 0;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { code: "INVALID_REQUEST", message: "잘못된 요청 본문입니다." },
      { status: 400 },
    );
  }

  if (!isKnowledgeChatBody(body)) {
    return Response.json(
      {
        code: "INVALID_REQUEST",
        message: "메시지(message)를 한 글자 이상 입력해 주세요.",
      },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
  const payload: KnowledgeChatRequest = {
    message: body.message.trim(),
  };

  try {
    const data = await somaFetch<KnowledgeChatResponse>("/api/v1/chat", {
      method: "POST",
      sessionId: session,
      json: payload,
    });
    return Response.json(data, { status: 200 });
  } catch (cause) {
    if (cause instanceof SomaApiError) return errorResponse(cause);
    return unexpectedErrorResponse(cause);
  }
}
