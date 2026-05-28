import type { OdooSessionInfo } from "@/types/odoo";
import type { DataBackend } from "../types";
import { odooCall } from "./client";
import { odooSale } from "./sale";
import { odooInvoice } from "./invoice";
import { odooPurchase } from "./purchase";
import { odooStock } from "./stock";
import { odooPartner } from "./partner";

export class OdooBackend implements DataBackend {
  async authenticate(username: string, password: string): Promise<OdooSessionInfo> {
    throw new Error("OdooBackend.authenticate should not be called directly — use /api/auth/login");
  }

  async getSessionInfo(sessionId: string): Promise<OdooSessionInfo | null> {
    throw new Error("OdooBackend.getSessionInfo should not be called directly — use /api/auth/session");
  }

  async destroySession(sessionId: string): Promise<void> {
    // No-op — session is managed via cookies
  }

  async call(model: string, method: string, args: unknown[], kwargs: Record<string, unknown> = {}): Promise<unknown> {
    return odooCall(model, method, args, kwargs);
  }

  fetchCustomers = odooPartner.fetchCustomers;
  fetchVendors = odooPartner.fetchVendors;
  fetchProducts = odooPartner.fetchProducts;
  searchPartners = odooPartner.searchPartners;
  fetchCustomerById = odooPartner.fetchCustomerById;
  fetchProductById = odooPartner.fetchProductById;
  createCustomer = odooPartner.createCustomer;
  updateCustomer = odooPartner.updateCustomer;
  createProduct = odooPartner.createProduct;
  updateProduct = odooPartner.updateProduct;

  fetchQuotations = odooSale.fetchQuotations;
  fetchQuotationById = odooSale.fetchQuotationById;
  fetchSaleOrderLines = odooSale.fetchSaleOrderLines;
  createQuotation = odooSale.createQuotation;
  updateQuotation = odooSale.updateQuotation;
  confirmQuotation = odooSale.confirmQuotation;
  cancelQuotation = odooSale.cancelQuotation;
  updateSaleOrderLine = odooSale.updateSaleOrderLine;
  deleteSaleOrderLine = odooSale.deleteSaleOrderLine;
  addSaleOrderLine = odooSale.addSaleOrderLine;

  fetchInvoices = odooInvoice.fetchInvoices;
  fetchInvoiceById = odooInvoice.fetchInvoiceById;
  fetchInvoiceLines = odooInvoice.fetchInvoiceLines;
  postInvoice = odooInvoice.postInvoice;
  createInvoicesFromSaleOrder = odooInvoice.createInvoicesFromSaleOrder;

  fetchPurchaseOrders = odooPurchase.fetchPurchaseOrders;
  fetchPurchaseOrderById = odooPurchase.fetchPurchaseOrderById;
  fetchPurchaseOrderLines = odooPurchase.fetchPurchaseOrderLines;
  confirmPurchaseOrder = odooPurchase.confirmPurchaseOrder;
  fetchPurchaseOrdersByOrigin = odooPurchase.fetchPurchaseOrdersByOrigin;
  createPurchaseOrderFromSaleOrder = odooPurchase.createPurchaseOrderFromSaleOrder;

  fetchDeliveries = odooStock.fetchDeliveries;
  fetchDeliveryById = odooStock.fetchDeliveryById;
  fetchStockMoves = odooStock.fetchStockMoves;
  validateDelivery = odooStock.validateDelivery;
  setMoveDoneQuantity = odooStock.setMoveDoneQuantity;
  findInvoiceByOrigin = odooStock.findInvoiceByOrigin;
}
