import type { OdooSessionInfo } from "@/types/odoo";
import type { DataBackend } from "../types";
import { sqlitePartner } from "./partner";
import { sqliteSale } from "./sale";
import { sqliteInvoice } from "./invoice";
import { sqlitePurchase } from "./purchase";
import { sqliteStock } from "./stock";
import { db } from "./db";
import { users } from "./schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

const tokens = new Map<string, OdooSessionInfo>();

export class SqliteBackend implements DataBackend {
  async authenticate(
    username: string,
    password: string,
  ): Promise<OdooSessionInfo> {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1)
      .all();
    if (!rows.length) throw new Error("Invalid credentials");

    const user = rows[0];
    if (user.passwordHash !== hashPassword(password)) {
      throw new Error("Invalid credentials");
    }

    const sessionInfo: OdooSessionInfo = {
      uid: user.id,
      name: user.name,
      username: user.username,
      db: "odooflow.db",
      server_version: "offline",
      partner_id: user.id,
      is_system: false,
      is_admin: true,
      user_context: {
        lang: "en_US",
        tz: "Africa/Dar_es_Salaam",
        uid: user.id,
      },
      user_companies: {
        current_company: 1,
        allowed_companies: {},
      },
      currencies: {},
    };

    const token = generateToken();
    tokens.set(token, sessionInfo);
    (sessionInfo as unknown as Record<string, unknown>)._token = token;

    return sessionInfo;
  }

  async getSessionInfo(token: string): Promise<OdooSessionInfo | null> {
    return tokens.get(token) || null;
  }

  async destroySession(token: string): Promise<void> {
    tokens.delete(token);
  }

  async call(
    model: string,
    method: string,
    args: unknown[],
    kwargs: Record<string, unknown> = {},
  ): Promise<unknown> {
    if (model === "res.company" && method === "search_read") {
      return [
        {
          id: 1,
          name: "OdooFlow Offline",
          street: "",
          street2: "",
          city: "",
          zip: "",
          phone: "",
          email: "",
          website: "",
          vat: "",
          logo: "",
          country_id: false,
          partner_id: 0,
        },
      ];
    }
    if (model === "res.partner.bank" && method === "search_read") {
      return [];
    }
    if (model === "ir.config_parameter") {
      return [];
    }
    return null;
  }

  fetchCustomers = sqlitePartner.fetchCustomers;
  fetchVendors = sqlitePartner.fetchVendors;
  fetchProducts = sqlitePartner.fetchProducts;
  searchPartners = sqlitePartner.searchPartners;
  fetchCustomerById = sqlitePartner.fetchCustomerById;
  fetchProductById = sqlitePartner.fetchProductById;
  createCustomer = sqlitePartner.createCustomer;
  updateCustomer = sqlitePartner.updateCustomer;
  createProduct = sqlitePartner.createProduct;
  updateProduct = sqlitePartner.updateProduct;

  fetchQuotations = sqliteSale.fetchQuotations;
  fetchQuotationById = sqliteSale.fetchQuotationById;
  fetchSaleOrderLines = sqliteSale.fetchSaleOrderLines;
  createQuotation = sqliteSale.createQuotation;
  updateQuotation = sqliteSale.updateQuotation;
  confirmQuotation = sqliteSale.confirmQuotation;
  cancelQuotation = sqliteSale.cancelQuotation;
  updateSaleOrderLine = sqliteSale.updateSaleOrderLine;
  deleteSaleOrderLine = sqliteSale.deleteSaleOrderLine;
  addSaleOrderLine = sqliteSale.addSaleOrderLine;

  fetchInvoices = sqliteInvoice.fetchInvoices;
  fetchInvoiceById = sqliteInvoice.fetchInvoiceById;
  fetchInvoiceLines = sqliteInvoice.fetchInvoiceLines;
  postInvoice = sqliteInvoice.postInvoice;
  createInvoicesFromSaleOrder = sqliteInvoice.createInvoicesFromSaleOrder;

  fetchPurchaseOrders = sqlitePurchase.fetchPurchaseOrders;
  fetchPurchaseOrderById = sqlitePurchase.fetchPurchaseOrderById;
  fetchPurchaseOrderLines = sqlitePurchase.fetchPurchaseOrderLines;
  confirmPurchaseOrder = sqlitePurchase.confirmPurchaseOrder;
  fetchPurchaseOrdersByOrigin = sqlitePurchase.fetchPurchaseOrdersByOrigin;
  createPurchaseOrderFromSaleOrder =
    sqlitePurchase.createPurchaseOrderFromSaleOrder;

  fetchDeliveries = sqliteStock.fetchDeliveries;
  fetchDeliveryById = sqliteStock.fetchDeliveryById;
  fetchStockMoves = sqliteStock.fetchStockMoves;
  validateDelivery = sqliteStock.validateDelivery;
  setMoveDoneQuantity = sqliteStock.setMoveDoneQuantity;
  findInvoiceByOrigin = sqliteStock.findInvoiceByOrigin;
}
