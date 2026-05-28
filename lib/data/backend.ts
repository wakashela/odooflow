import type { DataBackend } from "./types";
import { OdooBackend } from "./odoo/backend";

let cached: DataBackend | null = null;

export function getBackend(): DataBackend {
  if (cached) return cached;

  const type = process.env.BACKEND || "odoo";

  if (type === "sqlite") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { SqliteBackend } = require("./sqlite/backend");
    cached = new SqliteBackend();
  } else {
    cached = new OdooBackend();
  }

  return cached!;
}
