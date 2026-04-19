import { AppProviders } from "@/components/providers/app-providers";
import { MapFullscreenFrame } from "@/components/transjakarta/map-fullscreen-frame";
import {
  glassPanelClass,
  TransjakartaMotionBackLink,
  TransjakartaMotionHeroTitle,
  TransjakartaMotionLead,
  TransjakartaMotionSection,
  TransjakartaPageBackdrop,
} from "@/components/transjakarta/transjakarta-page-motion";
import { transjakartaStopPopupHtml } from "@/components/transjakarta/transjakarta-stop-popup-html";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/cn";
import { transjakartaOsmRasterStyle } from "@/lib/transjakarta-maplibre-osm-style";
import {
  fetchTransjakartaBusStopsNear,
  postTransjakartaBusLive,
  postTransjakartaBusOffline,
} from "@/lib/transjakarta-client";
import type {
  TransjakartaBusOfflineItem,
  TransjakartaStop,
} from "@/types/transjakarta";
import polyline from "@mapbox/polyline";
import { useQuery } from "@tanstack/react-query";
import type { FeatureCollection, LineString, Point } from "geojson";
import { LocateFixed, MapPin } from "lucide-react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const JAKARTA_DEFAULT = { lat: -6.2088, lon: 106.8456 };

const kmFmt = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});

