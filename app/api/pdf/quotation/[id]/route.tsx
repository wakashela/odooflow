import { NextRequest, NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import { QuotationPDF } from "@/components/pdf/QuotationPDF";

const ODOO_URL = process.env.ODOO_URL!;
const ODOO_DB = process.env.ODOO_DB!;

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
    const orderId = Number(id);
    const copyParam = req.nextUrl.searchParams.get("copy") as "original" | "duplicate" | null;

    const [orders, lines] = await Promise.all([
      odooServerCall<Record<string, unknown>[]>(
        sessionId,
        "sale.order",
        "search_read",
        [[["id", "=", orderId]]],
        {
          fields: [
            "name", "partner_id", "date_order", "validity_date",
            "amount_untaxed", "amount_tax", "amount_total", "note",
            "payment_term_id",
          ],
          limit: 1,
        }
      ),
      odooServerCall<Record<string, unknown>[]>(
        sessionId,
        "sale.order.line",
        "search_read",
        [[["order_id", "=", orderId]]],
        {
          fields: ["id", "product_id", "name", "product_uom_qty", "price_unit", "price_subtotal", "discount"],
          order: "id",
        }
      ),
    ]);

    if (!orders.length) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    const order = orders[0];
    const partnerId = order.partner_id as [number, string];

    const lineItems = lines.map((l) => ({
      id: l.id as number,
      description: (l.name as string) || "",
      quantity: (l.product_uom_qty as number) || 0,
      unitPrice: (l.price_unit as number) || 0,
      discount: (l.discount as number) || 0,
      subtotal: (l.price_subtotal as number) || 0,
    }));

    const paymentTermId = order.payment_term_id as [number, string] | false;
    const paymentTerms = paymentTermId ? paymentTermId[1] : undefined;
    const copyType = copyParam === "original" || copyParam === "duplicate" ? copyParam : undefined;

    const doc = (
      <QuotationPDF
        documentName={order.name as string}
        documentType="Quotation"
        partnerName={partnerId[1]}
        date={new Date(order.date_order as string).toLocaleDateString("en-GB")}
        expiryDate={order.validity_date ? new Date(order.validity_date as string).toLocaleDateString("en-GB") : undefined}
        lines={lineItems}
        amountUntaxed={order.amount_untaxed as number}
        amountTax={order.amount_tax as number}
        amountTotal={order.amount_total as number}
        notes={order.note as string | undefined}
        paymentTerms={paymentTerms}
        copyType={copyType}
      />
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
        "Content-Disposition": `inline; filename="${order.name}.pdf"`,
      },
    });
  } catch (err) {
    console.error("PDF generation failed:", err);
    return NextResponse.json(
      { error: `PDF generation failed: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
