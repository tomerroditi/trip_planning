// A minimal D1Database adapter over better-sqlite3 — just enough of the D1 API
// for queries.ts to run against real SQLite in tests (prepare/bind/all/first/
// run/batch/exec). Lets the data-layer tests exercise the actual schema, seed
// and queries without a Cloudflare runtime.

import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

type Params = unknown[];

class FakeStmt {
  constructor(
    private db: Database.Database,
    private sql: string,
    private params: Params = [],
  ) {}

  bind(...args: Params): FakeStmt {
    return new FakeStmt(this.db, this.sql, args);
  }

  async all<T = unknown>(): Promise<{ results: T[]; success: boolean; meta: object }> {
    const results = this.db.prepare(this.sql).all(...(this.params as never[])) as T[];
    return { results, success: true, meta: {} };
  }

  async first<T = unknown>(): Promise<T | null> {
    const row = this.db.prepare(this.sql).get(...(this.params as never[]));
    return (row ?? null) as T | null;
  }

  async run(): Promise<{ success: boolean; meta: object }> {
    const info = this.db.prepare(this.sql).run(...(this.params as never[]));
    return { success: true, meta: { changes: info.changes, last_row_id: info.lastInsertRowid } };
  }

  runSync(): void {
    this.db.prepare(this.sql).run(...(this.params as never[]));
  }
}

export class FakeD1 {
  constructor(public db: Database.Database) {}

  prepare(sql: string): FakeStmt {
    return new FakeStmt(this.db, sql);
  }

  async batch(stmts: FakeStmt[]): Promise<{ success: boolean; meta: object }[]> {
    const tx = this.db.transaction(() => {
      for (const s of stmts) s.runSync();
    });
    tx();
    return stmts.map(() => ({ success: true, meta: {} }));
  }

  async exec(sql: string): Promise<{ count: number; duration: number }> {
    this.db.exec(sql);
    return { count: 0, duration: 0 };
  }
}

// Fresh in-memory DB with the schema applied (foreign_keys off, matching D1's
// default). Optionally also loads the generated seed.sql.
export function makeDb(opts: { withSeedSql?: boolean } = {}): Database.Database {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = OFF");
  db.exec(readFileSync(resolve(root, "migrations/0001_init.sql"), "utf8"));
  if (opts.withSeedSql) db.exec(readFileSync(resolve(root, "seed/seed.sql"), "utf8"));
  return db;
}

export function makeD1(opts: { withSeedSql?: boolean } = {}): FakeD1 {
  return new FakeD1(makeDb(opts));
}
