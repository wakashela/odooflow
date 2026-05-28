import { odooCall } from "./client";
import type { StockPicking, StockMove } from "@/types/odoo";
import type { DataBackend } from "../types";

const PICKING_FIELDS = [
  "id", "name", "state", "partner_id", "scheduled_date",
  "date_done", "move_ids_without_package", "origin", "picking_type_id",
];

const MOVE_FIELDS = [
  "id", "picking_id", "product_id", "name", "product_uom_qty",
  "quantity", "product_uom",
];

export const odooStock: Pick<DataBackend,
  "fetchDeliveries" | "fetchDeliveryById" | "fetchStockMoves" |
  "validateDelivery" | "setMoveDoneQuantity" | "findInvoiceByOrigin"
> = {
  async fetchDeliveries(limit = 50, offset = 0) {
    return odooCall<StockPicking[]>("stock.picking", "search_read", [[["picking_type_code", "=", "outgoing"]]], {
      fields: PICKING_FIELDS,
      limit,
      offset,
      order: "id desc",
    });
  },

  async fetchDeliveryById(id: number) {
    const results = await odooCall<StockPicking[]>("stock.picking", "search_read", [[["id", "=", id]]], {
      fields: PICKING_FIELDS,
      limit: 1,
    });
    if (!results.length) throw new Error("Delivery not found");
    return results[0];
  },

  async fetchStockMoves(pickingId: number) {
    return odooCall<StockMove[]>("stock.move", "search_read", [[["picking_id", "=", pickingId]]], {
      fields: MOVE_FIELDS,
      order: "id",
    });
  },

  async validateDelivery(id: number) {
    return odooCall<boolean>("stock.picking", "button_validate", [[id]]);
  },

  async setMoveDoneQuantity(moveId: number, quantity: number) {
    return odooCall<boolean>("stock.move", "write", [[moveId], { quantity }]);
  },

  async findInvoiceByOrigin(origin: string) {
    const results = await odooCall<{ id: number; name: string }[]>(
      "account.move",
      "search_read",
      [[["invoice_origin", "=", origin], ["move_type", "=", "out_invoice"]]],
      { fields: ["id", "name"], limit: 1 }
    );
    return results.length > 0 ? results[0] : null;
  },
};
