import { jsonOk } from "@/lib/api-json";
import { CC_SCHEDULES } from "@/lib/cache-control";
import { responseFromUpstreamError } from "@/lib/krl-api-error";
import { krlUpstreamGetJson } from "@/lib/krl-upstream";

export const prerender = false;

export async function GET({ url }: { url: URL }) {
  const stationid = url.searchParams.get("stationid");

  if (!stationid) {
    return new Response(
      JSON.stringify({ status: 400, message: "stationid wajib diisi" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const timefrom = url.searchParams.get("timefrom") ?? "00:00";
  const timeto = url.searchParams.get("timeto") ?? "23:00";

  try {
    const data = await krlUpstreamGetJson("schedules", {
      stationid,
      timefrom,
      timeto,
    });
    return jsonOk(data, CC_SCHEDULES);
  } catch (e) {
    return responseFromUpstreamError(e);
  }
}
