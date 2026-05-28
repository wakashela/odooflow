import type { PurchaseOrder, PurchaseOrderLine } from "@/types/odoo";
import type { DataBackend } from "../types";
import { db, generateDocNumber } from "./db";
import {
  purchaseOrders,
  purchaseOrderLines,
  saleOrders,
  saleOrderLines,
  partners,
  products,
} from "./schema";
import { eq, desc } from "drizzle-orm";

export const sqlitePurchase: Pick<
  DataBackend,
  | "fetchPurchaseOrders"
  | "fetchPurchaseOrderById"
  | "fetchPurchaseOrderLines"
  | "confirmPurchaseOrder"
  | "fetchPurchaseOrdersByOrigin"
  | "createPurchaseOrderFromSaleOrder"
> = {
  async fetchPurchaseOrders(limit = 50, offset = 0) {
    const rows = await db
      .select({
        id: purchaseOrders.id,
        name: purchaseOrders.name,
        state: purchaseOrders.state,
        partnerId: purchaseOrders.partnerId,
        partnerName: partners.name,
        dateOrder: purchaseOrders.dateOrder,
        datePlanned: purchaseOrders.datePlanned,
        amountUntaxed: purchaseOrders.amountUntaxed,
        amountTax: purchaseOrders.amountTax,
        amountTotal: purchaseOrders.amountTotal,
        notes: purchaseOrders.notes,
        origin: purchaseOrders.origin,
      })
      .from(purchaseOrders)
      .leftJoin(partners, eq(purchaseOrders.partnerId, partners.id))
      .orderBy(desc(purchaseOrders.id))
      .limit(limit)
      .offset(offset)
      .all();

    return rows.map((r) => toPurchaseOrder(r));
  },

  async fetchPurchaseOrderById(id: number) {
    const rows = await db
      .select({
        id: purchaseOrders.id,
        name: purchaseOrders.name,
        state: purchaseOrders.state,
        partnerId: purchaseOrders.partnerId,
        partnerName: partners.name,
        dateOrder: purchaseOrders.dateOrder,
        datePlanned: purchaseOrders.datePlanned,
        amountUntaxed: purchaseOrders.amountUntaxed,
        amountTax: purchaseOrders.amountTax,
        amountTotal: purchaseOrders.amountTotal,
        notes: purchaseOrders.notes,
        origin: purchaseOrders.origin,
      })
      .from(purchaseOrders)
      .leftJoin(partners, eq(purchaseOrders.partnerId, partners.id))
      .where(eq(purchaseOrders.id, id))
      .limit(1)
      .all();
    if (!rows.length) throw new Error("Purchase order not found");
    return toPurchaseOrder(rows[0]);
  },

  async fetchPurchaseOrderLines(orderId: number) {
    const rows = await db
      .select({
        id: purchaseOrderLines.id,
        orderId: purchaseOrderLines.orderId,
        productId: purchaseOrderLines.productId,
        productName: products.name,
        name: purchaseOrderLines.name,
        productQty: purchaseOrderLines.productQty,
        priceUnit: purchaseOrderLines.priceUnit,
        priceSubtotal: purchaseOrderLines.priceSubtotal,
      })
      .from(purchaseOrderLines)
      .leftJoin(products, eq(purchaseOrderLines.productId, products.id))
      .where(eq(purchaseOrderLines.orderId, orderId))
      .orderBy(purchaseOrderLines.id)
      .all();

    return rows.map((r) => ({
      id: r.id,
      order_id: [r.orderId ?? 0, ""],
      product_id: r.productId
        ? [r.productId, r.productName || ""]
        : [0, r.name || ""],
      name: r.name || "",
      product_qty: r.productQty ?? 0,
      price_unit: r.priceUnit ?? 0,
      price_subtotal: r.priceSubtotal ?? 0,
      product_uom: [0, ""],
      taxes_id: [],
    }));
  },

  async confirmPurchaseOrder(id: number) {
    await db
      .update(purchaseOrders)
      .set({ state: "purchase" })
      .where(eq(purchaseOrders.id, id));
    return true;
  },

  async fetchPurchaseOrdersByOrigin(origin: string) {
    const rows = await db
      .select({
        id: purchaseOrders.id,
        name: purchaseOrders.name,
        state: purchaseOrders.state,
        partnerId: purchaseOrders.partnerId,
        partnerName: partners.name,
        dateOrder: purchaseOrders.dateOrder,
        datePlanned: purchaseOrders.datePlanned,
        amountUntaxed: purchaseOrders.amountUntaxed,
        amountTax: purchaseOrders.amountTax,
        amountTotal: purchaseOrders.amountTotal,
        notes: purchaseOrders.notes,
        origin: purchaseOrders.origin,
      })
      .from(purchaseOrders)
      .leftJoin(partners, eq(purchaseOrders.partnerId, partners.id))
      .where(eq(purchaseOrders.origin, origin))
      .orderBy(desc(purchaseOrders.id))
      .all();

    return rows.map((r) => toPurchaseOrder(r));
  },

  async createPurchaseOrderFromSaleOrder(saleOrderId: number) {
    const soRows = await db
      .select()
      .from(saleOrders)
      .where(eq(saleOrders.id, saleOrderId))
      .limit(1)
      .all();
    if (!soRows.length) throw new Error("Sale order not found");

    const so = soRows[0];
    const poName = generateDocNumber("PO", "purchase_order");

    const [po] = await db
      .insert(purchaseOrders)
      .values({
        name: poName,
        partnerId: so.partnerId,
        origin: so.name,
        dateOrder: new Date().toISOString().slice(0, 10),
      })
      .returning({ id: purchaseOrders.id });

    const lines = await db
      .select()
      .from(saleOrderLines)
      .where(eq(saleOrderLines.orderId, saleOrderId))
      .all();
    for (const line of lines) {
      await db.insert(purchaseOrderLines).values({
        orderId: po.id,
        productId: line.productId,
        name: line.name,
        productQty: line.productUomQty,
        priceUnit: line.priceUnit,
        priceSubtotal: line.priceSubtotal,
      });
    }

    await recalculatePoTotals(po.id);
    return po.id;
  },
};

function toPurchaseOrder(row: {
  id: number;
  name: string;
  state: string | null;
  partnerId: number | null;
  partnerName: string | null;
  dateOrder: string | null;
  datePlanned: string | null;
  amountUntaxed: number | null;
  amountTax: number | null;
  amountTotal: number | null;
  notes: string | null;
  origin: string | null;
}): PurchaseOrder {
  return {
    id: row.id,
    name: row.name,
    state: (row.state || "draft") as PurchaseOrder["state"],
    partner_id: [row.partnerId || 0, row.partnerName || ""],
    date_order: row.dateOrder || "",
    date_planned: row.datePlanned || "",
    order_line: [],
    amount_untaxed: row.amountUntaxed || 0,
    amount_tax: row.amountTax || 0,
    amount_total: row.amountTotal || 0,
    notes: row.notes || "",
    origin: row.origin || "",
  };
}

async function recalculatePoTotals(orderId: number): Promise<void> {
  const lines = await db
    .select({
      qty: purchaseOrderLines.productQty,
      price: purchaseOrderLines.priceUnit,
    })
    .from(purchaseOrderLines)
    .where(eq(purchaseOrderLines.orderId, orderId))
    .all();

  const amountUntaxed = lines.reduce(
    (sum, l) => sum + (l.qty ?? 0) * (l.price ?? 0),
    0
  );
  await db
    .update(purchaseOrders)
    .set({ amountUntaxed, amountTax: 0, amountTotal: amountUntaxed })
    .where(eq(purchaseOrders.id, orderId));
}
