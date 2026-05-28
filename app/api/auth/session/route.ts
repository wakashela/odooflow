import { NextRequest, NextResponse } from "next/server";
import { getServerBackend } from "@/lib/data/server-backend";

const ODOO_URL = process.env.ODOO_URL!;
const ODOO_DB = process.env.ODOO_DB!;
const BACKEND = process.env.BACKEND || "odoo";

export async function GET(req: NextRequest) {
  const sessionId = req.cookies.get("odoo_session_id")?.value;

  if (!sessionId) {
    return NextResponse.json({ session: null }, { status: 401 });
  }

  try {
    if (BACKEND === "sqlite") {
      const backend = await getServerBackend();
      const session = await backend.getSessionInfo(sessionId);
      if (!session) {
        return NextResponse.json({ session: null }, { status: 401 });
      }
      return NextResponse.json({ session });
    }

    const payload = {
      jsonrpc: "2.0",
      method: "call",
      id: Date.now(),
      params: { db: ODOO_DB, login: "", password: "" },
    };

    const odooRes = await fetch(`${ODOO_URL}/web/session/get_session_info`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `session_id=${sessionId}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await odooRes.json();

    if (data.error || !data.result?.uid) {
      return NextResponse.json({ session: null }, { status: 401 });
    }

    return NextResponse.json({ session: data.result });
  } catch {
    return NextResponse.json({ session: null }, { status: 502 });
  }
}
