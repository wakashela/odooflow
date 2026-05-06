import { NextRequest, NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import { InvoicePDF } from "@/components/pdf/InvoicePDF";

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
    const invoiceId = Number(id);
    const copyParam = req.nextUrl.searchParams.get("copy") as "original" | "duplicate" | null;

    const [invoices, lines] = await Promise.all([
      odooServerCall<Record<string, unknown>[]>(
        sessionId,
        "account.move",
        "search_read",
        [[["id", "=", invoiceId]]],
        {
          fields: [
            "name", "partner_id", "invoice_date", "invoice_date_due",
            "amount_untaxed", "amount_tax", "amount_total", "payment_state",
            "narration", "invoice_origin", "invoice_payment_term_id",
          ],
          limit: 1,
        }
      ),
      odooServerCall<Record<string, unknown>[]>(
        sessionId,
        "account.move.line",
        "search_read",
        [[["move_id", "=", invoiceId], ["display_type", "=", "product"]]],
        {
          fields: ["id", "product_id", "name", "quantity", "price_unit", "price_subtotal", "discount"],
          order: "id",
        }
      ),
    ]);

    if (!invoices.length) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const invoice = invoices[0];
    const partnerId = invoice.partner_id as [number, string];

    const lineItems = lines.map((l) => ({
      id: l.id as number,
      description: (l.name as string) || "",
      quantity: (l.quantity as number) || 0,
      unitPrice: (l.price_unit as number) || 0,
      discount: (l.discount as number) || 0,
      subtotal: (l.price_subtotal as number) || 0,
    }));

    const paymentTermId = invoice.invoice_payment_term_id as [number, string] | false;
    const paymentTerms = paymentTermId ? paymentTermId[1] : undefined;
    const copyType = copyParam === "original" || copyParam === "duplicate" ? copyParam : undefined;

    const doc = (
      <InvoicePDF
        documentName={invoice.name as string}
        documentType="Tax Invoice"
        partnerName={partnerId[1]}
        date={new Date(invoice.invoice_date as string).toLocaleDateString("en-GB")}
        dueDate={invoice.invoice_date_due ? new Date(invoice.invoice_date_due as string).toLocaleDateString("en-GB") : undefined}
        lines={lineItems}
        amountUntaxed={invoice.amount_untaxed as number}
        amountTax={invoice.amount_tax as number}
        amountTotal={invoice.amount_total as number}
        origin={invoice.invoice_origin as string | undefined}
        paymentState={invoice.payment_state as string | undefined}
        notes={invoice.narration as string | undefined}
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
        "Content-Disposition": `inline; filename="${invoice.name}.pdf"`,
      },
    });
  } catch (err) {
    console.error("Invoice PDF generation failed:", err);
    return NextResponse.json(
      { error: `PDF generation failed: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
