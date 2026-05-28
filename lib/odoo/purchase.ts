import { odooPurchase } from "../data/odoo/purchase";
export const {
  fetchPurchaseOrders,
  fetchPurchaseOrderById,
  fetchPurchaseOrderLines,
  confirmPurchaseOrder,
  fetchPurchaseOrdersByOrigin,
  createPurchaseOrderFromSaleOrder,
} = odooPurchase;
