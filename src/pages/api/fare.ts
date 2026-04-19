import { jsonOk } from "@/lib/api-json";
import { CC_FARE } from "@/lib/cache-control";
import { responseFromUpstreamError } from "@/lib/krl-api-error";
import { krlUpstreamGetJson } from "@/lib/krl-upstream";

export const prerender = false;

export async function GET({ url }: { url: URL }) {
  const stationfrom = url.searchParams.get("stationfrom");
  const stationto = url.searchParams.get("stationto");

  if (!stationfrom || !stationto) {
    return new Response(
      JSON.stringify({
        status: 400,
        message: "stationfrom dan stationto wajib diisi",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const data = await krlUpstreamGetJson("fare", {
      stationfrom,
      stationto,
    });
    return jsonOk(data, CC_FARE);
  } catch (e) {
    return responseFromUpstreamError(e);
  }
}
