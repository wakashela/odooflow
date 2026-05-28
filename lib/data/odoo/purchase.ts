import { odooCall } from "./client";
import type { PurchaseOrder, PurchaseOrderLine } from "@/types/odoo";
import type { DataBackend } from "../types";
import { odooSale } from "./sale";

const PO_FIELDS = [
  "id", "name", "state", "partner_id", "date_order",
  "date_planned", "order_line", "amount_untaxed", "amount_tax", "amount_total",
  "notes", "origin",
];

const PO_LINE_FIELDS = [
  "id", "order_id", "product_id", "name", "product_qty",
  "price_unit", "price_subtotal", "product_uom", "taxes_id",
];

export const odooPurchase: Pick<DataBackend,
  "fetchPurchaseOrders" | "fetchPurchaseOrderById" | "fetchPurchaseOrderLines" |
  "confirmPurchaseOrder" | "fetchPurchaseOrdersByOrigin" | "createPurchaseOrderFromSaleOrder"
> = {
  async fetchPurchaseOrders(limit = 50, offset = 0) {
    return odooCall<PurchaseOrder[]>("purchase.order", "search_read", [[]], {
      fields: PO_FIELDS,
      limit,
      offset,
      order: "id desc",
    });
  },

  async fetchPurchaseOrderById(id: number) {
    const results = await odooCall<PurchaseOrder[]>("purchase.order", "search_read", [[["id", "=", id]]], {
      fields: PO_FIELDS,
      limit: 1,
    });
    if (!results.length) throw new Error("Purchase order not found");
    return results[0];
  },

  async fetchPurchaseOrderLines(orderId: number) {
    return odooCall<PurchaseOrderLine[]>("purchase.order.line", "search_read", [[["order_id", "=", orderId]]], {
      fields: PO_LINE_FIELDS,
      order: "id",
    });
  },

  async confirmPurchaseOrder(id: number) {
    return odooCall<boolean>("purchase.order", "button_confirm", [[id]]);
  },

  async fetchPurchaseOrdersByOrigin(origin: string) {
    return odooCall<PurchaseOrder[]>("purchase.order", "search_read", [[["origin", "=", origin]]], {
      fields: PO_FIELDS,
      order: "id desc",
    });
  },

  async createPurchaseOrderFromSaleOrder(saleOrderId: number) {
    const saleOrder = await odooSale.fetchQuotationById(saleOrderId);
    const saleLines = await odooSale.fetchSaleOrderLines(saleOrderId);

    if (!saleOrder.partner_id?.[0]) {
      throw new Error("Sale order partner is required to create a purchase order");
    }

    const purchaseOrderId = await odooCall<number>("purchase.order", "create", [{
      partner_id: saleOrder.partner_id[0],
      origin: saleOrder.name,
    }]);

    for (const line of saleLines) {
      if (!line.product_id?.[0]) continue;
      await odooCall<number>("purchase.order.line", "create", [{
        order_id: purchaseOrderId,
        product_id: line.product_id[0],
        name: line.name,
        product_qty: line.product_uom_qty,
        price_unit: line.price_unit,
      }]);
    }

    return purchaseOrderId;
  },
};
