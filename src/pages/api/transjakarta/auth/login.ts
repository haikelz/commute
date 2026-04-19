import {
  TJ_AUTH_COOKIE,
  createTransjakartaSessionToken,
  transjakartaAuthEnvConfigured,
  transjakartaSessionCookieOptions,
  verifyTransjakartaCredentials,
} from "@/lib/transjakarta-auth";
import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!transjakartaAuthEnvConfigured()) {
    return new Response(
      JSON.stringify({
        error: "Autentikasi TransJakarta belum dikonfigurasi.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Body tidak valid." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!verifyTransjakartaCredentials(email, password)) {
    return new Response(
      JSON.stringify({ error: "Email atau password salah." }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const secret = import.meta.env.TRANSJAKARTA_AUTH_SECRET;
  if (typeof secret !== "string" || secret.length < 16) {
    return new Response(JSON.stringify({ error: "Auth secret tidak valid." }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = await createTransjakartaSessionToken(secret);
  cookies.set(TJ_AUTH_COOKIE, token, transjakartaSessionCookieOptions());

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
