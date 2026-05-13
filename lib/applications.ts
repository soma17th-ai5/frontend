import { apiFetch } from "@/lib/api";
import type {
  ApplicationHistoryItem,
  ApplicationsResponse,
} from "@/lib/types/applications";
import type { MentoringCard } from "@/lib/types/mentoring";

export async function fetchApplications(
  args: { somaUserId: string; forceRefresh?: boolean },
  signal?: AbortSignal,
): Promise<ApplicationsResponse> {
  const query = new URLSearchParams({
    soma_user_id: args.somaUserId,
    force_refresh: String(args.forceRefresh ?? false),
  });

  return apiFetch<ApplicationsResponse>(`/api/v1/applications?${query}`, {
    method: "GET",
    credentials: "same-origin",
    signal,
  });
}

function extractMentoringId(item: ApplicationHistoryItem): string {
  if (typeof item.qustnr_sn === "number") return String(item.qustnr_sn);
  const matches = item.target_url?.match(/\d{3,}/g);
  return matches?.at(-1) ?? "";
}

function isCancelled(status: string): boolean {
  return status.includes("취소");
}

function parseApplicationSessionEnd(text: string): Date | null {
  const match = text.match(
    /(\d{4}-\d{2}-\d{2})\([^)]*\)\s+(\d{1,2}:\d{2}:\d{2})(?:\s*~\s*(\d{1,2}:\d{2}:\d{2}))?/,
  );
  if (!match) return null;

  const [, date, startTime, endTime] = match;
  const parsed = new Date(`${date}T${endTime ?? startTime}+09:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isPastApplication(item: ApplicationHistoryItem, now = new Date()): boolean {
  const sessionEnd = parseApplicationSessionEnd(item.session_date_text);
  return sessionEnd ? sessionEnd.getTime() < now.getTime() : false;
}

export function applicationItemsToMentoringCards(
  items: ApplicationHistoryItem[],
): MentoringCard[] {
  return items.filter((item) => !isPastApplication(item)).map((item) => {
    const mentoringId = extractMentoringId(item);
    const canCancel = !isCancelled(item.application_status) && item.qustnr_sn != null;
    const canApply = isCancelled(item.application_status) && mentoringId.length > 0;
    const description = [
      item.category,
      item.application_status,
      item.approval_status,
      item.applied_at_text ? `신청: ${item.applied_at_text}` : "",
    ].filter(Boolean).join(" · ");

    return {
      id: mentoringId || `application-${item.apply_sn}`,
      title: item.title,
      mentor: {
        name: item.author || "OpenSoma",
      },
      tags: item.category ? [item.category] : [],
      description,
      sessionStartedAt: item.session_date_text || item.applied_at_text || "일정 정보 없음",
      status: canCancel ? "applied" : canApply ? "open" : "closed",
      applySn: item.apply_sn,
      ...(item.qustnr_sn != null ? { qustnrSn: item.qustnr_sn } : {}),
    };
  });
}
