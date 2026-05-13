import { cookies } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  errorResponse,
  unexpectedErrorResponse,
} from "@/app/api/auth/_helpers";
import { somaFetch, SomaApiError } from "@/lib/server/somaApi";
import type { ApplicationsResponse } from "@/lib/types/applications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const somaUserId = url.searchParams.get("soma_user_id")?.trim();
  const forceRefresh = url.searchParams.get("force_refresh") === "true";

  if (!somaUserId) {
    return Response.json(
      { code: "INVALID_REQUEST", message: "soma_user_id가 필요합니다." },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
  if (!session) {
    return Response.json(
      { code: "SOMA_AUTH_REQUIRED", message: "로그인이 필요합니다." },
      { status: 401 },
    );
  }

  const query = new URLSearchParams({
    soma_user_id: somaUserId,
    force_refresh: String(forceRefresh),
  });

  try {
    const data = await somaFetch<ApplicationsResponse>(
      `/api/v1/applications?${query.toString()}`,
      {
        method: "GET",
        sessionId: session,
      },
    );
    return Response.json(data, { status: 200 });
  } catch (cause) {
    if (cause instanceof SomaApiError) return errorResponse(cause);
    return unexpectedErrorResponse(cause);
  }
}
