import { defineMiddleware } from "astro:middleware";
import {
  TJ_AUTH_COOKIE,
  verifyTransjakartaSessionToken,
} from "@/lib/transjakarta-auth";

export const onRequest = defineMiddleware(async (context, next) => {
  const secret = import.meta.env.TRANSJAKARTA_AUTH_SECRET;
  const token = context.cookies.get(TJ_AUTH_COOKIE)?.value;
  context.locals.transjakartaAuthed = await verifyTransjakartaSessionToken(
    token,
    typeof secret === "string" ? secret : undefined
  );

  const path = context.url.pathname;

  if (
    path.startsWith("/api/transjakarta/auth/login") ||
    path.startsWith("/api/transjakarta/auth/logout")
  ) {
    return next();
  }

  if (path.startsWith("/api/transjakarta")) {
    if (!context.locals.transjakartaAuthed) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    return next();
  }

  if (path === "/transjakarta/login" || path.startsWith("/transjakarta/login/")) {
    if (context.locals.transjakartaAuthed) {
      return context.redirect("/transjakarta", 302);
    }
    return next();
  }

  if (path.startsWith("/transjakarta")) {
    if (!context.locals.transjakartaAuthed) {
      const nextUrl = path + context.url.search;
      return context.redirect(
        `/transjakarta/login?next=${encodeURIComponent(nextUrl)}`,
        302
      );
    }
    return next();
  }

  return next();
});
