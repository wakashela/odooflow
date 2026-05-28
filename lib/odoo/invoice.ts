import { odooInvoice } from "../data/odoo/invoice";
export const {
  fetchInvoices,
  fetchInvoiceById,
  fetchInvoiceLines,
  postInvoice,
  createInvoicesFromSaleOrder,
} = odooInvoice;
