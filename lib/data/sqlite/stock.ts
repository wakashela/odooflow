import type { StockPicking, StockMove } from "@/types/odoo";
import type { DataBackend } from "../types";
import { db } from "./db";
import {
  stockPickings,
  stockMoves,
  accountMoves,
  partners,
  products,
} from "./schema";
import { eq, desc } from "drizzle-orm";

export const sqliteStock: Pick<
  DataBackend,
  | "fetchDeliveries"
  | "fetchDeliveryById"
  | "fetchStockMoves"
  | "validateDelivery"
  | "setMoveDoneQuantity"
  | "findInvoiceByOrigin"
> = {
  async fetchDeliveries(limit = 50, offset = 0) {
    const rows = await db
      .select({
        id: stockPickings.id,
        name: stockPickings.name,
        state: stockPickings.state,
        partnerId: stockPickings.partnerId,
        partnerName: partners.name,
        scheduledDate: stockPickings.scheduledDate,
        dateDone: stockPickings.dateDone,
        origin: stockPickings.origin,
        pickingTypeId: stockPickings.pickingTypeId,
      })
      .from(stockPickings)
      .leftJoin(partners, eq(stockPickings.partnerId, partners.id))
      .orderBy(desc(stockPickings.id))
      .limit(limit)
      .offset(offset)
      .all();

    return rows.map((r) => toStockPicking(r));
  },

  async fetchDeliveryById(id: number) {
    const rows = await db
      .select({
        id: stockPickings.id,
        name: stockPickings.name,
        state: stockPickings.state,
        partnerId: stockPickings.partnerId,
        partnerName: partners.name,
        scheduledDate: stockPickings.scheduledDate,
        dateDone: stockPickings.dateDone,
        origin: stockPickings.origin,
        pickingTypeId: stockPickings.pickingTypeId,
      })
      .from(stockPickings)
      .leftJoin(partners, eq(stockPickings.partnerId, partners.id))
      .where(eq(stockPickings.id, id))
      .limit(1)
      .all();
    if (!rows.length) throw new Error("Delivery not found");
    return toStockPicking(rows[0]);
  },

  async fetchStockMoves(pickingId: number) {
    const rows = await db
      .select({
        id: stockMoves.id,
        pickingId: stockMoves.pickingId,
        productId: stockMoves.productId,
        productName: products.name,
        name: stockMoves.name,
        productUomQty: stockMoves.productUomQty,
        quantityDone: stockMoves.quantityDone,
      })
      .from(stockMoves)
      .leftJoin(products, eq(stockMoves.productId, products.id))
      .where(eq(stockMoves.pickingId, pickingId))
      .orderBy(stockMoves.id)
      .all();

    return rows.map((r) => ({
      id: r.id,
      picking_id: [r.pickingId ?? 0, ""],
      product_id: r.productId
        ? [r.productId, r.productName || ""]
        : [0, r.name || ""],
      name: r.name || "",
      product_uom_qty: r.productUomQty ?? 0,
      quantity_done: r.quantityDone ?? 0,
      product_uom: [0, ""],
    }));
  },

  async validateDelivery(id: number) {
    await db
      .update(stockPickings)
      .set({
        state: "done",
        dateDone: new Date().toISOString().slice(0, 10),
      })
      .where(eq(stockPickings.id, id));
    return true;
  },

  async setMoveDoneQuantity(moveId: number, quantity: number) {
    await db
      .update(stockMoves)
      .set({ quantityDone: quantity })
      .where(eq(stockMoves.id, moveId));
    return true;
  },

  async findInvoiceByOrigin(origin: string) {
    const rows = await db
      .select({ id: accountMoves.id, name: accountMoves.name })
      .from(accountMoves)
      .where(eq(accountMoves.invoiceOrigin, origin))
      .limit(1)
      .all();
    return rows.length ? { id: rows[0].id, name: rows[0].name } : null;
  },
};

function toStockPicking(row: {
  id: number;
  name: string;
  state: string | null;
  partnerId: number | null;
  partnerName: string | null;
  scheduledDate: string | null;
  dateDone: string | null;
  origin: string | null;
  pickingTypeId: number | null;
}): StockPicking {
  return {
    id: row.id,
    name: row.name,
    state: (row.state || "draft") as StockPicking["state"],
    partner_id: [row.partnerId || 0, row.partnerName || ""],
    scheduled_date: row.scheduledDate || "",
    date_done: row.dateDone || "",
    move_ids_without_package: [],
    origin: row.origin || "",
    picking_type_id: [row.pickingTypeId || 0, ""],
  };
}
