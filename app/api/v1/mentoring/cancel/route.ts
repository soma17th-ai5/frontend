import { cookies } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  errorResponse,
  unexpectedErrorResponse,
} from "@/app/api/auth/_helpers";
import { somaFetch, SomaApiError } from "@/lib/server/somaApi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CancelBody = {
  apply_sn: number;
  qustnr_sn: number;
  soma_user_id: string;
};

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isCancelBody(value: unknown): value is CancelBody {
  if (!value || typeof value !== "object") return false;
  if (!("apply_sn" in value)) return false;
  if (!("qustnr_sn" in value)) return false;
  if (!("soma_user_id" in value)) return false;

  const { apply_sn, qustnr_sn, soma_user_id } = value;
  return (
    isPositiveInteger(apply_sn) &&
    isPositiveInteger(qustnr_sn) &&
    typeof soma_user_id === "string" &&
    soma_user_id.trim().length > 0
  );
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

  if (!isCancelBody(body)) {
    return Response.json(
      {
        code: "INVALID_REQUEST",
        message: "apply_sn, qustnr_sn, soma_user_id가 필요합니다.",
      },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;

  try {
    const data = await somaFetch<unknown>("/api/v1/mentoring/cancel", {
      method: "POST",
      sessionId: session,
      json: {
        apply_sn: body.apply_sn,
        qustnr_sn: body.qustnr_sn,
        soma_user_id: body.soma_user_id.trim(),
      },
    });
    return Response.json(data, { status: 200 });
  } catch (cause) {
    if (cause instanceof SomaApiError) return errorResponse(cause);
    return unexpectedErrorResponse(cause);
  }
}
