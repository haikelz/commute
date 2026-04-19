import { MapFullscreenFrame } from "@/components/transjakarta/map-fullscreen-frame";
import { transjakartaStopPopupHtml } from "@/components/transjakarta/transjakarta-stop-popup-html";
import { AnimatedModal } from "@/components/ui/animated-modal";
import { transjakartaOsmRasterStyle } from "@/lib/transjakarta-maplibre-osm-style";
import type { TransjakartaStop } from "@/types/transjakarta";
import polyline from "@mapbox/polyline";
import { X } from "lucide-react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useEffect, useRef } from "react";

function hexLineColor(raw: string): string {
  const t = raw.replace(/^#/, "");
  if (/^[0-9A-Fa-f]{6}$/.test(t)) return `#${t}`;
  return "#d946ef";
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  tripId: string;
  routeColor: string;
  stops: TransjakartaStop[];
  polyline?: string;
  focusStopId: string | null;
};

export function TransjakartaRouteMapModal({
  open,
  onOpenChange,
  title,
  description,
  tripId,
  routeColor,
  stops,
  polyline: encodedPolyline,
  focusStopId,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  const resizeMap = useCallback(() => {
    mapRef.current?.resize();
  }, []);

  useEffect(() => {
    if (!open) {
      popupRef.current?.remove();
      popupRef.current = null;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    const first = stops[0];
    const map = new maplibregl.Map({
      container,
      style: transjakartaOsmRasterStyle as maplibregl.StyleSpecification,
      center: first ? [first.stop_lon, first.stop_lat] : [106.8456, -6.2088],
      zoom: 12,
      maxZoom: 19,
    });
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right"
    );
    mapRef.current = map;
    popupRef.current = new maplibregl.Popup({
      closeButton: true,
      maxWidth: "300px",
    });

    const lineColor = hexLineColor(routeColor);

    map.on("load", () => {
      if (cancelled) return;
      map.resize();

      let lineCoords: [number, number][] = [];
      if (encodedPolyline && encodedPolyline.length > 2) {
        try {
          const pairs = polyline.decode(encodedPolyline, 5);
          lineCoords = pairs.map(
            ([lat, lng]) => [lng, lat] as [number, number]
          );
        } catch {
          lineCoords = [];
        }
      }

      map.addSource("route-line", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features:
            lineCoords.length >= 2
              ? [
                  {
                    type: "Feature",
                    properties: {},
                    geometry: { type: "LineString", coordinates: lineCoords },
                  },
                ]
              : [],
        },
      });
      map.addLayer({
        id: "route-line-layer",
        type: "line",
        source: "route-line",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": lineColor,
          "line-width": 5,
          "line-opacity": 0.85,
        },
      });

      map.addSource("route-stops", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: stops.map((s) => {
            const routes =
              s.routes && s.routes.length > 0
                ? s.routes
                    .slice(0, 8)
                    .map((r) => r.route_short_name)
                    .join(", ") + (s.routes.length > 8 ? "…" : "")
                : "—";
            return {
              type: "Feature" as const,
              properties: {
                name: s.stop_name,
                id: s.stop_id,
                platform: s.platform_code || "—",
                type: s.bus_stop_type || "—",
                distance: "",
                routes,
              },
              geometry: {
                type: "Point" as const,
                coordinates: [s.stop_lon, s.stop_lat] as [number, number],
              },
            };
          }),
        },
      });
      map.addLayer({
        id: "route-stops-circle",
        type: "circle",
        source: "route-stops",
        paint: {
          "circle-radius": 6,
          "circle-color": "#38bdf8",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#0f172a",
        },
      });
      map.addLayer({
        id: "route-stops-label",
        type: "symbol",
        source: "route-stops",
        layout: {
          "text-field": ["get", "name"],
          "text-size": 10,
          "text-offset": [0, 1.2],
          "text-anchor": "top",
          "text-max-width": 8,
        },
        paint: {
          "text-color": "#e4e4e7",
          "text-halo-color": "#18181b",
          "text-halo-width": 1,
        },
      });

      function showStopPopup(e: maplibregl.MapLayerMouseEvent) {
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
      map.on("click", "route-stops-circle", showStopPopup);
      map.on("click", "route-stops-label", showStopPopup);

      map.on("mouseenter", "route-stops-circle", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "route-stops-circle", () => {
        map.getCanvas().style.cursor = "";
      });
      map.on("mouseenter", "route-stops-label", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "route-stops-label", () => {
        map.getCanvas().style.cursor = "";
      });

      const bounds = new maplibregl.LngLatBounds();
      stops.forEach((s) => bounds.extend([s.stop_lon, s.stop_lat]));
      lineCoords.forEach((c) => bounds.extend(c));

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 56, maxZoom: 14, duration: 0 });
      }

      if (focusStopId) {
        const s = stops.find((x) => x.stop_id === focusStopId);
        if (s) {
          map.flyTo({
            center: [s.stop_lon, s.stop_lat],
            zoom: Math.max(map.getZoom(), 15),
            essential: true,
          });
        }
      }
    });

    return () => {
      cancelled = true;
      popupRef.current?.remove();
      popupRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [open, tripId, routeColor, encodedPolyline ?? "", focusStopId, stops]);

  return (
    <AnimatedModal
      open={open}
      onOpenChange={onOpenChange}
      className="flex max-h-[90vh] flex-col p-0"
    >
      <div className="flex max-h-[90vh] flex-col">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
              {title}
            </h2>
            {description ? (
              <p
                id="route-map-modal-desc"
                className="mt-1 text-sm text-zinc-500"
              >
                {description}
              </p>
            ) : (
              <p id="route-map-modal-desc" className="sr-only">
                Peta halte dan lintasan rute
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="shrink-0 rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500/40"
            aria-label="Tutup"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <MapFullscreenFrame mapResize={resizeMap}>
          <div
            ref={containerRef}
            className="h-full min-h-[280px] w-full bg-zinc-900"
            aria-describedby="route-map-modal-desc"
          />
        </MapFullscreenFrame>
      </div>
    </AnimatedModal>
  );
}
