export type OdooRelation = [number, string];

export interface SaleOrder {
  id: number;
  name: string;
  state: "draft" | "sent" | "sale" | "cancel";
  partner_id: OdooRelation;
  date_order: string;
  validity_date: string;
  order_line: number[];
  amount_untaxed: number;
  amount_tax: number;
  amount_total: number;
  note: string;
  carrier_id?: OdooRelation;
  x_tracking_no?: string;
  x_delivery_time?: string;
  x_ship_via?: string;
  x_part_make?: string;
  invoice_ids?: number[];
  picking_ids?: number[];
  user_id?: OdooRelation;
  activity_state?: string;
  client_order_ref?: string | false;
  payment_term_id: OdooRelation | false;
}

export interface SaleOrderLine {
  id: number;
  order_id: OdooRelation;
  product_id: OdooRelation;
  name: string;
  product_uom_qty: number;
  price_unit: number;
  price_subtotal: number;
  discount: number;
  tax_id: OdooRelation[];
}

export interface AccountMove {
  id: number;
  name: string;
  move_type: "out_invoice" | "out_refund" | "in_invoice" | "in_refund";
  state: "draft" | "posted" | "cancel";
  partner_id: OdooRelation;
  invoice_date: string;
  invoice_date_due: string;
  invoice_line_ids: number[];
  amount_untaxed: number;
  amount_tax: number;
  amount_total: number;
  payment_state?: "not_paid" | "in_payment" | "paid" | "partial" | "reversed";
  invoice_origin?: string;
  narration?: string;
  invoice_payment_term_id: OdooRelation | false;
}

export interface AccountMoveLine {
  id: number;
  move_id: OdooRelation;
  product_id: OdooRelation;
  name: string;
  quantity: number;
  price_unit: number;
  price_subtotal: number;
  discount: number;
  tax_ids: OdooRelation[];
}

export interface StockPicking {
  id: number;
  name: string;
  state: "draft" | "waiting" | "confirmed" | "assigned" | "done" | "cancel";
  partner_id: OdooRelation;
  scheduled_date: string;
  date_done?: string;
  move_ids_without_package: number[];
  origin: string;
  picking_type_id: OdooRelation;
}

export interface StockMove {
  id: number;
  picking_id: OdooRelation;
  product_id: OdooRelation;
  name: string;
  product_uom_qty: number;
  quantity_done: number;
  product_uom: OdooRelation;
}

export interface PurchaseOrder {
  id: number;
  name: string;
  state: "draft" | "sent" | "purchase" | "done" | "cancel";
  partner_id: OdooRelation;
  date_order: string;
  date_planned: string;
  order_line: number[];
  amount_untaxed: number;
  amount_tax: number;
  amount_total: number;
  notes?: string;
  origin?: string;
}

export interface PurchaseOrderLine {
  id: number;
  order_id: OdooRelation;
  product_id: OdooRelation;
  name: string;
  product_qty: number;
  price_unit: number;
  price_subtotal: number;
  product_uom: OdooRelation;
  taxes_id: OdooRelation[];
}

export interface ResPartner {
  id: number;
  name: string;
  email: string | false;
  phone: string | false;
  street: string | false;
  city: string | false;
  vat: string | false;
  is_company: boolean;
  customer_rank: number;
  supplier_rank: number;
}

export interface ProductProduct {
  id: number;
  name: string;
  default_code: string | false;
  list_price: number;
  standard_price: number;
  type: "consu" | "service" | "product";
  uom_id: OdooRelation;
  categ_id: OdooRelation;
  sale_ok: boolean;
  purchase_ok: boolean;
}

export interface OdooRpcError {
  code: number;
  message: string;
  data: {
    name: string;
    debug: string;
    message: string;
    arguments: string[];
    context: Record<string, unknown>;
  };
}

export interface OdooRpcResponse<T> {
  jsonrpc: "2.0";
  id: number;
  result?: T;
  error?: OdooRpcError;
}

export interface OdooSessionInfo {
  uid: number;
  name: string;
  username: string;
  db: string;
  server_version: string;
  partner_id: number;
  is_system: boolean;
  is_admin: boolean;
  user_context: {
    lang: string;
    tz: string;
    uid: number;
  };
  user_companies: {
    current_company: number;
    allowed_companies: Record<number, { id: number; name: string }>;
  };
  currencies: Record<string, { symbol: string; position: string; digits: [number, number] }>;
}
