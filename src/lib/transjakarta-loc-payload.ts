import type { TransjakartaLocEventPayload } from "@/types/transjakarta";

export function parseTransjakartaLocPayload(
  raw: unknown
): TransjakartaLocEventPayload | null {
  if (typeof raw !== "object" || raw === null) return null;

  const o = raw as Record<string, unknown>;
  const lat = Number(o.latitude);
  const lon = Number(o.longitude);
  const radius = Number(o.radius ?? 1);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    !Number.isFinite(radius)
  ) {
    return null;
  }

  const event =
    typeof o.event === "string" && o.event.length > 0 ? o.event : "change_loc";

  return { latitude: lat, longitude: lon, radius, event };
}
