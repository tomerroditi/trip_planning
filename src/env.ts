// Worker bindings (wrangler.toml). Generated types from `wrangler types` would
// also work, but an explicit interface keeps the contract visible.
export interface Env {
  // D1 — the shared source of truth.
  DB: D1Database;
  // Static assets (the built React app in app/dist).
  ASSETS: Fetcher;
  // Durable Object backing the McpAgent.
  MCP_OBJECT: DurableObjectNamespace;
  // The trip the app/read API default to when none is specified.
  DEFAULT_TRIP_ID: string;
  // Optional bearer token guarding the MCP/write path (set via `wrangler secret put`).
  MCP_BEARER_TOKEN?: string;
}

export const DEFAULT_TRIP_FALLBACK = "nz-south-island";

export function defaultTripId(env: Env): string {
  return env.DEFAULT_TRIP_ID || DEFAULT_TRIP_FALLBACK;
}
