import ky from "ky";
import type {
  KrlApiListResponse,
  KrlFareItem,
  KrlScheduleItem,
  KrlStation,
  KrlTrainStop,
} from "../types/krl";

function getOrigin() {
  if (typeof window !== "undefined") return window.location.origin;
  return import.meta.env.PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export const krlKy = ky.create({
  baseUrl: `${getOrigin().replace(/\/$/, "")}/`,
  timeout: 30000,
});

export async function fetchStations(): Promise<KrlStation[]> {
  const res = await krlKy
    .get("api/stations")
    .json<KrlApiListResponse<KrlStation[]>>();
  return res.data
    .filter((s) => s.fg_enable === 1 && !s.sta_id.startsWith("WIL"))
    .sort((a, b) => a.sta_name.localeCompare(b.sta_name, "id"));
}

export async function fetchSchedules(
  stationId: string,
  timefrom = "00:00",
  timeto = "23:00"
) {
  const res = await krlKy
    .get("api/schedules", {
      searchParams: { stationid: stationId, timefrom, timeto },
    })
    .json<KrlApiListResponse<KrlScheduleItem[]>>();
  return res.data;
}

export async function fetchTrainDetail(trainId: string) {
  const res = await krlKy
    .get("api/schedules-train", {
      searchParams: { trainid: trainId },
    })
    .json<KrlApiListResponse<KrlTrainStop[]>>();
  return res.data;
}

export async function fetchFare(stationFrom: string, stationTo: string) {
  const res = await krlKy
    .get("api/fare", {
      searchParams: { stationfrom: stationFrom, stationto: stationTo },
    })
    .json<KrlApiListResponse<KrlFareItem[]>>();
  return res.data;
}
