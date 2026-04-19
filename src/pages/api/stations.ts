import { jsonOk } from "@/lib/api-json";
import { CC_STATIONS } from "@/lib/cache-control";
import { responseFromUpstreamError } from "@/lib/krl-api-error";
import { krlUpstreamGetJson } from "@/lib/krl-upstream";

export const prerender = false;

export async function GET() {
  try {
    const data = await krlUpstreamGetJson("krl-station");
    return jsonOk(data, CC_STATIONS);
  } catch (e) {
    return responseFromUpstreamError(e);
  }
}
