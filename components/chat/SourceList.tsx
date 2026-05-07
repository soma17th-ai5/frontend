import type { Source } from "@/lib/types/source";
import { SourceChip } from "@/components/ui/SourceChip";

type Props = {
  sources: Source[];
  /** 비공식이 하나라도 있을 때 노출할 설명 배너 노출 여부 (default: true) */
  showUnofficialNotice?: boolean;
};

export function SourceList({ sources, showUnofficialNotice = true }: Props) {
  if (!sources || sources.length === 0) return null;

  const hasUnofficial = sources.some((source) => !source.official);

  return (
    <section aria-label="출처" className="space-y-2">
      <header className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          출처 · {sources.length}건
        </p>
      </header>

      <ul className="flex flex-wrap gap-1.5">
        {sources.map((source, index) => (
          <li key={source.id ?? `${source.type}-${index}-${source.title}`}>
            <SourceChip source={source} />
          </li>
        ))}
      </ul>

      {showUnofficialNotice && hasUnofficial && (
        <p className="text-[11px] leading-relaxed text-slate-500">
          참고(회색) 출처는 공식 채널이 아닙니다. 답변 활용 시 공식 공지·시스템을
          한 번 더 확인해 주세요.
        </p>
      )}
    </section>
  );
}