function hexColor(raw: string, fallback = "#64748b"): string {
  const t = raw.replace(/^#/, "");
  if (/^[0-9A-Fa-f]{6}$/.test(t)) return `#${t}`;
  return fallback;
}

function decodeCorridor(encoded: string): LineString | null {
  if (!encoded || encoded.length < 2) return null;

  try {
    const pairs = polyline.decode(encoded, 5);
    if (pairs.length < 2) return null;
    const coordinates = pairs.map(
      ([lat, lng]) => [lng, lat] as [number, number]
    );
    return { type: "LineString", coordinates };
  } catch {
    return null;
  }
}

function emptyFc(): FeatureCollection {
  return { type: "FeatureCollection", features: [] };
}

function TransjakartaLiveMapPageInner() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const pickModeRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const [searchCenter, setSearchCenter] = useState<{
    lat: number;
    lon: number;
  }>(() => ({
    ...JAKARTA_DEFAULT,
  }));
  const [pickMode, setPickMode] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [radius, setRadius] = useState(1);
  const [loadingGeo, setLoadingGeo] = useState(false);

  pickModeRef.current = pickMode;

  const resizeMap = useCallback(() => {
    mapRef.current?.resize();
  }, []);

  const { data, isFetching, isError, error, dataUpdatedAt } = useQuery({
    queryKey: [
      "transjakarta",
      "live-map",
      searchCenter.lat,
      searchCenter.lon,
      radius,
    ],
    queryFn: async () => {
      const payload = {
        latitude: searchCenter.lat,
        longitude: searchCenter.lon,
        radius,
        event: "change_loc",
      };
      const [offline, live, stops] = await Promise.all([
        postTransjakartaBusOffline(payload),
        postTransjakartaBusLive(payload),
        fetchTransjakartaBusStopsNear(
          searchCenter.lon,
          searchCenter.lat,
          radius
        ),
      ]);
      return { offline, live, stops };
    },
    enabled: true,
    refetchInterval: 5_000,
  });

  const offlineBuses = data?.offline ?? [];
  const corridorLine = useMemo(
    () => decodeCorridor(data?.live.polyline ?? ""),
    [data?.live.polyline]
  );

  const busFc: FeatureCollection = useMemo(() => {
    const features = offlineBuses.map((b: TransjakartaBusOfflineItem) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [b.longitude, b.latitude] as [number, number],
      },
      properties: {
        id: b.bus_body_no,
        label: b.route_code,
        color: hexColor(b.route_color),
        title: b.bus_body_no,
        subtitle: `${b.route_name} · ${b.trip_headsign || "—"}`,
        next: b.next_stops || "—",
        bearing: b.bearing,
      },
    }));
    return { type: "FeatureCollection", features };
  }, [offlineBuses]);

  const stopFc: FeatureCollection = useMemo(() => {
    const stops: TransjakartaStop[] = data?.stops ?? [];
    return {
      type: "FeatureCollection",
      features: stops.map((s) => {
        const distStr =
          typeof s.distance === "number" && Number.isFinite(s.distance)
            ? `${kmFmt.format(s.distance)} km`
            : "";
        const routes =
          s.routes && s.routes.length > 0
            ? s.routes
                .slice(0, 8)
                .map((r) => r.route_short_name)
                .join(", ") + (s.routes.length > 8 ? "…" : "")
            : "—";
        return {
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: [s.stop_lon, s.stop_lat] as [number, number],
          },
          properties: {
            name: s.stop_name,
            id: s.stop_id,
            platform: s.platform_code || "—",
            type: s.bus_stop_type || "—",
            distance: distStr,
            routes,
          },
        };
      }),
    };
  }, [data?.stops]);

  const corridorFc: FeatureCollection = useMemo(() => {
    if (!corridorLine) return emptyFc();
    return {
      type: "FeatureCollection",
      features: [
        { type: "Feature" as const, geometry: corridorLine, properties: {} },
      ],
    };
  }, [corridorLine]);

  const anchorPoint: FeatureCollection = useMemo(() => {
    const pt: Point = {
      type: "Point",
      coordinates: [searchCenter.lon, searchCenter.lat],
    };
    return {
      type: "FeatureCollection",
      features: [{ type: "Feature", geometry: pt, properties: {} }],
    };
  }, [searchCenter.lat, searchCenter.lon]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    const map = new maplibregl.Map({
      container: el,
      style: transjakartaOsmRasterStyle as maplibregl.StyleSpecification,
      center: [JAKARTA_DEFAULT.lon, JAKARTA_DEFAULT.lat],
      zoom: 14,
      maxZoom: 19,
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right"
    );
    popupRef.current = new maplibregl.Popup({
      closeButton: true,
      maxWidth: "280px",
    });

    map.on("load", () => {
      map.addSource("corridor", { type: "geojson", data: emptyFc() });
      map.addLayer({
        id: "corridor-line",
        type: "line",
        source: "corridor",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#d946ef",
          "line-width": 4,
          "line-opacity": 0.55,
        },
      });

      map.addSource("stops", { type: "geojson", data: emptyFc() });
      map.addLayer({
        id: "stops-circle",
        type: "circle",
        source: "stops",
        paint: {
          "circle-radius": 5,
          "circle-color": "#38bdf8",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#0f172a",
        },
      });
      map.addLayer({
        id: "stops-label",
        type: "symbol",
        source: "stops",
        minzoom: 11,
        layout: {
          "text-field": ["get", "name"],
          "text-size": 10,
          "text-offset": [0, 1.15],
          "text-anchor": "top",
          "text-max-width": 9,
        },
        paint: {
          "text-color": "#e0f2fe",
          "text-halo-color": "#0c4a6e",
          "text-halo-width": 1.1,
        },
      });

      map.addSource("buses", { type: "geojson", data: emptyFc() });
      map.addLayer({
        id: "buses-circle",
        type: "circle",
        source: "buses",
        paint: {
          "circle-radius": 10,
          "circle-color": ["get", "color"],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fafafa",
        },
      });

      map.addLayer({
        id: "buses-label",
        type: "symbol",
        source: "buses",
        layout: {
          "text-field": ["get", "label"],
          "text-size": 11,
          "text-offset": [0, 0],
          "text-anchor": "center",
        },
        paint: {
          "text-color": "#0f172a",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1.2,
        },
      });

      map.addSource("user", { type: "geojson", data: emptyFc() });
      map.addLayer({
        id: "user-loc",
        type: "circle",
        source: "user",
        paint: {
          "circle-radius": 7,
          "circle-color": "#a78bfa",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fafafa",
        },
      });

      map.on("click", "buses-circle", (e) => {
        const f = e.features?.[0];
        if (!f?.properties) return;
        const p = f.properties as Record<string, unknown>;
        const title = String(p.title ?? "");
        const subtitle = String(p.subtitle ?? "");
        const next = String(p.next ?? "");
        popupRef.current
          ?.setLngLat(e.lngLat)
          .setHTML(
            `<div style="font-family:system-ui,sans-serif;font-size:13px;line-height:1.4;color:#18181b">
              <div style="font-weight:600">${title}</div>
              <div style="opacity:.85;margin-top:4px">${subtitle}</div>
              <div style="margin-top:8px;font-size:12px"><span style="opacity:.7">Berikutnya:</span> ${next}</div>
            </div>`
          )
          .addTo(map);
      });

      function onStopClick(e: maplibregl.MapLayerMouseEvent) {
        const f = e.features?.[0];
        if (!f?.properties) return;
        const p = f.properties as Record<string, unknown>;
        popupRef.current
          ?.setLngLat(e.lngLat)
          .setHTML(
            transjakartaStopPopupHtml({
              name: String(p.name ?? ""),
              id: String(p.id ?? ""),
              platform: String(p.platform ?? "—"),
              type: String(p.type ?? "—"),
              distance: String(p.distance ?? ""),
              routes: String(p.routes ?? "—"),
            })
          )
          .addTo(map);
      }
      map.on("click", "stops-circle", onStopClick);
      map.on("click", "stops-label", onStopClick);

      map.on("mouseenter", "buses-circle", () => {
        map.getCanvas().style.cursor = pickModeRef.current
          ? "crosshair"
          : "pointer";
      });
      map.on("mouseleave", "buses-circle", () => {
        map.getCanvas().style.cursor = pickModeRef.current ? "crosshair" : "";
      });

      function stopCursorEnter() {
        map.getCanvas().style.cursor = pickModeRef.current
          ? "crosshair"
          : "pointer";
      }

      function stopCursorLeave() {
        map.getCanvas().style.cursor = pickModeRef.current ? "crosshair" : "";
      }

      map.on("mouseenter", "stops-circle", stopCursorEnter);
      map.on("mouseleave", "stops-circle", stopCursorLeave);
      map.on("mouseenter", "stops-label", stopCursorEnter);
      map.on("mouseleave", "stops-label", stopCursorLeave);

      map.on("click", (e) => {
        if (!pickModeRef.current) return;

        const hits = map.queryRenderedFeatures(e.point, {
          layers: [
            "buses-circle",
            "buses-label",
            "stops-circle",
            "stops-label",
          ],
        });

        if (hits.length) return;

        setSearchCenter({ lat: e.lngLat.lat, lon: e.lngLat.lng });
        setPickMode(false);
      });

      setMapReady(true);
    });

    mapRef.current = map;

    return () => {
      popupRef.current?.remove();
      popupRef.current = null;
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  const flyToCenter = useCallback((lat: number, lon: number) => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({
      center: [lon, lat],
      zoom: Math.max(map.getZoom(), 14),
      essential: true,
    });
  }, []);

  useEffect(() => {
    if (!mapReady) return;

    const map = mapRef.current;

    if (!map?.isStyleLoaded()) return;
    (map.getSource("corridor") as maplibregl.GeoJSONSource)?.setData(
      corridorFc
    );
  }, [mapReady, corridorFc]);

  useEffect(() => {
    if (!mapReady) return;

    const map = mapRef.current;

    if (!map?.isStyleLoaded()) return;
    (map.getSource("stops") as maplibregl.GeoJSONSource)?.setData(stopFc);
  }, [mapReady, stopFc]);

  useEffect(() => {
    if (!mapReady) return;

    const map = mapRef.current;

    if (!map?.isStyleLoaded()) return;
    (map.getSource("buses") as maplibregl.GeoJSONSource)?.setData(busFc);
  }, [mapReady, busFc]);

  useEffect(() => {
    if (!mapReady) return;

    const map = mapRef.current;

    if (!map?.isStyleLoaded()) return;
    (map.getSource("user") as maplibregl.GeoJSONSource)?.setData(anchorPoint);
  }, [mapReady, anchorPoint]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !mapReady) return;

    flyToCenter(searchCenter.lat, searchCenter.lon);
  }, [mapReady, searchCenter.lat, searchCenter.lon, flyToCenter]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !mapReady) return;
    map.getCanvas().style.cursor = pickMode ? "crosshair" : "";
  }, [mapReady, pickMode]);

  function requestLocation() {
    setGeoError(null);

    if (!navigator.geolocation) {
      setGeoError("Peramban tidak mendukung geolokasi.");
      return;
    }

    setLoadingGeo(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSearchCenter({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
        setLoadingGeo(false);
      },
      (err) => {
        setGeoError(err.message || "Tidak bisa mengakses lokasi.");
        setLoadingGeo(false);
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 }
    );
  }

  const lastUpdate =
    dataUpdatedAt > 0
      ? new Intl.DateTimeFormat("id-ID", {
          timeStyle: "medium",
          dateStyle: "short",
        }).format(new Date(dataUpdatedAt))
      : null;

  return (
    <TransjakartaPageBackdrop>
      <TransjakartaMotionBackLink href="/transjakarta">
        ← TransJakarta
      </TransjakartaMotionBackLink>
      <header className="mb-6 text-center sm:text-left">
        <TransjakartaMotionHeroTitle className="text-3xl sm:text-4xl">
          Peta armada
        </TransjakartaMotionHeroTitle>
        <TransjakartaMotionLead
          className="mt-2 max-w-2xl text-sm text-zinc-400"
          delay={0.08}
        >
          Lihat persebaran armada bus TransJakarta secara Live. Data diperbarui
          otomatis setiap 5 detik.
        </TransjakartaMotionLead>
      </header>

      <TransjakartaMotionSection
        delay={0.05}
        className={cn(glassPanelClass, "p-5 sm:p-6")}
      >
        <div className="mb-4 flex flex-wrap items-center gap-3">
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
          {lastUpdate && (
            <span className="text-xs text-zinc-600">
              Diperbarui: {lastUpdate}
            </span>
          )}
          {isFetching && <span className="text-xs text-zinc-500">Memuat…</span>}
        </div>

        {geoError && (
          <p className="mb-4 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {geoError}
          </p>
        )}

        {isError && (
          <p className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error instanceof Error ? error.message : "Gagal memuat data peta."}
          </p>
        )}

        <p className="mb-2 font-mono text-xs text-zinc-600">
          {searchCenter.lat.toFixed(5)}, {searchCenter.lon.toFixed(5)} ·{" "}
          {offlineBuses.length} bus · {data?.stops.length ?? 0} halte
        </p>

        <MapFullscreenFrame mapResize={resizeMap}>
          <div
            ref={containerRef}
            className="h-full min-h-[240px] w-full overflow-hidden"
          />
        </MapFullscreenFrame>

        <ul className="mt-4 flex flex-wrap gap-4 text-xs text-zinc-500">
          <li className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-violet-400 ring-2 ring-zinc-900" />
            Titik acuan
          </li>
          <li className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-sky-400 ring-2 ring-zinc-900" />
            Halte
          </li>
          <li className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-fuchsia-500 ring-2 ring-zinc-900" />
            Koridor (polyline)
          </li>
        </ul>
      </TransjakartaMotionSection>
    </TransjakartaPageBackdrop>
  );
}

export function TransjakartaLiveMapPage() {
  return (
    <AppProviders>
      <TransjakartaLiveMapPageInner />
    </AppProviders>
  );
}
