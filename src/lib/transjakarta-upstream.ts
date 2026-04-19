export function withTransjakartaCredentialHint(message: string): string {
  const lower = message.toLowerCase();
  const authish =
    lower.includes("refresh token") ||
    lower.includes("access token") ||
    lower.includes("invalid token") ||
    lower.includes("unauthorized") ||
    lower.includes("token expired") ||
    lower.includes("authentication") ||
    lower.includes("login") ||
    lower.includes("forbidden");

  if (!authish) return message;

  return `${message.trim()} — Perbarui TIJE_AUTHORIZATION (header Authorization lengkap, mis. Bearer …) dan TIJE_DEVICE_ID di environment server; salin ulang dari aplikasi TiJe yang masih login.`;
}

function transjakartaBaseUrl(): string {
  const fromEnv =
    typeof import.meta.env.TIJE_BASE_URL === "string"
      ? import.meta.env.TIJE_BASE_URL.trim()
      : "";
  return fromEnv.replace(/\/$/, "");
}

function transjakartaRequestHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  const auth =
    typeof import.meta.env.TIJE_AUTHORIZATION === "string"
      ? import.meta.env.TIJE_AUTHORIZATION.trim()
      : "";

  if (auth.length > 0) {
    headers.Authorization = auth;
  }

  const deviceId =
    typeof import.meta.env.TIJE_DEVICE_ID === "string"
      ? import.meta.env.TIJE_DEVICE_ID.trim()
      : "";

  if (deviceId.length > 0) {
    headers["x-device-id"] = deviceId;
  }

  return headers;
}

export async function transjakartaUpstreamGetJson(
  path: string,
  searchParams?: Record<string, string>
): Promise<unknown> {
  const relative = path.replace(/^\//, "");
  const url = new URL(relative, transjakartaBaseUrl() + "/");

  if (searchParams) {
    for (const [k, v] of Object.entries(searchParams)) {
      url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url, {
    headers: transjakartaRequestHeaders(),
  });
  const text = await res.text();
  if (!res.ok) {
    return Promise.reject({ status: res.status, body: text });
  }
  if (!text.length) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return Promise.reject({
      status: 502,
      body: "Invalid JSON from Transjakarta API",
    });
  }
}

export async function transjakartaUpstreamPostJson(
  path: string,
  body: unknown
): Promise<unknown> {
  const relative = path.replace(/^\//, "");
  const url = new URL(relative, transjakartaBaseUrl() + "/");
  const headers: Record<string, string> = {
    ...(transjakartaRequestHeaders() as Record<string, string>),
    "Content-Type": "application/json",
  };
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();

  if (!res.ok) {
    return Promise.reject({ status: res.status, body: text });
  }

  if (!text.length) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return Promise.reject({
      status: 502,
      body: "Invalid JSON from Transjakarta API",
    });
  }
}
