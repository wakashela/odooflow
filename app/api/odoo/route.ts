import { NextRequest, NextResponse } from "next/server";
import { getBackend } from "@/lib/data/backend";

const ODOO_URL = process.env.ODOO_URL!;
const ODOO_DB = process.env.ODOO_DB!;
const BACKEND = process.env.BACKEND || "odoo";

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (BACKEND === "sqlite") {
    try {
      const backend = getBackend();
      const result = await backend.call(body.model, body.method, body.args, body.kwargs || {});
      return NextResponse.json({ result });
    } catch (err) {
      return NextResponse.json(
        { error: { message: (err as Error).message, code: 500 } },
        { status: 500 }
      );
    }
  }

  const sessionId = req.cookies.get("odoo_session_id")?.value;

  if (!sessionId) {
    return NextResponse.json(
      { error: { message: "Not authenticated", code: 401 } },
      { status: 401 }
    );
  }

  const { context: rpcContext, ...restBody } = body;
  const rpcPayload = {
    jsonrpc: "2.0",
    method: "call",
    id: Date.now(),
    params: {
      ...restBody,
      ...(rpcContext ? { context: rpcContext } : {}),
      db: ODOO_DB,
    },
  };

  try {
    const odooRes = await fetch(`${ODOO_URL}/web/dataset/call_kw`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `session_id=${sessionId}`,
      },
      body: JSON.stringify(rpcPayload),
    });

    if (odooRes.status === 401 || odooRes.status === 403) {
      return NextResponse.json(
        { error: { message: "Session expired", code: 401 } },
        { status: 401 }
      );
    }

    const result = await odooRes.json();

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 200 });
    }

    return NextResponse.json({ result: result.result });
  } catch (err) {
    return NextResponse.json(
      { error: { message: `Odoo connection failed: ${(err as Error).message}` } },
      { status: 502 }
    );
  }
}
