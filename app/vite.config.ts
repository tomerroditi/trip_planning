import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// The app lives in app/ and builds to app/dist, which the Worker serves as
// static assets. In dev, run `npm run dev` (wrangler, port 8787) and
// `npm run dev:app` (vite, port 5173); vite proxies API/MCP calls to wrangler.
export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    port: 5173,
    // Allow importing shared/ types from the repo root.
    fs: { allow: [fileURLToPath(new URL("..", import.meta.url))] },
    proxy: {
      "/api": "http://localhost:8787",
      "/mcp": "http://localhost:8787",
      "/sse": "http://localhost:8787",
    },
  },
});
