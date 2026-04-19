import { getKrlBaseUrl, getKrlBearerToken } from "./krl-token";

export async function krlUpstreamGetJson(
  path: string,
  searchParams?: Record<string, string>
): Promise<unknown> {
  const base = getKrlBaseUrl();

  if (!base) {
    return Promise.reject({
      status: 503,
      body: "KRL_BASE_URL is not set. Configure it in Cloudflare Workers vars/secrets or your host environment.",
    });
  }

  const relative = path.replace(/^\//, "");
  const url = new URL(relative, base.replace(/\/$/, "") + "/");

  if (searchParams) {
    for (const [k, v] of Object.entries(searchParams)) {
      url.searchParams.set(k, v);
    }
  }

  const token = getKrlBearerToken();
  const headers = new Headers({ Accept: "application/json" });

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, { headers });
  const text = await res.text();

  if (!res.ok) {
    return Promise.reject({ status: res.status, body: text });
  }
  if (!text.length) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return Promise.reject({ status: 502, body: "Invalid JSON from upstream" });
  }
}
