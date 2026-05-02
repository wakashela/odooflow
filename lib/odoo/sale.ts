import { odooCall } from "./client";
import type { SaleOrder, SaleOrderLine } from "@/types/odoo";

const SALE_FIELDS = [
  "name", "state", "partner_id", "date_order", "validity_date",
  "order_line", "amount_untaxed", "amount_tax", "amount_total",
  "note", "carrier_id", "invoice_ids", "picking_ids",
];

const LINE_FIELDS = [
  "id", "order_id", "product_id", "name", "product_uom_qty",
  "price_unit", "price_subtotal", "discount", "tax_id",
];

export async function fetchQuotations(limit = 50, offset = 0): Promise<SaleOrder[]> {
  return odooCall<SaleOrder[]>("sale.order", "search_read", [[]], {
    fields: SALE_FIELDS,
    limit,
    offset,
    order: "id desc",
  });
}

export async function fetchQuotationById(id: number): Promise<SaleOrder> {
  const results = await odooCall<SaleOrder[]>("sale.order", "search_read", [[["id", "=", id]]], {
    fields: SALE_FIELDS,
    limit: 1,
  });
  if (!results.length) throw new Error("Quotation not found");
  return results[0];
}

export async function fetchSaleOrderLines(orderId: number): Promise<SaleOrderLine[]> {
  return odooCall<SaleOrderLine[]>("sale.order.line", "search_read", [[["order_id", "=", orderId]]], {
    fields: LINE_FIELDS,
    order: "id",
  });
}

export async function createQuotation(data: {
  partner_id: number;
  date_order?: string;
  validity_date?: string;
  note?: string;
  order_line: {
    product_id: number;
    name: string;
    product_uom_qty: number;
    price_unit: number;
    discount?: number;
  }[];
}): Promise<number> {
  const orderLineData = data.order_line.map((line) => [
    0, 0, {
      product_id: line.product_id,
      name: line.name,
      product_uom_qty: line.product_uom_qty,
      price_unit: line.price_unit,
      discount: line.discount || 0,
    },
  ]);

  const result = await odooCall<number>("sale.order", "create", [{
    partner_id: data.partner_id,
    date_order: data.date_order,
    validity_date: data.validity_date,
    note: data.note,
    order_line: orderLineData,
  }]);

  return result;
}

export async function updateQuotation(id: number, data: Partial<SaleOrder>): Promise<boolean> {
  return odooCall<boolean>("sale.order", "write", [[id], data]);
}

export async function confirmQuotation(id: number): Promise<boolean> {
  return odooCall<boolean>("sale.order", "action_confirm", [[id]]);
}

export async function cancelQuotation(id: number): Promise<boolean> {
  return odooCall<boolean>("sale.order", "action_cancel", [[id]]);
}

export async function updateSaleOrderLine(lineId: number, data: Partial<SaleOrderLine>): Promise<boolean> {
  return odooCall<boolean>("sale.order.line", "write", [[lineId], data]);
}

export async function deleteSaleOrderLine(lineId: number): Promise<boolean> {
  return odooCall<boolean>("sale.order.line", "unlink", [[lineId]]);
}

export async function addSaleOrderLine(orderId: number, line: {
  product_id: number;
  name: string;
  product_uom_qty: number;
  price_unit: number;
  discount?: number;
}): Promise<number> {
  return odooCall<number>("sale.order.line", "create", [{
    order_id: orderId,
    product_id: line.product_id,
    name: line.name,
    product_uom_qty: line.product_uom_qty,
    price_unit: line.price_unit,
    discount: line.discount || 0,
  }]);
}
