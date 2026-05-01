import { odooCall } from "./client";
import type { PurchaseOrder, PurchaseOrderLine } from "@/types/odoo";

const PO_FIELDS = [
  "id", "name", "state", "partner_id", "date_order",
  "date_planned", "order_line", "amount_untaxed", "amount_tax", "amount_total",
  "notes", "origin",
];

const PO_LINE_FIELDS = [
  "id", "order_id", "product_id", "name", "product_qty",
  "price_unit", "price_subtotal", "product_uom", "taxes_id",
];

export async function fetchPurchaseOrders(limit = 50, offset = 0): Promise<PurchaseOrder[]> {
  return odooCall<PurchaseOrder[]>("purchase.order", "search_read", [[]], {
    fields: PO_FIELDS,
    limit,
    offset,
    order: "id desc",
  });
}

export async function fetchPurchaseOrderById(id: number): Promise<PurchaseOrder> {
  const results = await odooCall<PurchaseOrder[]>("purchase.order", "search_read", [[["id", "=", id]]], {
    fields: PO_FIELDS,
    limit: 1,
  });
  if (!results.length) throw new Error("Purchase order not found");
  return results[0];
}

export async function fetchPurchaseOrderLines(orderId: number): Promise<PurchaseOrderLine[]> {
  return odooCall<PurchaseOrderLine[]>("purchase.order.line", "search_read", [[["order_id", "=", orderId]]], {
    fields: PO_LINE_FIELDS,
    order: "id",
  });
}

export async function confirmPurchaseOrder(id: number): Promise<boolean> {
  return odooCall<boolean>("purchase.order", "button_confirm", [[id]]);
}
