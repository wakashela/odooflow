import { odooCall } from "./client";
import type { OdooSessionInfo } from "@/types/odoo";

export async function login(
  db: string,
  login: string,
  password: string
): Promise<OdooSessionInfo> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ db, login, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Login failed" }));
    throw new Error(err.message || "Authentication failed");
  }

  const data = await res.json();
  return data.session as OdooSessionInfo;
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

export async function checkSession(): Promise<OdooSessionInfo | null> {
  try {
    const res = await fetch("/api/auth/session");
    if (!res.ok) return null;
    const data = await res.json();
    return data.session as OdooSessionInfo;
  } catch {
    return null;
  }
}
