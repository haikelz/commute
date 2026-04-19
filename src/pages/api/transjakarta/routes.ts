import { jsonOk } from "@/lib/api-json";
import { CC_TIJE_ROUTES } from "@/lib/cache-control";
import { responseFromUpstreamError } from "@/lib/krl-api-error";
import { transjakartaUpstreamGetJson } from "@/lib/transjakarta-upstream";

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

export async function GET() {
  try {
    const body = await transjakartaUpstreamGetJson("route", { limit: "300" });
    if (!isTransjakartaOk(body) || body.code !== 200) {
      const msg =
        isTransjakartaOk(body) && typeof body.message === "string"
          ? body.message
          : "Transjakarta routes error";
      return new Response(JSON.stringify({ status: 502, message: msg }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }
    return jsonOk(body, CC_TIJE_ROUTES);
  } catch (e) {
    return responseFromUpstreamError(e);
  }
}
