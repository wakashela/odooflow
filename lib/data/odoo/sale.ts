import { odooCall } from "./client";
import type { SaleOrder, SaleOrderLine } from "@/types/odoo";
import type { DataBackend, CreateQuotationInput, AddLineInput } from "../types";

const SALE_FIELDS = [
  "name", "state", "partner_id", "date_order", "validity_date",
  "order_line", "amount_untaxed", "amount_tax", "amount_total",
  "note", "invoice_ids", "picking_ids", "user_id", "activity_state", "client_order_ref",
  "payment_term_id",
];

const LINE_FIELDS = [
  "id", "order_id", "product_id", "name", "product_uom_qty",
  "price_unit", "price_subtotal", "discount", "tax_id", "x_delivery_time",
];

export const odooSale: Pick<DataBackend,
  "fetchQuotations" | "fetchQuotationById" | "fetchSaleOrderLines" |
  "createQuotation" | "updateQuotation" | "confirmQuotation" | "cancelQuotation" |
  "updateSaleOrderLine" | "deleteSaleOrderLine" | "addSaleOrderLine"
> = {
  async fetchQuotations(limit = 50, offset = 0) {
    return odooCall<SaleOrder[]>("sale.order", "search_read", [[]], {
      fields: SALE_FIELDS,
      limit,
      offset,
      order: "id desc",
    });
  },

  async fetchQuotationById(id: number) {
    const results = await odooCall<SaleOrder[]>("sale.order", "search_read", [[["id", "=", id]]], {
      fields: SALE_FIELDS,
      limit: 1,
    });
    if (!results.length) throw new Error("Quotation not found");
    return results[0];
  },

  async fetchSaleOrderLines(orderId: number) {
    return odooCall<SaleOrderLine[]>("sale.order.line", "search_read", [[["order_id", "=", orderId]]], {
      fields: LINE_FIELDS,
      order: "id",
    });
  },

  async createQuotation(data: CreateQuotationInput) {
    const orderLineData = data.order_line.map((line) => [
      0, 0, {
        product_id: line.product_id,
        name: line.name,
        product_uom_qty: line.product_uom_qty,
        price_unit: line.price_unit,
        discount: line.discount || 0,
        x_delivery_time: line.x_delivery_time || "",
      },
    ]);

    return odooCall<number>("sale.order", "create", [{
      partner_id: data.partner_id,
      date_order: data.date_order,
      validity_date: data.validity_date,
      note: data.note,
      client_order_ref: data.client_order_ref,
      order_line: orderLineData,
    }]);
  },

  async updateQuotation(id: number, data: Partial<SaleOrder>) {
    return odooCall<boolean>("sale.order", "write", [[id], data]);
  },

  async confirmQuotation(id: number) {
    return odooCall<boolean>("sale.order", "action_confirm", [[id]]);
  },

  async cancelQuotation(id: number) {
    return odooCall<boolean>("sale.order", "action_cancel", [[id]]);
  },

  async updateSaleOrderLine(lineId: number, data: Partial<SaleOrderLine>) {
    return odooCall<boolean>("sale.order.line", "write", [[lineId], data]);
  },

  async deleteSaleOrderLine(lineId: number) {
    return odooCall<boolean>("sale.order.line", "unlink", [[lineId]]);
  },

  async addSaleOrderLine(orderId: number, line: AddLineInput) {
    return odooCall<number>("sale.order.line", "create", [{
      order_id: orderId,
      product_id: line.product_id,
      name: line.name,
      product_uom_qty: line.product_uom_qty,
      price_unit: line.price_unit,
      discount: line.discount || 0,
    }]);
  },
};
