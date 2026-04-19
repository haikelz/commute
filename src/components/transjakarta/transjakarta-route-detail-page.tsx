import { AppProviders } from "@/components/providers/app-providers";
import {
  TransjakartaMotionBackLink,
  TransjakartaMotionHeroTitle,
  TransjakartaMotionLead,
  TransjakartaMotionSection,
  TransjakartaPageBackdrop,
  glassPanelClass,
} from "@/components/transjakarta/transjakarta-page-motion";
import { TransjakartaRouteMapModal } from "@/components/transjakarta/transjakarta-route-map-modal";
import { cn } from "@/lib/cn";
import { fetchTransjakartaRouteDetail } from "@/lib/transjakarta-client";
import type {
  TransjakartaDirectionDetail,
  TransjakartaStop,
} from "@/types/transjakarta";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Map } from "lucide-react";
import { useMemo, useState } from "react";

const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

type Dir = "inbound" | "outbound";

function StopsTable({
  stops,
  onShowStopMap,
}: {
  stops: TransjakartaStop[];
  onShowStopMap: (s: TransjakartaStop) => void;
}) {
  if (stops.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500">
        Tidak ada data halte.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-black/30 text-xs text-zinc-500 uppercase">
            <th className="px-3 py-2 font-medium">#</th>
            <th className="px-3 py-2 font-medium">Halte</th>
            <th className="px-3 py-2 font-medium">Peron</th>
            <th className="px-3 py-2 font-medium">Tipe</th>
            <th className="px-3 py-2 font-medium">Lokasi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {stops.map((s, i) => (
            <tr key={`${s.stop_id}-${i}`} className="hover:bg-white/3">
              <td className="px-3 py-2.5 tabular-nums text-zinc-500">
                {i + 1}
              </td>
              <td className="px-3 py-2.5 font-medium text-zinc-200">
                {s.stop_name}
              </td>
              <td className="px-3 py-2.5 text-zinc-400">
                {s.platform_code || "—"}
              </td>
              <td className="px-3 py-2.5 text-zinc-400 capitalize">
                {s.bus_stop_type}
              </td>
              <td className="px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => onShowStopMap(s)}
                  className="inline-flex items-center gap-1 text-fuchsia-400/90 hover:text-fuchsia-300"
                >
                  <Map className="h-3.5 w-3.5" aria-hidden />
                  Peta
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DirectionPanel({
  detail,
  onShowRouteMap,
  onShowStopMap,
}: {
  detail: TransjakartaDirectionDetail;
  onShowRouteMap: () => void;
  onShowStopMap: (s: TransjakartaStop) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm">
        <p className="text-zinc-500">Tujuan (headsign)</p>
        <p className="mt-1 font-medium text-zinc-100">{detail.headsign}</p>
        <p className="mt-2 text-xs text-zinc-500">
          Trip <span className="font-mono text-zinc-400">{detail.trip_id}</span>{" "}
          · {detail.stops.length} halte
        </p>
      </div>
      <button
        type="button"
        onClick={onShowRouteMap}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-fuchsia-500/35 bg-fuchsia-500/10 px-4 py-3 text-sm font-medium text-fuchsia-100 transition-colors hover:bg-fuchsia-500/20 sm:w-auto"
      >
        <Map className="h-4 w-4" aria-hidden />
        Lihat peta koridor
      </button>
      <StopsTable stops={detail.stops} onShowStopMap={onShowStopMap} />
    </div>
  );
}

type Props = { id: string };

function TransjakartaRouteDetailPageInner({ id }: Props) {
  const [dir, setDir] = useState<Dir>("outbound");
  const [mapOpen, setMapOpen] = useState(false);
  const [mapFocusStopId, setMapFocusStopId] = useState<string | null>(null);

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["transjakarta", "route", id],
    queryFn: () => fetchTransjakartaRouteDetail(id),
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const inbound = data?.inbound;
  const outbound = data?.outbound;

  const effectiveDir = useMemo((): Dir => {
    if (!inbound && outbound) return "outbound";
    if (inbound && !outbound) return "inbound";
    return dir;
  }, [dir, inbound, outbound]);

  const route = data?.route;

  const activeDetail: TransjakartaDirectionDetail | null =
    effectiveDir === "outbound" ? outbound ?? null : inbound ?? null;

  const badgeBg = route?.route_color?.length
    ? `#${route.route_color.replace(/^#/, "")}`
    : "#52525b";
  const badgeFg = route?.route_text_color?.length
    ? `#${route.route_text_color.replace(/^#/, "")}`
    : "#ffffff";

  function openRouteMap() {
    setMapFocusStopId(null);
    setMapOpen(true);
  }

  function openStopMap(s: TransjakartaStop) {
    setMapFocusStopId(s.stop_id);
    setMapOpen(true);
  }

  function onMapOpenChange(open: boolean) {
    setMapOpen(open);
    if (!open) setMapFocusStopId(null);
  }

  return (
    <TransjakartaPageBackdrop>
      <TransjakartaMotionBackLink href="/transjakarta/rute">
        ← Semua rute
      </TransjakartaMotionBackLink>

      {isPending && (
        <motion.p
          className="py-12 text-center text-sm text-zinc-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
        >
          Memuat detail…
        </motion.p>
      )}
      {isError && (
        <motion.p
          className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {error instanceof Error ? error.message : "Gagal memuat rute."}
        </motion.p>
      )}

      {route && activeDetail && !isPending && !isError && (
        <TransjakartaRouteMapModal
          open={mapOpen}
          onOpenChange={onMapOpenChange}
          title={`${route.route_short_name} — ${activeDetail.headsign}`}
          description={`${activeDetail.stops.length} halte · trip ${activeDetail.trip_id}`}
          tripId={activeDetail.trip_id}
          routeColor={route.route_color}
          stops={activeDetail.stops}
          polyline={activeDetail.polyline}
          focusStopId={mapFocusStopId}
        />
      )}

      {route && data && !isPending && !isError && (
        <>
          <motion.div
            className="mb-6 flex flex-wrap items-start gap-3"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
          >
            <span
              className="inline-flex min-w-12 items-center justify-center rounded-xl px-3 py-1.5 text-lg font-semibold"
              style={{ backgroundColor: badgeBg, color: badgeFg }}
            >
              {route.route_short_name}
            </span>
            <div className="min-w-0 flex-1">
              <TransjakartaMotionHeroTitle className="text-left text-xl sm:text-2xl">
                {route.route_long_name}
              </TransjakartaMotionHeroTitle>
              <TransjakartaMotionLead
                className="mt-1 text-sm text-zinc-400"
                delay={0.02}
              >
                {route.route_desc} · {idr.format(route.price)}
              </TransjakartaMotionLead>
              {route.start_time && route.end_time && (
                <p className="mt-1 text-xs text-zinc-500">
                  Operasional {route.start_time.slice(0, 5)}–
                  {route.end_time.slice(0, 5)} WIB
                </p>
              )}
            </div>
          </motion.div>

          {data.facilities.length > 0 && (
            <TransjakartaMotionSection
              delay={0.1}
              className={cn(glassPanelClass, "mb-6 p-5 sm:p-6")}
            >
              <h2 className="mb-2 text-xs font-medium tracking-wider text-zinc-500 uppercase">
                Fasilitas koridor
              </h2>
              <ul className="flex flex-wrap gap-2">
                {data.facilities.map((f) => (
                  <li
                    key={f.name}
                    className="rounded-lg border border-white/10 bg-black/25 px-2.5 py-1 text-xs text-zinc-300"
                  >
                    {f.title}
                  </li>
                ))}
              </ul>
            </TransjakartaMotionSection>
          )}

          <TransjakartaMotionSection
            delay={0.12}
            className={cn(glassPanelClass, "p-5 sm:p-6")}
          >
            {inbound && outbound && (
              <div
                className="mb-4 flex gap-2 rounded-xl border border-white/10 bg-black/25 p-1"
                role="tablist"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={effectiveDir === "outbound"}
                  onClick={() => setDir("outbound")}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    effectiveDir === "outbound"
                      ? "bg-fuchsia-500/20 text-white"
                      : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  {outbound.headsign}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={effectiveDir === "inbound"}
                  onClick={() => setDir("inbound")}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    effectiveDir === "inbound"
                      ? "bg-fuchsia-500/20 text-white"
                      : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  {inbound.headsign}
                </button>
              </div>
            )}

            {effectiveDir === "outbound" && outbound && (
              <DirectionPanel
                detail={outbound}
                onShowRouteMap={openRouteMap}
                onShowStopMap={openStopMap}
              />
            )}
            {effectiveDir === "inbound" && inbound && (
              <DirectionPanel
                detail={inbound}
                onShowRouteMap={openRouteMap}
                onShowStopMap={openStopMap}
              />
            )}
          </TransjakartaMotionSection>
        </>
      )}
    </TransjakartaPageBackdrop>
  );
}

export function TransjakartaRouteDetailPage({ id }: Props) {
  return (
    <AppProviders>
      <TransjakartaRouteDetailPageInner id={id} />
    </AppProviders>
  );
}
