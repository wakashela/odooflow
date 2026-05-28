import type { DataBackend } from "./types";
import { OdooBackend } from "./odoo/backend";

let cached: DataBackend | null = null;

export function getBackend(): DataBackend {
  if (cached) return cached;
  cached = new OdooBackend();
  return cached;
}
