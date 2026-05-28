import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";

const DB_PATH = process.env.SQLITE_PATH || path.join(process.cwd(), "odooflow.db");

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

export function getNextId(seqName: string): number {
  const stmt = sqlite.prepare(
    "INSERT INTO sequences (name, current_value) VALUES (?, 1) ON CONFLICT(name) DO UPDATE SET current_value = current_value + 1 RETURNING current_value"
  );
  const result = stmt.get(seqName) as { current_value: number };
  return result.current_value;
}

export function generateDocNumber(prefix: string, seqName: string): string {
  const id = getNextId(seqName);
  return `${prefix}${String(id).padStart(4, "0")}`;
}
