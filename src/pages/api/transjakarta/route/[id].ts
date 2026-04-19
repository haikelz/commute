import { jsonOk } from "@/lib/api-json";
import { CC_TIJE_ROUTE_DETAIL } from "@/lib/cache-control";
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

export const GET: APIRoute = async ({ params }) => {
  const raw = params.id;

  if (!raw) {
    return new Response(
      JSON.stringify({ status: 400, message: "id required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const id = decodeURIComponent(raw);

  try {
    const path = `route/${encodeURIComponent(id)}`;
    const body = await transjakartaUpstreamGetJson(path);
    if (!isTransjakartaOk(body) || body.code !== 200) {
      const msg =
        isTransjakartaOk(body) && typeof body.message === "string"
          ? body.message
          : "Transjakarta route detail error";
      return new Response(JSON.stringify({ status: 502, message: msg }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }
    return jsonOk(body, CC_TIJE_ROUTE_DETAIL);
  } catch (e) {
    return responseFromUpstreamError(e);
  }
};
