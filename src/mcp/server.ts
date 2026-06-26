// The McpAgent that Claude connects to. McpAgent runs as a Durable Object and
// exposes the trip-planning tools over Streamable HTTP. Data lives in D1
// (this.env.DB), not the agent's own storage — D1 is the shared source of
// truth the read API also serves.

import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Env } from "../env";
import { defaultTripId } from "../env";
import { ensureSeed } from "../db/queries";
import { registerTools } from "./tools";

export class TripMcp extends McpAgent<Env> {
  server = new McpServer({
    name: "trip-planner",
    version: "1.0.0",
  });

  async init(): Promise<void> {
    // Make sure the bundled trip exists so get_trip has something to return.
    try {
      await ensureSeed(this.env.DB, defaultTripId(this.env));
    } catch {
      // Seeding is best-effort here; the read API also seeds on first load.
    }

    registerTools(this.server, {
      db: () => this.env.DB,
      defaultTripId: () => defaultTripId(this.env),
    });
  }
}
