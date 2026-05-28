import type { SaleOrder, SaleOrderLine } from "@/types/odoo";
import type { DataBackend, CreateQuotationInput, AddLineInput } from "../types";
import { saleOrders, saleOrderLines, partners, products } from "./schema";
import { eq, desc } from "drizzle-orm";
import { db, generateDocNumber } from "./db";

export const sqliteSale: Pick<
  DataBackend,
  | "fetchQuotations"
  | "fetchQuotationById"
  | "fetchSaleOrderLines"
  | "createQuotation"
  | "updateQuotation"
  | "confirmQuotation"
  | "cancelQuotation"
  | "updateSaleOrderLine"
  | "deleteSaleOrderLine"
  | "addSaleOrderLine"
> = {
  async fetchQuotations(limit = 50, offset = 0) {
    const rows = await db
      .select({
        id: saleOrders.id,
        name: saleOrders.name,
        state: saleOrders.state,
        partnerId: saleOrders.partnerId,
        partnerName: partners.name,
        dateOrder: saleOrders.dateOrder,
        validityDate: saleOrders.validityDate,
        amountUntaxed: saleOrders.amountUntaxed,
        amountTax: saleOrders.amountTax,
        amountTotal: saleOrders.amountTotal,
        note: saleOrders.note,
        clientOrderRef: saleOrders.clientOrderRef,
        paymentTermId: saleOrders.paymentTermId,
      })
      .from(saleOrders)
      .leftJoin(partners, eq(saleOrders.partnerId, partners.id))
      .orderBy(desc(saleOrders.id))
      .limit(limit)
      .offset(offset)
      .all();

    return rows.map((r) => toSaleOrder(r));
  },

  async fetchQuotationById(id: number) {
    const rows = await db
      .select({
        id: saleOrders.id,
        name: saleOrders.name,
        state: saleOrders.state,
        partnerId: saleOrders.partnerId,
        partnerName: partners.name,
        dateOrder: saleOrders.dateOrder,
        validityDate: saleOrders.validityDate,
        amountUntaxed: saleOrders.amountUntaxed,
        amountTax: saleOrders.amountTax,
        amountTotal: saleOrders.amountTotal,
        note: saleOrders.note,
        clientOrderRef: saleOrders.clientOrderRef,
        paymentTermId: saleOrders.paymentTermId,
      })
      .from(saleOrders)
      .leftJoin(partners, eq(saleOrders.partnerId, partners.id))
      .where(eq(saleOrders.id, id))
      .limit(1)
      .all();

    if (!rows.length) throw new Error("Quotation not found");
    return toSaleOrder(rows[0]);
  },

  async fetchSaleOrderLines(orderId: number) {
    const rows = await db
      .select({
        id: saleOrderLines.id,
        orderId: saleOrderLines.orderId,
        productId: saleOrderLines.productId,
        productName: products.name,
        name: saleOrderLines.name,
        productUomQty: saleOrderLines.productUomQty,
        priceUnit: saleOrderLines.priceUnit,
        priceSubtotal: saleOrderLines.priceSubtotal,
        discount: saleOrderLines.discount,
        xDeliveryTime: saleOrderLines.xDeliveryTime,
      })
      .from(saleOrderLines)
      .leftJoin(products, eq(saleOrderLines.productId, products.id))
      .where(eq(saleOrderLines.orderId, orderId))
      .orderBy(saleOrderLines.id)
      .all();

    return rows.map((r) => ({
      id: r.id,
      order_id: [r.orderId ?? 0, ""],
      product_id: r.productId ? [r.productId, r.productName || ""] : [0, r.name || ""],
      name: r.name || "",
      product_uom_qty: r.productUomQty ?? 0,
      price_unit: r.priceUnit ?? 0,
      price_subtotal: r.priceSubtotal ?? 0,
      discount: r.discount ?? 0,
      tax_id: [],
      x_delivery_time: r.xDeliveryTime || "",
    }));
  },

  async createQuotation(data: CreateQuotationInput) {
    const name = generateDocNumber("SO", "sale_order");

    const [order] = await db
      .insert(saleOrders)
      .values({
        name,
        partnerId: data.partner_id,
        dateOrder: data.date_order || new Date().toISOString().slice(0, 10),
        validityDate: data.validity_date,
        note: data.note || "",
        clientOrderRef: data.client_order_ref || "",
        state: "draft",
      })
      .returning({ id: saleOrders.id });

    for (const line of data.order_line) {
      await db.insert(saleOrderLines).values({
        orderId: order.id,
        productId: line.product_id,
        name: line.name,
        productUomQty: line.product_uom_qty,
        priceUnit: line.price_unit,
        discount: line.discount || 0,
        priceSubtotal:
          line.product_uom_qty *
          line.price_unit *
          (1 - (line.discount || 0) / 100),
        xDeliveryTime: line.x_delivery_time || "",
      });
    }

    await recalculateOrderTotals(order.id);
    return order.id;
  },

  async updateQuotation(id: number, data: Partial<SaleOrder>) {
    const updateData: Record<string, unknown> = {};
    if (data.note !== undefined) updateData.note = data.note;
    if (data.client_order_ref !== undefined)
      updateData.clientOrderRef = data.client_order_ref;
    if (data.date_order !== undefined) updateData.dateOrder = data.date_order;
    if (data.validity_date !== undefined)
      updateData.validityDate = data.validity_date;
    if (data.partner_id !== undefined)
      updateData.partnerId = data.partner_id[0];

    if (Object.keys(updateData).length) {
      await db
        .update(saleOrders)
        .set(updateData)
        .where(eq(saleOrders.id, id));
    }
    return true;
  },

  async confirmQuotation(id: number) {
    await db
      .update(saleOrders)
      .set({ state: "sale" })
      .where(eq(saleOrders.id, id));
    return true;
  },

  async cancelQuotation(id: number) {
    await db
      .update(saleOrders)
      .set({ state: "cancel" })
      .where(eq(saleOrders.id, id));
    return true;
  },

  async updateSaleOrderLine(lineId: number, data: Partial<SaleOrderLine>) {
    const updateData: Record<string, unknown> = {};
    if (data.product_uom_qty !== undefined)
      updateData.productUomQty = data.product_uom_qty;
    if (data.price_unit !== undefined)
      updateData.priceUnit = data.price_unit;
    if (data.discount !== undefined) updateData.discount = data.discount;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.x_delivery_time !== undefined)
      updateData.xDeliveryTime = data.x_delivery_time;

    if (Object.keys(updateData).length) {
      const line = await db
        .select({ orderId: saleOrderLines.orderId })
        .from(saleOrderLines)
        .where(eq(saleOrderLines.id, lineId))
        .limit(1)
        .all();

      await db
        .update(saleOrderLines)
        .set(updateData)
        .where(eq(saleOrderLines.id, lineId));

      if (line.length && line[0].orderId != null) {
        await recalculateOrderTotals(line[0].orderId);
      }
    }
    return true;
  },

  async deleteSaleOrderLine(lineId: number) {
    const line = await db
      .select({ orderId: saleOrderLines.orderId })
      .from(saleOrderLines)
      .where(eq(saleOrderLines.id, lineId))
      .limit(1)
      .all();

    await db
      .delete(saleOrderLines)
      .where(eq(saleOrderLines.id, lineId));

    if (line.length && line[0].orderId != null) {
      await recalculateOrderTotals(line[0].orderId);
    }
    return true;
  },

  async addSaleOrderLine(orderId: number, line: AddLineInput) {
    const [row] = await db
      .insert(saleOrderLines)
      .values({
        orderId,
        productId: line.product_id,
        name: line.name,
        productUomQty: line.product_uom_qty,
        priceUnit: line.price_unit,
        discount: line.discount || 0,
        priceSubtotal:
          line.product_uom_qty *
          line.price_unit *
          (1 - (line.discount || 0) / 100),
      })
      .returning({ id: saleOrderLines.id });

    await recalculateOrderTotals(orderId);
    return row.id;
  },
};

