import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
import type { KrlStation } from "@/types/krl";
import { cn } from "@/lib/cn";

const ROW_PX = 44;

type Props = {
  stations: KrlStation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  scrollHeightClass?: string;
  emptyText?: string;
};

export function VirtualStationList({
  stations,
  selectedId,
  onSelect,
  scrollHeightClass = "h-44",
  emptyText = "Tidak ada stasiun.",
}: Props) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: stations.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_PX,
    overscan: 8,
  });

  if (stations.length === 0) {
    return (
      <div
        className={cn(
          scrollHeightClass,
          "overflow-y-auto rounded-xl border border-white/5 bg-black/20"
        )}
      >
        <p className="p-4 text-sm text-zinc-500">{emptyText}</p>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className={cn(
        scrollHeightClass,
        "min-h-0 overflow-y-auto rounded-xl border border-white/5 bg-black/20"
      )}
    >
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((vi) => {
          const s = stations[vi.index];
          return (
            <div
              key={s.sta_id}
              className="absolute top-0 left-0 w-full"
              style={{
                height: vi.size,
                transform: `translateY(${vi.start}px)`,
              }}
            >
              <button
                type="button"
                onClick={() => onSelect(s.sta_id)}
                className={cn(
                  "flex h-full w-full items-center justify-between border-b border-white/5 px-4 py-2.5 text-left text-sm transition-colors",
                  selectedId === s.sta_id
                    ? "bg-fuchsia-500/15 text-white"
                    : "text-zinc-300 hover:bg-white/5"
                )}
              >
                <span>{s.sta_name}</span>
                <span className="font-mono text-xs text-zinc-500">
                  {s.sta_id}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
