import type { AccountMove, AccountMoveLine } from "@/types/odoo";
import type { DataBackend } from "../types";
import { db, generateDocNumber } from "./db";
import {
  accountMoves,
  accountMoveLines,
  saleOrders,
  saleOrderLines,
  partners,
  products,
} from "./schema";
import { eq, desc } from "drizzle-orm";

export const sqliteInvoice: Pick<
  DataBackend,
  | "fetchInvoices"
  | "fetchInvoiceById"
  | "fetchInvoiceLines"
  | "postInvoice"
  | "createInvoicesFromSaleOrder"
> = {
  async fetchInvoices(limit = 50, offset = 0) {
    const rows = await db
      .select({
        id: accountMoves.id,
        name: accountMoves.name,
        moveType: accountMoves.moveType,
        state: accountMoves.state,
        partnerId: accountMoves.partnerId,
        partnerName: partners.name,
        invoiceDate: accountMoves.invoiceDate,
        invoiceDateDue: accountMoves.invoiceDateDue,
        amountUntaxed: accountMoves.amountUntaxed,
        amountTax: accountMoves.amountTax,
        amountTotal: accountMoves.amountTotal,
        paymentState: accountMoves.paymentState,
        narration: accountMoves.narration,
        invoiceOrigin: accountMoves.invoiceOrigin,
        invoicePaymentTermId: accountMoves.invoicePaymentTermId,
      })
      .from(accountMoves)
      .leftJoin(partners, eq(accountMoves.partnerId, partners.id))
      .where(eq(accountMoves.moveType, "out_invoice"))
      .orderBy(desc(accountMoves.id))
      .limit(limit)
      .offset(offset)
      .all();

    return rows.map((r) => toAccountMove(r));
  },

  async fetchInvoiceById(id: number) {
    const rows = await db
      .select({
        id: accountMoves.id,
        name: accountMoves.name,
        moveType: accountMoves.moveType,
        state: accountMoves.state,
        partnerId: accountMoves.partnerId,
        partnerName: partners.name,
        invoiceDate: accountMoves.invoiceDate,
        invoiceDateDue: accountMoves.invoiceDateDue,
        amountUntaxed: accountMoves.amountUntaxed,
        amountTax: accountMoves.amountTax,
        amountTotal: accountMoves.amountTotal,
        paymentState: accountMoves.paymentState,
        narration: accountMoves.narration,
        invoiceOrigin: accountMoves.invoiceOrigin,
        invoicePaymentTermId: accountMoves.invoicePaymentTermId,
      })
      .from(accountMoves)
      .leftJoin(partners, eq(accountMoves.partnerId, partners.id))
      .where(eq(accountMoves.id, id))
      .limit(1)
      .all();
    if (!rows.length) throw new Error("Invoice not found");
    return toAccountMove(rows[0]);
  },

  async fetchInvoiceLines(invoiceId: number) {
    const rows = await db
      .select({
        id: accountMoveLines.id,
        moveId: accountMoveLines.moveId,
        productId: accountMoveLines.productId,
        productName: products.name,
        name: accountMoveLines.name,
        quantity: accountMoveLines.quantity,
        priceUnit: accountMoveLines.priceUnit,
        priceSubtotal: accountMoveLines.priceSubtotal,
        discount: accountMoveLines.discount,
        xDeliveryTime: accountMoveLines.xDeliveryTime,
      })
      .from(accountMoveLines)
      .leftJoin(products, eq(accountMoveLines.productId, products.id))
      .where(eq(accountMoveLines.moveId, invoiceId))
      .orderBy(accountMoveLines.id)
      .all();

    return rows.map((r) => ({
      id: r.id,
      move_id: [r.moveId ?? 0, ""],
      product_id: r.productId
        ? [r.productId, r.productName || ""]
        : [0, r.name || ""],
      name: r.name || "",
      quantity: r.quantity ?? 0,
      price_unit: r.priceUnit ?? 0,
      price_subtotal: r.priceSubtotal ?? 0,
      discount: r.discount ?? 0,
      tax_ids: [],
      x_delivery_time: r.xDeliveryTime || "",
    }));
  },

  async postInvoice(id: number) {
    await db
      .update(accountMoves)
      .set({ state: "posted" })
      .where(eq(accountMoves.id, id));
    return true;
  },

  async createInvoicesFromSaleOrder(orderId: number) {
    const soRows = await db
      .select({
        id: saleOrders.id,
        name: saleOrders.name,
        partnerId: saleOrders.partnerId,
      })
      .from(saleOrders)
      .where(eq(saleOrders.id, orderId))
      .limit(1)
      .all();

    if (!soRows.length) throw new Error("Sale order not found");

    const so = soRows[0];
    const invoiceName = generateDocNumber("INV", "account_move");

    const [inv] = await db
      .insert(accountMoves)
      .values({
        name: invoiceName,
        moveType: "out_invoice",
        state: "draft",
        partnerId: so.partnerId,
        invoiceDate: new Date().toISOString().slice(0, 10),
        invoiceOrigin: so.name,
      })
      .returning({ id: accountMoves.id });

    const lines = await db
      .select()
      .from(saleOrderLines)
      .where(eq(saleOrderLines.orderId, orderId))
      .all();

    for (const line of lines) {
      await db.insert(accountMoveLines).values({
        moveId: inv.id,
        productId: line.productId,
        name: line.name,
        quantity: line.productUomQty,
        priceUnit: line.priceUnit,
        discount: line.discount,
        priceSubtotal: line.priceSubtotal,
        xDeliveryTime: line.xDeliveryTime,
      });
    }

    await recalculateInvoiceTotals(inv.id);
    return [inv.id];
  },
};

function toAccountMove(row: {
  id: number;
  name: string;
  moveType: string | null;
  state: string | null;
  partnerId: number | null;
  partnerName: string | null;
  invoiceDate: string | null;
  invoiceDateDue: string | null;
  amountUntaxed: number | null;
  amountTax: number | null;
  amountTotal: number | null;
  paymentState: string | null;
  narration: string | null;
  invoiceOrigin: string | null;
  invoicePaymentTermId: number | null;
}): AccountMove {
  return {
    id: row.id,
    name: row.name,
    move_type: (row.moveType || "out_invoice") as AccountMove["move_type"],
    state: (row.state || "draft") as AccountMove["state"],
    partner_id: [row.partnerId || 0, row.partnerName || ""],
    invoice_date: row.invoiceDate || "",
    invoice_date_due: row.invoiceDateDue || "",
    invoice_line_ids: [],
    amount_untaxed: row.amountUntaxed || 0,
    amount_tax: row.amountTax || 0,
    amount_total: row.amountTotal || 0,
    payment_state: (row.paymentState ||
      "not_paid") as AccountMove["payment_state"],
    narration: row.narration || "",
    invoice_origin: row.invoiceOrigin || "",
    invoice_payment_term_id: false,
  };
}

async function recalculateInvoiceTotals(invoiceId: number): Promise<void> {
  const lines = await db
    .select({
      qty: accountMoveLines.quantity,
      price: accountMoveLines.priceUnit,
      discount: accountMoveLines.discount,
    })
    .from(accountMoveLines)
    .where(eq(accountMoveLines.moveId, invoiceId))
    .all();

  const amountUntaxed = lines.reduce(
    (sum, l) =>
      sum +
      (l.qty ?? 0) * (l.price ?? 0) * (1 - (l.discount ?? 0) / 100),
    0
  );
  await db
    .update(accountMoves)
    .set({ amountUntaxed, amountTax: 0, amountTotal: amountUntaxed })
    .where(eq(accountMoves.id, invoiceId));
}
