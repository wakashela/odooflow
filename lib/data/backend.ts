import type { DataBackend } from "./types";
import { OdooBackend } from "./odoo/backend";

let cached: DataBackend | null = null;

export function getBackend(): DataBackend {
  if (cached) return cached;

  const type = process.env.BACKEND || "odoo";

  if (type === "sqlite") {
    throw new Error("SqliteBackend not yet implemented");
  } else {
    cached = new OdooBackend();
  }

  return cached;
}
