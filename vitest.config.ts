import { defineConfig } from "vitest/config";

// Node-environment tests. The data-layer tests run the real queries.ts and the
// generated SQL against an in-memory SQLite (better-sqlite3) via a tiny D1
// adapter, so they exercise the actual schema, seed and queries end-to-end.
export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
});
