// Worker entry. One deploy serves three things:
//   /mcp, /sse  → the MCP server Claude connects to (Streamable HTTP + legacy SSE)
//   /api/*      → the JSON read API the app polls
//   everything else → the static React app (handled by the assets binding;
//                     run_worker_first in wrangler.toml keeps the routes above
//                     on the Worker, so this fetch only runs for them).

import type { Env } from "./env";
import { handleApi } from "./api/trip";
import { handleWrite } from "./api/write";
import { corsPreflight, jsonError } from "./lib/http";
import { TripMcp } from "./mcp/server";

// The Durable Object class wrangler binds as MCP_OBJECT.
export { TripMcp };

// Built once at module load. serve() handles Streamable HTTP (current);
// serveSSE() keeps the deprecated SSE transport working for older clients.
const mcpHandler = TripMcp.serve("/mcp", { binding: "MCP_OBJECT" });
const sseHandler = TripMcp.serveSSE("/sse", { binding: "MCP_OBJECT" });

// Optional bearer guard for the write/MCP path (spec §10). Off unless the
// MCP_BEARER_TOKEN secret is set. The read API stays public.
function mcpAuthorized(request: Request, env: Env): boolean {
  if (!env.MCP_BEARER_TOKEN) return true;
  const header = request.headers.get("Authorization") || "";
  return header === `Bearer ${env.MCP_BEARER_TOKEN}`;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    if (request.method === "OPTIONS" && pathname.startsWith("/api/")) {
      return corsPreflight();
    }

    if (pathname === "/mcp" || pathname.startsWith("/mcp/")) {
      if (!mcpAuthorized(request, env)) return jsonError("Unauthorized", 401);
      return mcpHandler.fetch(request, env, ctx);
    }

    if (pathname === "/sse" || pathname.startsWith("/sse/")) {
      if (!mcpAuthorized(request, env)) return jsonError("Unauthorized", 401);
      return sseHandler.fetch(request, env, ctx);
    }

    if (pathname.startsWith("/api/")) {
      try {
        // GET (and HEAD) → read API; POST/PATCH/DELETE → write API.
        if (request.method === "GET" || request.method === "HEAD") {
          return await handleApi(url, request, env);
        }
        return await handleWrite(url, request, env);
      } catch (err) {
        return jsonError(err instanceof Error ? err.message : "Internal error", 500);
      }
    }

    // Safety net: if asset routing ever falls through to the Worker, serve the
    // app (and its SPA fallback) from the assets binding.
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
