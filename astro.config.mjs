// @ts-check
import node from "@astrojs/node";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import AstroPWA from "@vite-pwa/astro";
import compressor from "astro-compressor";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL ?? "https://transit.ekel.dev",
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [
    react(),
    AstroPWA({
      registerType: "autoUpdate",
      manifest: {
        name: "transit.ekel.dev",
        short_name: "transit",
        description:
          "A Web Application to show transitr Line and Transjakarta schedule",
        theme_color: "#09090b",
        background_color: "#09090b",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        lang: "id",
        icons: [
          {
            src: "/favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
      workbox: {
        navigateFallback: "/",
        navigateFallbackDenylist: [/^\/api/],
      },
    }),
    sitemap({
      changefreq: "weekly",
      priority: 1,
    }),
    compressor({
      gzip: true,
      brotli: true,
    }),
  ],
  server: {
    port: 3000,
    host: true,
  },
  devToolbar: {
    enabled: false,
  },
  compressHTML: true,
  vite: {
    plugins: [tailwindcss()],
  },
});
