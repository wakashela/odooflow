import type {
  SaleOrder, SaleOrderLine,
  AccountMove, AccountMoveLine,
  PurchaseOrder, PurchaseOrderLine,
  StockPicking, StockMove,
  ResPartner, ProductProduct,
  OdooSessionInfo,
} from "@/types/odoo";

export interface CreateQuotationInput {
  partner_id: number;
  date_order?: string;
  validity_date?: string;
  note?: string;
  client_order_ref?: string;
  order_line: {
    product_id: number;
    name: string;
    product_uom_qty: number;
    price_unit: number;
    discount?: number;
    x_delivery_time?: string;
  }[];
}

export interface AddLineInput {
  product_id: number;
  name: string;
  product_uom_qty: number;
  price_unit: number;
  discount?: number;
}

export interface DataBackend {
  authenticate(username: string, password: string): Promise<OdooSessionInfo>;
  getSessionInfo(sessionId: string): Promise<OdooSessionInfo | null>;
  destroySession(sessionId: string): Promise<void>;

  call(model: string, method: string, args: unknown[], kwargs?: Record<string, unknown>): Promise<unknown>;

  fetchCustomers(limit?: number): Promise<ResPartner[]>;
  fetchVendors(limit?: number): Promise<ResPartner[]>;
  fetchProducts(limit?: number): Promise<ProductProduct[]>;
  searchPartners(query: string, limit?: number): Promise<ResPartner[]>;
  fetchCustomerById(id: number): Promise<ResPartner | null>;
  fetchProductById(id: number): Promise<ProductProduct | null>;
  createCustomer(data: Partial<ResPartner>): Promise<number>;
  updateCustomer(id: number, data: Partial<ResPartner>): Promise<boolean>;
  createProduct(data: Partial<ProductProduct & { description_sale?: string }>): Promise<number>;
  updateProduct(id: number, data: Partial<ProductProduct & { description_sale?: string }>): Promise<boolean>;

  fetchQuotations(limit?: number, offset?: number): Promise<SaleOrder[]>;
  fetchQuotationById(id: number): Promise<SaleOrder>;
  fetchSaleOrderLines(orderId: number): Promise<SaleOrderLine[]>;
  createQuotation(data: CreateQuotationInput): Promise<number>;
  updateQuotation(id: number, data: Partial<SaleOrder>): Promise<boolean>;
  confirmQuotation(id: number): Promise<boolean>;
  cancelQuotation(id: number): Promise<boolean>;
  updateSaleOrderLine(lineId: number, data: Partial<SaleOrderLine>): Promise<boolean>;
  deleteSaleOrderLine(lineId: number): Promise<boolean>;
  addSaleOrderLine(orderId: number, line: AddLineInput): Promise<number>;

  fetchInvoices(limit?: number, offset?: number): Promise<AccountMove[]>;
  fetchInvoiceById(id: number): Promise<AccountMove>;
  fetchInvoiceLines(invoiceId: number): Promise<AccountMoveLine[]>;
  postInvoice(id: number): Promise<boolean>;
  createInvoicesFromSaleOrder(orderId: number): Promise<number[]>;

  fetchPurchaseOrders(limit?: number, offset?: number): Promise<PurchaseOrder[]>;
  fetchPurchaseOrderById(id: number): Promise<PurchaseOrder>;
  fetchPurchaseOrderLines(orderId: number): Promise<PurchaseOrderLine[]>;
  confirmPurchaseOrder(id: number): Promise<boolean>;
  fetchPurchaseOrdersByOrigin(origin: string): Promise<PurchaseOrder[]>;
  createPurchaseOrderFromSaleOrder(saleOrderId: number): Promise<number>;

  fetchDeliveries(limit?: number, offset?: number): Promise<StockPicking[]>;
  fetchDeliveryById(id: number): Promise<StockPicking>;
  fetchStockMoves(pickingId: number): Promise<StockMove[]>;
  validateDelivery(id: number): Promise<boolean>;
  setMoveDoneQuantity(moveId: number, quantity: number): Promise<boolean>;
  findInvoiceByOrigin(origin: string): Promise<{ id: number; name: string } | null>;
}
