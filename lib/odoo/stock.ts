import { odooCall } from "./client";
import type { StockPicking, StockMove } from "@/types/odoo";

const PICKING_FIELDS = [
  "id", "name", "state", "partner_id", "scheduled_date",
  "date_done", "move_ids_without_package", "origin", "picking_type_id",
];

const MOVE_FIELDS = [
  "id", "picking_id", "product_id", "name", "product_uom_qty",
  "quantity", "product_uom",
];

export async function fetchDeliveries(limit = 50, offset = 0): Promise<StockPicking[]> {
  return odooCall<StockPicking[]>("stock.picking", "search_read", [[["picking_type_code", "=", "outgoing"]]], {
    fields: PICKING_FIELDS,
    limit,
    offset,
    order: "id desc",
  });
}

export async function fetchDeliveryById(id: number): Promise<StockPicking> {
  const results = await odooCall<StockPicking[]>("stock.picking", "search_read", [[["id", "=", id]]], {
    fields: PICKING_FIELDS,
    limit: 1,
  });
  if (!results.length) throw new Error("Delivery not found");
  return results[0];
}

export async function fetchStockMoves(pickingId: number): Promise<StockMove[]> {
  return odooCall<StockMove[]>("stock.move", "search_read", [[["picking_id", "=", pickingId]]], {
    fields: MOVE_FIELDS,
    order: "id",
  });
}

export async function validateDelivery(id: number): Promise<boolean> {
  return odooCall<boolean>("stock.picking", "button_validate", [[id]]);
}
