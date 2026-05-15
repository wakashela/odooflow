import { odooCall } from "./client";
import type { AccountMove, AccountMoveLine } from "@/types/odoo";

const INVOICE_FIELDS = [
  "id", "name", "move_type", "state", "partner_id",
  "invoice_date", "invoice_date_due", "invoice_line_ids",
  "amount_untaxed", "amount_tax", "amount_total", "payment_state",
  "narration", "invoice_origin",
  "invoice_payment_term_id",
];

const LINE_FIELDS = [
  "id", "move_id", "product_id", "name", "quantity",
  "price_unit", "price_subtotal", "discount", "tax_ids", "x_delivery_time",
];

export async function fetchInvoices(limit = 50, offset = 0): Promise<AccountMove[]> {
  return odooCall<AccountMove[]>("account.move", "search_read", [[["move_type", "=", "out_invoice"]]], {
    fields: INVOICE_FIELDS,
    limit,
    offset,
    order: "id desc",
  });
}

export async function fetchInvoiceById(id: number): Promise<AccountMove> {
  const results = await odooCall<AccountMove[]>("account.move", "search_read", [[["id", "=", id]]], {
    fields: INVOICE_FIELDS,
    limit: 1,
  });
  if (!results.length) throw new Error("Invoice not found");
  return results[0];
}

export async function fetchInvoiceLines(invoiceId: number): Promise<AccountMoveLine[]> {
  return odooCall<AccountMoveLine[]>("account.move.line", "search_read", [[["move_id", "=", invoiceId], ["display_type", "=", "product"]]], {
    fields: LINE_FIELDS,
    order: "id",
  });
}

export async function postInvoice(id: number): Promise<boolean> {
  return odooCall<boolean>("account.move", "action_post", [[id]]);
}

export async function createInvoicesFromSaleOrder(orderId: number): Promise<number[]> {
  const wizId = await odooCall<number>("sale.advance.payment.inv", "create", [{
    advance_payment_method: "delivered",
    sale_order_ids: [[6, 0, [orderId]]],
  }], {}, {
    active_ids: [orderId],
    active_model: "sale.order",
  });
  await odooCall<unknown>("sale.advance.payment.inv", "create_invoices", [[wizId]], {}, {
    active_ids: [orderId],
    active_model: "sale.order",
  });
  const invoices = await odooCall<Record<string, unknown>[]>("sale.order", "read", [[orderId]], {
    fields: ["invoice_ids"],
  });
  const invoiceIds = (invoices[0]?.invoice_ids as number[] | undefined) || [];
  if (!invoiceIds.length) {
    throw new Error("No invoices were created");
  }

  // Copy x_delivery_time from sale order lines to invoice lines
  const soLines = await odooCall<Record<string, unknown>[]>(
    "sale.order.line", "search_read",
    [[["order_id", "=", orderId]]],
    { fields: ["id", "x_delivery_time", "product_id"] }
  );

  for (const invId of invoiceIds) {
    const invLines = await odooCall<Record<string, unknown>[]>(
      "account.move.line", "search_read",
      [[["move_id", "=", invId]]],
      { fields: ["id", "product_id", "sale_line_ids"] }
    );

    for (const soLine of soLines) {
      const dt = soLine.x_delivery_time as string | undefined;
      if (!dt) continue;
      const soProductId = (soLine.product_id as [number, string])?.[0];

      // Match invoice line by sale_line_ids or by product
      const invLine = invLines.find((il) => {
        const saleLinks = il.sale_line_ids as [number, string][] | undefined;
        if (saleLinks?.some(([sid]) => sid === soLine.id)) return true;
        if (soProductId) {
          const ilProductId = (il.product_id as [number, string])?.[0];
          if (ilProductId === soProductId) return true;
        }
        return false;
      });

      if (invLine) {
        await odooCall<boolean>("account.move.line", "write", [
          [invLine.id as number],
          { x_delivery_time: dt },
        ]);
      }
    }
  }

  return invoiceIds;
}
