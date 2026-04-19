import { jsonOk } from "@/lib/api-json";
import { CC_TRAIN_DETAIL } from "@/lib/cache-control";
import { responseFromUpstreamError } from "@/lib/krl-api-error";
import { krlUpstreamGetJson } from "@/lib/krl-upstream";

export const prerender = false;

export async function GET({ url }: { url: URL }) {
  const trainid = url.searchParams.get("trainid");
  if (!trainid) {
    return new Response(
      JSON.stringify({ status: 400, message: "trainid wajib diisi" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  try {
    const data = await krlUpstreamGetJson("schedules-train", { trainid });
    return jsonOk(data, CC_TRAIN_DETAIL);
  } catch (e) {
    return responseFromUpstreamError(e);
  }
}
