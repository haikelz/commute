import { AppProviders } from "@/components/providers/app-providers";
import {
  glassPanelClass,
  TransjakartaMotionBackLink,
  TransjakartaMotionHeroTitle,
  TransjakartaMotionLead,
  TransjakartaMotionSection,
  TransjakartaPageBackdrop,
} from "@/components/transjakarta/transjakarta-page-motion";
import { cn } from "@/lib/cn";
import { fetchTransjakartaRoutes } from "@/lib/transjakarta-client";
import type { TransjakartaRouteSummary } from "@/types/transjakarta";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronRight, Search } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";

const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function routeHref(id: string) {
  return `/transjakarta/rute/${encodeURIComponent(id)}`;
}

function RouteBadge({ r }: { r: TransjakartaRouteSummary }) {
  const bg = r.route_color?.length
    ? `#${r.route_color.replace(/^#/, "")}`
    : "#52525b";
  const fgRaw = r.route_text_color?.length
    ? `#${r.route_text_color.replace(/^#/, "")}`
    : "#ffffff";
  return (
    <span
      className="inline-flex min-w-[2.5rem] shrink-0 items-center justify-center rounded-lg px-2 py-0.5 text-xs font-semibold tabular-nums"
      style={{ backgroundColor: bg, color: fgRaw }}
    >
      {r.route_short_name}
    </span>
  );
}

function TransjakartaRoutesPageInner() {
  const [q, setQ] = useState("");
  const dq = useDeferredValue(q.trim().toLowerCase());

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["transjakarta", "routes"],
    queryFn: fetchTransjakartaRoutes,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!dq) {
      return [...data].sort((a, b) =>
        a.route_short_name.localeCompare(b.route_short_name, "id", {
          numeric: true,
        })
      );
    }
    return data
      .filter(
        (r) =>
          r.route_short_name.toLowerCase().includes(dq) ||
          r.route_long_name.toLowerCase().includes(dq) ||
          r.route_desc.toLowerCase().includes(dq) ||
          r.route_id.toLowerCase().includes(dq)
      )
      .sort((a, b) =>
        a.route_short_name.localeCompare(b.route_short_name, "id", {
          numeric: true,
        })
      );
  }, [data, dq]);

  return (
    <TransjakartaPageBackdrop>
      <TransjakartaMotionBackLink href="/transjakarta">
        ← TransJakarta
      </TransjakartaMotionBackLink>
      <header className="mb-6 text-center sm:text-left">
        <TransjakartaMotionHeroTitle className="text-3xl sm:text-4xl">
          Rute bus
        </TransjakartaMotionHeroTitle>
        <TransjakartaMotionLead
          className="mt-2 text-sm text-zinc-400"
          delay={0.08}
        >
          {data?.length != null ? `${data.length} rute` : "Memuat…"}
        </TransjakartaMotionLead>
      </header>

      <TransjakartaMotionSection
        delay={0.05}
        className={cn("p-5 sm:p-6", glassPanelClass)}
      >
        <div className="relative mb-4">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500"
            aria-hidden
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nomor rute, nama koridor, atau jenis…"
            className="w-full rounded-xl border border-white/10 bg-black/30 py-3 pr-4 pl-10 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-fuchsia-500/40 focus:ring-1 focus:ring-fuchsia-500/30 focus:outline-none"
            autoComplete="off"
          />
        </div>

        {isPending && (
          <p className="py-12 text-center text-sm text-zinc-500">
            Memuat rute…
          </p>
        )}
        {isError && (
          <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error instanceof Error ? error.message : "Gagal memuat rute."}
          </p>
        )}

        {!isPending && !isError && (
          <div className="max-h-[min(70vh,520px)] overflow-y-auto rounded-xl border border-white/10 bg-black/25">
            {filtered.length === 0 ? (
              <p className="p-6 text-center text-sm text-zinc-500">
                Tidak ada rute yang cocok.
              </p>
            ) : (
              <ul className="divide-y divide-white/5">
                {filtered.map((r) => (
                  <li key={r.route_id}>
                    <a
                      href={routeHref(r.route_id)}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/[0.06]"
                      )}
                    >
                      <RouteBadge r={r} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-zinc-100">
                          {r.route_long_name}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          {r.route_desc} · {idr.format(r.price)}
                        </p>
                      </div>
                      <ChevronRight
                        className="mt-1 h-4 w-4 shrink-0 text-zinc-600"
                        aria-hidden
                      />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </TransjakartaMotionSection>
    </TransjakartaPageBackdrop>
  );
}

export function TransjakartaRoutesPage() {
  return (
    <AppProviders>
      <TransjakartaRoutesPageInner />
    </AppProviders>
  );
}
