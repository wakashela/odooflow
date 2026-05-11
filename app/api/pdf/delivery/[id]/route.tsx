import { NextRequest, NextResponse } from "next/server";
import { renderToStream, Document } from "@react-pdf/renderer";
import { DeliveryNotePDFPage } from "@/components/pdf/DeliveryNotePDF";
import { fetchPdfSettings } from "@/lib/odoo/server-settings";

const ODOO_URL = process.env.ODOO_URL!;

async function odooServerCall<T>(
  sessionId: string,
  model: string,
  method: string,
  args: unknown[] = [],
  kwargs: Record<string, unknown> = {}
): Promise<T> {
  const payload = {
    jsonrpc: "2.0",
    method: "call",
    id: Date.now(),
    params: { model, method, args, kwargs },
  };

  const res = await fetch(`${ODOO_URL}/web/dataset/call_kw`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `session_id=${sessionId}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.data?.message || data.error.message);
  return data.result as T;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessionId = req.cookies.get("odoo_session_id")?.value;

  if (!sessionId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const pickingId = Number(id);
    const copyParam = req.nextUrl.searchParams.get("copy") as "original" | "duplicate" | null;

    const [pickings, moves] = await Promise.all([
      odooServerCall<Record<string, unknown>[]>(
        sessionId,
        "stock.picking",
        "search_read",
        [[["id", "=", pickingId]]],
        {
          fields: ["name", "partner_id", "scheduled_date", "date_done", "origin", "picking_type_id"],
          limit: 1,
        }
      ),
      odooServerCall<Record<string, unknown>[]>(
        sessionId,
        "stock.move",
        "search_read",
        [[["picking_id", "=", pickingId]]],
        {
          fields: ["id", "product_id", "name", "product_uom_qty", "quantity", "product_uom"],
          order: "id",
        }
      ),
    ]);

    if (!pickings.length) {
      return NextResponse.json({ error: "Delivery not found" }, { status: 404 });
    }

    const [pdfSettings] = await Promise.all([
      fetchPdfSettings(sessionId),
    ]);

    const picking = pickings[0];
    const partnerId = picking.partner_id as [number, string];

    // Fetch partner address
    const partners = await odooServerCall<Record<string, unknown>[]>(
      sessionId,
      "res.partner",
      "search_read",
      [[["id", "=", partnerId[0]]]],
      { fields: ["street", "street2", "city", "state_id", "zip", "country_id"], limit: 1 }
    );
    const partner = partners[0];
    const stateId = partner?.state_id as [number, string] | false;
    const countryId = partner?.country_id as [number, string] | false;
    const partnerAddress = partner
      ? [
          partner.street,
          partner.street2,
          partner.city,
          stateId ? stateId[1] : undefined,
          partner.zip,
          countryId ? countryId[1] : undefined,
        ].filter(Boolean).join(", ")
      : undefined;

    const deliveryMoves = moves.map((m) => ({
      id: m.id as number,
      productName: (m.product_id as [number, string])?.[1] || (m.name as string) || "",
      demand: (m.product_uom_qty as number) || 0,
      done: (m.quantity as number) || 0,
      uom: (m.product_uom as [number, string])?.[1] || "-",
    }));

    const copyType = copyParam === "original" || copyParam === "duplicate" ? copyParam : undefined;

    const pageProps = {
      documentName: picking.name as string,
      partnerName: partnerId[1],
      partnerAddress,
      scheduledDate: new Date(picking.scheduled_date as string).toLocaleDateString("en-GB"),
      dateDone: picking.date_done ? new Date(picking.date_done as string).toLocaleDateString("en-GB") : undefined,
      origin: picking.origin as string | undefined,
      moves: deliveryMoves,
      company: pdfSettings.company,
      pdfColors: pdfSettings.colors,
    };

    const doc = copyType ? (
      <Document>
        <DeliveryNotePDFPage {...pageProps} copyType={copyType} />
      </Document>
    ) : (
      <Document>
        <DeliveryNotePDFPage {...pageProps} copyType="original" />
        <DeliveryNotePDFPage {...pageProps} copyType="duplicate" />
      </Document>
    );

    const stream = await renderToStream(doc);
    const chunks: Buffer[] = [];
    for await (const chunk of stream as AsyncIterable<Buffer>) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${picking.name}.pdf"`,
      },
    });
  } catch (err) {
    console.error("Delivery PDF generation failed:", err);
    return NextResponse.json(
      { error: `PDF generation failed: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
