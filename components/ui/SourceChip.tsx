import { ExternalLink } from "lucide-react";
import type { ChatSource } from "@/lib/mockChat";

const TONE_STYLES: Record<NonNullable<ChatSource["tone"]>, string> = {
  neutral: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warm: "border-amber-200 bg-amber-50 text-amber-700",
};

export function SourceChip({ source }: { source: ChatSource }) {
  const toneClass = TONE_STYLES[source.tone ?? "neutral"];
  const Wrapper: React.ElementType = source.href ? "a" : "span";

  return (
    <Wrapper
      {...(source.href
        ? { href: source.href, target: "_blank", rel: "noreferrer" }
        : {})}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition ${toneClass} ${
        source.href ? "hover:brightness-95" : ""
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {source.label}
      <span className="text-[11px] text-current/70">· {source.date}</span>
      {source.href && <ExternalLink className="h-3 w-3" />}
    </Wrapper>
  );
}
