import { NextRequest, NextResponse } from "next/server";
import { renderToStream, Document } from "@react-pdf/renderer";
import { InvoicePDFPage } from "@/components/pdf/InvoicePDF";
import { fetchPdfSettings } from "@/lib/odoo/server-settings";

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

    const [pdfSettings] = await Promise.all([
      fetchPdfSettings(sessionId),
    ]);

    const invoice = invoices[0];
    const partnerId = invoice.partner_id as [number, string];

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

    const lineItems = lines.map((l) => ({
      id: l.id as number,
      description: (l.name as string) || "",
      quantity: (l.quantity as number) || 0,
      unitPrice: (l.price_unit as number) || 0,
      discount: (l.discount as number) || 0,
      subtotal: (l.price_subtotal as number) || 0,
      partNumber: undefined as string | undefined,
    }));

    // Fetch part numbers (default_code) for products in lines
    const productIds = lines.map((l) => {
      const p = l.product_id as [number, string] | false;
      return Array.isArray(p) ? p[0] : undefined;
    }).filter(Boolean) as number[];
    const partNumbers: Record<number, string> = {};
    if (productIds.length > 0) {
      const prods = await odooServerCall<Record<string, unknown>[]>(
        sessionId, "product.product", "search_read",
        [[["id", "in", productIds]]],
        { fields: ["id", "default_code"], limit: productIds.length }
      );
      for (const p of prods) {
        if (p.default_code) partNumbers[p.id as number] = p.default_code as string;
      }
    }
    for (const l of lines) {
      const p = l.product_id as [number, string] | false;
      const pid = Array.isArray(p) ? p[0] : undefined;
      if (pid && partNumbers[pid]) {
        const item = lineItems.find((i) => i.id === (l.id as number));
        if (item) item.partNumber = partNumbers[pid];
      }
    }

    const paymentTermId = invoice.invoice_payment_term_id as [number, string] | false;
    const paymentTerms = paymentTermId ? paymentTermId[1] : undefined;

    const pageProps = {
      documentName: invoice.name as string,
      documentType: "Tax Invoice",
      partnerName: partnerId[1],
      partnerAddress,
      date: new Date(invoice.invoice_date as string).toLocaleDateString("en-GB"),
      dueDate: invoice.invoice_date_due ? new Date(invoice.invoice_date_due as string).toLocaleDateString("en-GB") : undefined,
      lines: lineItems,
      amountUntaxed: invoice.amount_untaxed as number,
      amountTax: invoice.amount_tax as number,
      amountTotal: invoice.amount_total as number,
      origin: invoice.invoice_origin as string | undefined,
      paymentState: invoice.payment_state as string | undefined,
      notes: invoice.narration as string | undefined,
      paymentTerms,
      company: pdfSettings.company,
      banks: pdfSettings.banks,
      pdfColors: pdfSettings.colors,
    };

    const doc = copyParam ? (
      <Document>
        <InvoicePDFPage {...pageProps} copyType={copyParam as "original" | "duplicate"} />
      </Document>
    ) : (
      <Document>
        <InvoicePDFPage {...pageProps} copyType="original" />
        <InvoicePDFPage {...pageProps} copyType="duplicate" />
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
