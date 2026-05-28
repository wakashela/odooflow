import { odooStock } from "../data/odoo/stock";
export const {
  fetchDeliveries,
  fetchDeliveryById,
  fetchStockMoves,
  validateDelivery,
  setMoveDoneQuantity,
  findInvoiceByOrigin,
} = odooStock;
