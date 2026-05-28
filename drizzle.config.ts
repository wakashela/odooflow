import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/data/sqlite/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: "./odooflow.db",
  },
});
