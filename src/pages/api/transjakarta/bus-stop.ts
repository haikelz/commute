import { jsonOk } from "@/lib/api-json";
import { CC_TIJE_BUS_STOP } from "@/lib/cache-control";
import { responseFromUpstreamError } from "@/lib/krl-api-error";
import { transjakartaUpstreamGetJson } from "@/lib/transjakarta-upstream";
import type { APIRoute } from "astro";

export const prerender = false;

function isTransjakartaOk(
  body: unknown
): body is { code: number; message: string } {
  return (
    typeof body === "object" &&
    body !== null &&
    "code" in body &&
    typeof (body as { code: unknown }).code === "number"
  );
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const lon = url.searchParams.get("longitude");
  const lat = url.searchParams.get("latitude");
  const radius = url.searchParams.get("radius") ?? "1";

  if (!lon || !lat) {
    return new Response(
      JSON.stringify({
        status: 400,
        message: "longitude and latitude query parameters are required",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const lonN = Number(lon);
  const latN = Number(lat);

  if (!Number.isFinite(lonN) || !Number.isFinite(latN)) {
    return new Response(
      JSON.stringify({ status: 400, message: "Invalid coordinates" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const body = await transjakartaUpstreamGetJson("bus-stop", {
      longitude: String(lonN),
      latitude: String(latN),
      radius,
    });
    if (!isTransjakartaOk(body) || body.code !== 200) {
      const msg =
        isTransjakartaOk(body) && typeof body.message === "string"
          ? body.message
          : "Transjakarta bus-stop error";
      return new Response(JSON.stringify({ status: 502, message: msg }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }
    return jsonOk(body, CC_TIJE_BUS_STOP);
  } catch (e) {
    return responseFromUpstreamError(e);
  }
};
