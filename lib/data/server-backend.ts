import type { DataBackend } from "./types";

let cachedPromise: Promise<DataBackend> | null = null;

export function getServerBackend(): Promise<DataBackend> {
  if (cachedPromise) return cachedPromise;

  const type = process.env.BACKEND || "odoo";

  if (type === "sqlite") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { SqliteBackend } = require("./sqlite/backend");
    cachedPromise = Promise.resolve(new SqliteBackend());
  } else {
    const { OdooBackend } = require("./odoo/backend");
    cachedPromise = Promise.resolve(new OdooBackend());
  }

  return cachedPromise;
}
