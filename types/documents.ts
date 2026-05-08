import type { OdooRelation } from "./odoo";

export type DocumentState =
  | "draft"
  | "sent"
  | "sale"
  | "posted"
  | "done"
  | "cancel"
  | "purchase"
  | "confirmed"
  | "assigned"
  | "waiting";

export type DocumentType = "quotation" | "proforma" | "purchase_order" | "invoice" | "delivery" | "packing_list";

export interface DocumentListItem {
  id: number;
  name: string;
  partner: string;
  date: string;
  amount: number;
  state: DocumentState;
  type: DocumentType;
}

export interface LineItem {
  id: number;
  productId?: number;
  productLabel?: string;
  partNumber?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
  taxIds?: number[];
}

export interface DocumentDetail {
  id: number;
  name: string;
  type: DocumentType;
  state: DocumentState;
  partnerId: number;
  partnerName: string;
  partnerAddress?: string;
  date: string;
  expiryDate?: string;
  lines: LineItem[];
  amountUntaxed: number;
  amountTax: number;
  amountTotal: number;
  notes?: string;
  trackingNo?: string;
  deliveryTime?: string;
  shipVia?: string;
  origin?: string;
}

export interface WorkflowStep {
  type: DocumentType;
  label: string;
  status: "completed" | "current" | "pending";
}

export const WORKFLOW_ORDER: DocumentType[] = [
  "quotation",
  "proforma",
  "purchase_order",
  "invoice",
  "delivery",
  "packing_list",
];

export const WORKFLOW_LABELS: Record<DocumentType, string> = {
  quotation: "Quotation",
  proforma: "Proforma",
  purchase_order: "Purchase Order",
  invoice: "Tax Invoice",
  delivery: "Delivery Note",
  packing_list: "Packing List",
};
