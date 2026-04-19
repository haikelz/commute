function normalizeToken(raw: string | undefined): string | undefined {
  if (raw === undefined || typeof raw !== "string") return undefined;

  let t = raw.trim();

  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    t = t.slice(1, -1).trim();
  }

  return t.length > 0 ? t : undefined;
}

function fromImportMeta(
  key: "KRL_BEARER_TOKEN" | "KRL_BASE_URL"
): string | undefined {
  const v = import.meta.env[key];
  return normalizeToken(typeof v === "string" ? v : undefined);
}

function fromProcess(
  key: "KRL_BEARER_TOKEN" | "KRL_BASE_URL"
): string | undefined {
  if (typeof process === "undefined" || !process.env) return undefined;
  return normalizeToken(process.env[key]);
}

export function getKrlBearerToken(): string | undefined {
  return fromImportMeta("KRL_BEARER_TOKEN") ?? fromProcess("KRL_BEARER_TOKEN");
}

export function getKrlBaseUrl(): string | undefined {
  return fromImportMeta("KRL_BASE_URL") ?? fromProcess("KRL_BASE_URL");
}
