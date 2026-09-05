import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Served from https://<user>.github.io/field-activity-logger/ in production,
// so the build needs that base path; local dev/test stays at root.
const BASE = "/field-activity-logger/";

export default defineConfig(({ command }) => ({
  base: command === "build" ? BASE : "/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg", "favicon.svg"],
      manifest: {
        name: "Field Activity Logger",
        short_name: "Field Log",
        description:
          "Fast offline logging of merchant POS deployments, visits and support tasks.",
        theme_color: "#0f766e",
        background_color: "#0f172a",
        display: "standalone",
        orientation: "portrait",
        icons: [
          {
            src: "icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,woff2}"],
      },
    }),
  ],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
}));
