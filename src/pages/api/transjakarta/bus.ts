import { jsonOk } from "@/lib/api-json";
import { CC_TIJE_LIVE } from "@/lib/cache-control";
import { responseFromUpstreamError } from "@/lib/krl-api-error";
import { parseTransjakartaLocPayload } from "@/lib/transjakarta-loc-payload";
import {
  transjakartaUpstreamPostJson,
  withTransjakartaCredentialHint,
} from "@/lib/transjakarta-upstream";
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

export const POST: APIRoute = async ({ request }) => {
  let raw: unknown;

  try {
    raw = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ status: 400, message: "Invalid JSON body" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const loc = parseTransjakartaLocPayload(raw);

  if (!loc) {
    return new Response(
      JSON.stringify({
        status: 400,
        message:
          "Body must include latitude, longitude, and optional radius, event",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await transjakartaUpstreamPostJson("bus", loc);

    if (!isTransjakartaOk(body) || body.code !== 200) {
      const msg =
        isTransjakartaOk(body) && typeof body.message === "string"
          ? body.message
          : "Transjakarta bus error";
      return new Response(
        JSON.stringify({
          status: 502,
          message: withTransjakartaCredentialHint(msg),
        }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return jsonOk(body, CC_TIJE_LIVE);
  } catch (e) {
    return responseFromUpstreamError(e);
  }
};
