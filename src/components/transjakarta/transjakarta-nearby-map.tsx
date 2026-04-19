import { MapFullscreenFrame } from "@/components/transjakarta/map-fullscreen-frame";
import { transjakartaStopPopupHtml } from "@/components/transjakarta/transjakarta-stop-popup-html";
import { transjakartaOsmRasterStyle } from "@/lib/transjakarta-maplibre-osm-style";
import type { TransjakartaStop } from "@/types/transjakarta";
import type { FeatureCollection, Point } from "geojson";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const JAKARTA_DEFAULT = { lat: -6.2088, lon: 106.8456 };

const kmFmt = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});

function emptyFc(): FeatureCollection {
  return { type: "FeatureCollection", features: [] };
}

function stopToPopupArgs(s: TransjakartaStop) {
  const routes =
    s.routes && s.routes.length > 0
      ? s.routes
          .slice(0, 8)
          .map((r) => r.route_short_name)
          .join(", ") + (s.routes.length > 8 ? "…" : "")
      : "—";
  const distance =
    typeof s.distance === "number" && Number.isFinite(s.distance)
      ? `${kmFmt.format(s.distance)} km`
      : "";
  return {
    name: s.stop_name,
    id: s.stop_id,
    platform: s.platform_code || "—",
    type: s.bus_stop_type || "—",
    distance,
    routes,
  };
}

type TransjakartaNearbyMapProps = {
  coords: { lat: number; lon: number } | null;
  stops: TransjakartaStop[];
  pickMode: boolean;
  onMapPick: (lat: number, lon: number) => void;
  focusStopId: string | null;
  focusStopSeq: number;
  onFocusStopHandled: () => void;
};

export function TransjakartaNearbyMap({
  coords,
  stops,
  pickMode,
  onMapPick,
  focusStopId,
  focusStopSeq,
  onFocusStopHandled,
}: TransjakartaNearbyMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const pickModeRef = useRef(pickMode);
  const onMapPickRef = useRef(onMapPick);
  const [mapReady, setMapReady] = useState(false);

  pickModeRef.current = pickMode;
  onMapPickRef.current = onMapPick;

  const resizeMap = useCallback(() => {
    mapRef.current?.resize();
  }, []);

  const anchorFc = useMemo((): FeatureCollection => {
    if (!coords) return emptyFc();
    const pt: Point = {
      type: "Point",
      coordinates: [coords.lon, coords.lat],
    };
    return {
      type: "FeatureCollection",
      features: [{ type: "Feature", geometry: pt, properties: {} }],
    };
  }, [coords?.lat, coords?.lon]);

  const stopFc: FeatureCollection = useMemo(() => {
    return {
      type: "FeatureCollection",
      features: stops.map((s) => {
        const args = stopToPopupArgs(s);
        return {
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: [s.stop_lon, s.stop_lat] as [number, number],
          },
          properties: {
            name: args.name,
            id: args.id,
            platform: args.platform,
            type: args.type,
            distance: args.distance,
            routes: args.routes,
          },
        };
      }),
    };
  }, [stops]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    const centerLon = coords?.lon ?? JAKARTA_DEFAULT.lon;
    const centerLat = coords?.lat ?? JAKARTA_DEFAULT.lat;

    const map = new maplibregl.Map({
      container: el,
      style: transjakartaOsmRasterStyle as maplibregl.StyleSpecification,
      center: [centerLon, centerLat],
      zoom: 14,
      maxZoom: 19,
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right"
    );
    popupRef.current = new maplibregl.Popup({
      closeButton: true,
      maxWidth: "300px",
    });

    map.on("load", () => {
      map.resize();
      map.addSource("stops", { type: "geojson", data: emptyFc() });
      map.addLayer({
        id: "stops-circle",
        type: "circle",
        source: "stops",
        paint: {
          "circle-radius": 6,
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

      map.addSource("anchor", { type: "geojson", data: emptyFc() });
      map.addLayer({
        id: "anchor-loc",
        type: "circle",
        source: "anchor",
        paint: {
          "circle-radius": 8,
          "circle-color": "#a78bfa",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fafafa",
        },
      });

      const onStopClick = (e: maplibregl.MapLayerMouseEvent) => {
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
      };
      map.on("click", "stops-circle", onStopClick);
      map.on("click", "stops-label", onStopClick);

      const stopCursorEnter = () => {
        map.getCanvas().style.cursor = pickModeRef.current
          ? "crosshair"
          : "pointer";
      };
      const stopCursorLeave = () => {
        map.getCanvas().style.cursor = pickModeRef.current ? "crosshair" : "";
      };
      map.on("mouseenter", "stops-circle", stopCursorEnter);
      map.on("mouseleave", "stops-circle", stopCursorLeave);
      map.on("mouseenter", "stops-label", stopCursorEnter);
      map.on("mouseleave", "stops-label", stopCursorLeave);

      map.on("click", (e) => {
        if (!pickModeRef.current) return;
        const hits = map.queryRenderedFeatures(e.point, {
          layers: ["stops-circle", "stops-label"],
        });
        if (hits.length) return;
        onMapPickRef.current(e.lngLat.lat, e.lngLat.lng);
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
    (map.getSource("anchor") as maplibregl.GeoJSONSource)?.setData(anchorFc);
  }, [mapReady, anchorFc]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !coords) return;
    map.flyTo({
      center: [coords.lon, coords.lat],
      zoom: Math.max(map.getZoom(), 13),
      essential: true,
    });
  }, [mapReady, coords?.lat, coords?.lon]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    map.getCanvas().style.cursor = pickMode ? "crosshair" : "";
  }, [mapReady, pickMode]);

  useEffect(() => {
    if (!mapReady || !focusStopId || focusStopSeq === 0) return;
    const map = mapRef.current;
    const popup = popupRef.current;
    if (!map?.isStyleLoaded() || !popup) {
      onFocusStopHandled();
      return;
    }
    const s = stops.find((x) => x.stop_id === focusStopId);
    if (!s) {
      onFocusStopHandled();
      return;
    }
    const ll: maplibregl.LngLatLike = [s.stop_lon, s.stop_lat];
    popup
      .setLngLat(ll)
      .setHTML(transjakartaStopPopupHtml(stopToPopupArgs(s)))
      .addTo(map);
    map.flyTo({
      center: ll,
      zoom: Math.max(map.getZoom(), 15),
      essential: true,
    });
    onFocusStopHandled();
  }, [mapReady, focusStopId, focusStopSeq, stops, onFocusStopHandled]);

  return (
    <div
      id="transjakarta-nearby-map"
      className="border-t border-white/10 px-2 pb-3 pt-3 sm:px-4"
    >
      <MapFullscreenFrame mapResize={resizeMap}>
        <div
          ref={containerRef}
          className="h-full min-h-[240px] w-full overflow-hidden"
        />
      </MapFullscreenFrame>
      <p className="mt-2 text-center text-xs text-zinc-500">
        {pickMode
          ? "Ketuk titik di peta untuk titik acuan pencarian halte."
          : "Ketuk marker halte atau “Lihat di peta” pada daftar untuk detail. Aktifkan “Pilih di peta” untuk mengubah titik acuan."}
      </p>
    </div>
  );
}
