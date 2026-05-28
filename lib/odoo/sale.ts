import { odooSale } from "../data/odoo/sale";
export const {
  fetchQuotations,
  fetchQuotationById,
  fetchSaleOrderLines,
  createQuotation,
  updateQuotation,
  confirmQuotation,
  cancelQuotation,
  updateSaleOrderLine,
  deleteSaleOrderLine,
  addSaleOrderLine,
} = odooSale;
