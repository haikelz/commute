const textEncoder = new TextEncoder();

function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i];
  return d === 0;
}

function timingSafeEqualAscii(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

function arrayBufferToBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    bin += String.fromCharCode(bytes[i]!);
  }
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmacSha256Base64Url(
  secret: string,
  message: string
): Promise<string> {
  const keyMaterial = textEncoder.encode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    textEncoder.encode(message)
  );
  return arrayBufferToBase64Url(sig);
}

export const TJ_AUTH_COOKIE = "tj_auth";

export function transjakartaAuthEnvConfigured(): boolean {
  const e = import.meta.env.TRANSJAKARTA_AUTH_EMAIL;
  const p = import.meta.env.TRANSJAKARTA_AUTH_PASSWORD;
  const s = import.meta.env.TRANSJAKARTA_AUTH_SECRET;
  return Boolean(
    e &&
      typeof e === "string" &&
      e.length > 0 &&
      p &&
      typeof p === "string" &&
      p.length > 0 &&
      s &&
      typeof s === "string" &&
      s.length >= 16
  );
}

export function verifyTransjakartaCredentials(
  email: string,
  password: string
): boolean {
  if (!transjakartaAuthEnvConfigured()) return false;
  const wantEmail = String(import.meta.env.TRANSJAKARTA_AUTH_EMAIL).trim();
  const wantPassword = String(import.meta.env.TRANSJAKARTA_AUTH_PASSWORD);
  const gotEmail = email.trim().toLowerCase();
  if (gotEmail !== wantEmail.trim().toLowerCase()) return false;
  const a = textEncoder.encode(password);
  const b = textEncoder.encode(wantPassword);
  return timingSafeEqualBytes(a, b);
}

export async function createTransjakartaSessionToken(
  secret: string
): Promise<string> {
  const maxAgeSec = 60 * 60 * 24 * 14;
  const exp = Math.floor(Date.now() / 1000) + maxAgeSec;
  const payload = `v1|${exp}`;
  const sig = await hmacSha256Base64Url(secret, payload);
  return `${payload}|${sig}`;
}

export async function verifyTransjakartaSessionToken(
  token: string | undefined,
  secret: string | undefined
): Promise<boolean> {
  if (!token || !secret || secret.length < 16) return false;
  const parts = token.split("|");
  if (parts.length !== 3 || parts[0] !== "v1") return false;
  const exp = Number.parseInt(parts[1] ?? "", 10);
  if (!Number.isFinite(exp)) return false;
  if (exp < Math.floor(Date.now() / 1000)) return false;
  const payload = `v1|${exp}`;
  const wantSig = parts[2] ?? "";
  const gotSig = await hmacSha256Base64Url(secret, payload);
  return timingSafeEqualAscii(wantSig, gotSig);
}

export function transjakartaSessionCookieOptions(): {
  path: string;
  httpOnly: boolean;
  sameSite: "lax";
  secure: boolean;
  maxAge: number;
} {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: import.meta.env.PROD,
    maxAge: 60 * 60 * 24 * 14,
  };
}
