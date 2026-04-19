import { AppProviders } from "@/components/providers/app-providers";
import {
  glassPanelClass,
  TransjakartaMotionBackLink,
  TransjakartaMotionHeroTitle,
  TransjakartaMotionLead,
  TransjakartaMotionSection,
  TransjakartaPageBackdrop,
} from "@/components/transjakarta/transjakarta-page-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TransjakartaNearbyMap } from "@/components/transjakarta/transjakarta-nearby-map";
import { fetchTransjakartaBusStopsNear } from "@/lib/transjakarta-client";
import type { TransjakartaStop } from "@/types/transjakarta";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { LocateFixed, Map, MapPin } from "lucide-react";
import { useCallback, useState } from "react";

const kmFmt = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});

function StopRow({
  s,
  onShowOnMap,
}: {
  s: TransjakartaStop;
  onShowOnMap: (stop: TransjakartaStop) => void;
}) {
  const d =
    typeof s.distance === "number" ? `${kmFmt.format(s.distance)} km` : "—";
  return (
    <li className="border-b border-white/5 px-4 py-3 last:border-0 hover:bg-white/[0.04]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-zinc-100">{s.stop_name}</p>
          <p className="mt-0.5 text-xs text-zinc-500 capitalize">
            {s.bus_stop_type} · {d}
          </p>
          <p className="mt-1 font-mono text-[11px] text-zinc-600">
            {s.stop_id}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            document
              .getElementById("transjakarta-nearby-map")
              ?.scrollIntoView({ behavior: "smooth", block: "center" });
            onShowOnMap(s);
          }}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-transparent px-2 py-1 text-sm text-fuchsia-400/90 hover:border-fuchsia-500/25 hover:bg-fuchsia-500/10 hover:text-fuchsia-300"
        >
          <Map className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Lihat di peta
        </button>
      </div>
    </li>
  );
}

function TransjakartaNearbyPageInner() {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(
    null
  );
  const [pickMode, setPickMode] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [radius, setRadius] = useState(1);
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [mapFocusStopId, setMapFocusStopId] = useState<string | null>(null);
  const [mapFocusSeq, setMapFocusSeq] = useState(0);

  const clearMapFocus = useCallback(() => {
    setMapFocusStopId(null);
  }, []);

  const { data, isFetching, isError, error, isPlaceholderData } = useQuery({
    queryKey: ["transjakarta", "bus-stop", coords?.lat, coords?.lon, radius],
    queryFn: () =>
      coords
        ? fetchTransjakartaBusStopsNear(coords.lon, coords.lat, radius)
        : Promise.resolve([]),
    enabled: coords !== null,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const mapStops =
    coords && !isPlaceholderData && data ? data : ([] as TransjakartaStop[]);

  const handleMapPick = useCallback((lat: number, lon: number) => {
    setGeoError(null);
    setCoords({ lat, lon });
    setPickMode(false);
  }, []);

  function requestLocation() {
    setGeoError(null);
    setPickMode(false);
    if (!navigator.geolocation) {
      setGeoError("Peramban tidak mendukung geolokasi.");
      return;
    }
    setLoadingGeo(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLoadingGeo(false);
      },
      (err) => {
        setGeoError(err.message || "Tidak bisa mengakses lokasi.");
        setLoadingGeo(false);
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 }
    );
  }

  return (
    <TransjakartaPageBackdrop>
      <TransjakartaMotionBackLink href="/transjakarta">
        ← TransJakarta
      </TransjakartaMotionBackLink>
      <header className="mb-6 text-center sm:text-left">
        <TransjakartaMotionHeroTitle className="text-3xl sm:text-4xl">
          Halte terdekat
        </TransjakartaMotionHeroTitle>
        <TransjakartaMotionLead
          className="mt-2 max-w-xl text-sm text-zinc-400"
          delay={0.08}
        >
          Gunakan lokasi perangkat atau pilih titik di peta, lalu atur radius
          (kilometer) untuk mencari halte di sekitar titik acuan.
        </TransjakartaMotionLead>
      </header>

      <TransjakartaMotionSection delay={0.05} className={glassPanelClass}>
        <div className="flex flex-wrap items-center gap-3 p-5 sm:p-6">
          <button
            type="button"
            onClick={() => setPickMode((p) => !p)}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
              pickMode
                ? "border-amber-400/60 bg-amber-500/20 text-amber-100"
                : "border-white/15 bg-white/5 text-zinc-100 hover:bg-white/10"
            }`}
          >
            <MapPin className="h-4 w-4" aria-hidden />
            {pickMode ? "Klik peta… (tap lagi untuk batal)" : "Pilih di peta"}
          </button>
          <button
            type="button"
            onClick={requestLocation}
            disabled={loadingGeo}
            className="inline-flex items-center gap-2 rounded-xl border border-fuchsia-500/40 bg-fuchsia-500/15 px-4 py-2.5 text-sm font-medium text-fuchsia-100 transition-colors hover:bg-fuchsia-500/25 disabled:opacity-50"
          >
            <LocateFixed className="h-4 w-4" aria-hidden />
            {loadingGeo ? "Mencari lokasi…" : "Gunakan lokasi saya"}
          </button>
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span className="shrink-0">Radius</span>
            <Select
              value={String(radius)}
              onValueChange={(v) => setRadius(Number(v))}
            >
              <SelectTrigger className="h-9 w-[7.5rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 5].map((r) => (
                  <SelectItem key={r} value={String(r)}>
                    {r} km
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {geoError && (
          <p className="mx-5 mb-4 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 sm:mx-6">
            {geoError}
          </p>
        )}

        <TransjakartaNearbyMap
          coords={coords}
          stops={mapStops}
          pickMode={pickMode}
          onMapPick={handleMapPick}
          focusStopId={mapFocusStopId}
          focusStopSeq={mapFocusSeq}
          onFocusStopHandled={clearMapFocus}
        />

        {coords && (
          <p className="mx-5 mb-4 font-mono text-xs text-zinc-600 sm:mx-6">
            {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}
          </p>
        )}

        {coords && isFetching && (
          <p className="py-8 text-center text-sm text-zinc-500">
            Memuat halte…
          </p>
        )}
        {isError && (
          <p className="mx-5 mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200 sm:mx-6">
            {error instanceof Error ? error.message : "Gagal memuat halte."}
          </p>
        )}

        {coords && !isFetching && !isError && data && (
          <div className="overflow-hidden border-t border-white/10 bg-black/25">
            {data.length === 0 ? (
              <p className="p-6 text-center text-sm text-zinc-500">
                Tidak ada halte dalam radius ini. Perbesar radius atau pindah
                lokasi.
              </p>
            ) : (
              <ul>
                {data.map((s: TransjakartaStop) => (
                  <StopRow
                    key={s.stop_id}
                    s={s}
                    onShowOnMap={(stop) => {
                      setMapFocusStopId(stop.stop_id);
                      setMapFocusSeq((n) => n + 1);
                    }}
                  />
                ))}
              </ul>
            )}
          </div>
        )}

        {!coords && !loadingGeo && (
          <p className="border-t border-white/10 px-5 py-4 text-sm text-zinc-600 sm:px-6">
            Pilih titik acuan lewat GPS atau mode &quot;Pilih di peta&quot; di
            atas, lalu lihat daftar halte di bawah.
          </p>
        )}
      </TransjakartaMotionSection>
    </TransjakartaPageBackdrop>
  );
}

export function TransjakartaNearbyPage() {
  return (
    <AppProviders>
      <TransjakartaNearbyPageInner />
    </AppProviders>
  );
}
