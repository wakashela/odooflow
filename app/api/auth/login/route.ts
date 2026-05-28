import { NextRequest, NextResponse } from "next/server";
import { getServerBackend } from "@/lib/data/server-backend";

const ODOO_URL = process.env.ODOO_URL!;
const ODOO_DB = process.env.ODOO_DB!;
const BACKEND = process.env.BACKEND || "odoo";

export async function POST(req: NextRequest) {
  const { login, password, db } = await req.json();
  const database = db || ODOO_DB;

  try {
    if (BACKEND === "sqlite") {
      const backend = await getServerBackend();
      const session = await backend.authenticate(login, password);
      const token = (session as unknown as Record<string, unknown>)._token as string;

      const response = NextResponse.json({ session });
      response.cookies.set("odoo_session_id", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      return response;
    }

    const payload = {
      jsonrpc: "2.0",
      method: "call",
      id: Date.now(),
      params: { db: database, login, password },
    };

    const odooRes = await fetch(`${ODOO_URL}/web/session/authenticate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const setCookieHeader = odooRes.headers.get("set-cookie");
    let sessionId = "";

    if (setCookieHeader) {
      const match = setCookieHeader.match(/session_id=([^;]+)/);
      if (match) sessionId = match[1];
    }

    const data = await odooRes.json();

    if (data.error || !data.result?.uid) {
      return NextResponse.json(
        { message: data.error?.data?.message || "Invalid credentials" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ session: data.result });

    if (sessionId) {
      response.cookies.set("odoo_session_id", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;
  } catch (err) {
    return NextResponse.json(
      { message: `Connection failed: ${(err as Error).message}` },
      { status: 502 }
    );
  }
}