function toSaleOrder(row: {
  id: number;
  name: string;
  state: string | null;
  partnerId: number | null;
  partnerName: string | null;
  dateOrder: string | null;
  validityDate: string | null;
  amountUntaxed: number | null;
  amountTax: number | null;
  amountTotal: number | null;
  note: string | null;
  clientOrderRef: string | null;
  paymentTermId: number | null;
}): SaleOrder {
  return {
    id: row.id,
    name: row.name,
    state: (row.state || "draft") as SaleOrder["state"],
    partner_id: [row.partnerId || 0, row.partnerName || ""],
    date_order: row.dateOrder || "",
    validity_date: row.validityDate || "",
    order_line: [],
    amount_untaxed: row.amountUntaxed || 0,
    amount_tax: row.amountTax || 0,
    amount_total: row.amountTotal || 0,
    note: row.note || "",
    client_order_ref: row.clientOrderRef || false,
    payment_term_id: false,
  };
}

async function recalculateOrderTotals(orderId: number): Promise<void> {
  const lines = await db
    .select({
      qty: saleOrderLines.productUomQty,
      price: saleOrderLines.priceUnit,
      discount: saleOrderLines.discount,
    })
    .from(saleOrderLines)
    .where(eq(saleOrderLines.orderId, orderId))
    .all();

  const amountUntaxed = lines.reduce(
    (sum, l) =>
      sum +
      (l.qty ?? 0) * (l.price ?? 0) * (1 - (l.discount ?? 0) / 100),
    0
  );

  await db
    .update(saleOrders)
    .set({ amountUntaxed, amountTax: 0, amountTotal: amountUntaxed })
    .where(eq(saleOrders.id, orderId));
}
