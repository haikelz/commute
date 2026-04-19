import type {
  TransjakartaBusLiveEnvelope,
  TransjakartaBusLivePayload,
  TransjakartaBusOfflineEnvelope,
  TransjakartaBusOfflineItem,
  TransjakartaDetailEnvelope,
  TransjakartaListEnvelope,
  TransjakartaLocEventPayload,
  TransjakartaRouteDetailPayload,
  TransjakartaRouteSummary,
  TransjakartaStop,
} from "@/types/transjakarta";
import ky from "ky";

function getOrigin() {
  if (typeof window !== "undefined") return window.location.origin;
  return import.meta.env.PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export const transjakartaKy = ky.create({
  baseUrl: `${getOrigin().replace(/\/$/, "")}/`,
  timeout: 30000,
});

export async function fetchTransjakartaRoutes(): Promise<
  TransjakartaRouteSummary[]
> {
  const res = await transjakartaKy
    .get("api/transjakarta/routes")
    .json<TransjakartaListEnvelope<TransjakartaRouteSummary[]>>();

  if (res.code !== 200) throw new Error(res.message);

  return res.data;
}

export async function fetchTransjakartaRouteDetail(
  id: string
): Promise<TransjakartaRouteDetailPayload> {
  const enc = encodeURIComponent(id);
  const res = await transjakartaKy
    .get(`api/transjakarta/route/${enc}`)
    .json<TransjakartaDetailEnvelope>();

  if (res.code !== 200) throw new Error(res.message);

  return res.data;
}

export async function fetchTransjakartaBusStopsNear(
  longitude: number,
  latitude: number,
  radiusKm = 1
): Promise<TransjakartaStop[]> {
  const res = await transjakartaKy
    .get("api/transjakarta/bus-stop", {
      searchParams: {
        longitude: String(longitude),
        latitude: String(latitude),
        radius: String(radiusKm),
      },
    })
    .json<TransjakartaListEnvelope<TransjakartaStop[]>>();

  if (res.code !== 200) throw new Error(res.message);

  return res.data;
}

export async function postTransjakartaBusOffline(
  payload: TransjakartaLocEventPayload
): Promise<TransjakartaBusOfflineItem[]> {
  const res = await transjakartaKy
    .post("api/transjakarta/bus-offline", { json: payload })
    .json<TransjakartaBusOfflineEnvelope>();

  if (res.code !== 200) throw new Error(res.message);

  return res.data;
}

export async function postTransjakartaBusLive(
  payload: TransjakartaLocEventPayload
): Promise<TransjakartaBusLivePayload> {
  const res = await transjakartaKy
    .post("api/transjakarta/bus", { json: payload })
    .json<TransjakartaBusLiveEnvelope>();

  if (res.code !== 200) throw new Error(res.message);

  return res.data;
}
