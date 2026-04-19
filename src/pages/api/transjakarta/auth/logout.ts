import { TJ_AUTH_COOKIE } from "@/lib/transjakarta-auth";
import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
  cookies.set(TJ_AUTH_COOKIE, "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: import.meta.env.PROD,
    maxAge: 0,
  });
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
