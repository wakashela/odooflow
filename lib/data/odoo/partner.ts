import { odooCall } from "./client";
import type { ResPartner, ProductProduct } from "@/types/odoo";
import type { DataBackend } from "../types";

export const odooPartner: Pick<DataBackend,
  "fetchCustomers" | "fetchVendors" | "fetchProducts" |
  "searchPartners" | "fetchCustomerById" | "fetchProductById" |
  "createCustomer" | "updateCustomer" | "createProduct" | "updateProduct"
> = {
  async fetchCustomers(limit = 100) {
    return odooCall<ResPartner[]>("res.partner", "search_read", [[["customer_rank", ">", 0]]], {
      fields: ["id", "name", "email", "phone", "street", "city", "vat", "x_tin", "is_company"],
      limit,
      order: "name",
    });
  },

  async fetchVendors(limit = 100) {
    return odooCall<ResPartner[]>("res.partner", "search_read", [[["supplier_rank", ">", 0]]], {
      fields: ["id", "name", "email", "phone", "street", "city", "vat", "x_tin", "is_company"],
      limit,
      order: "name",
    });
  },

  async fetchProducts(limit = 200) {
    return odooCall<ProductProduct[]>("product.product", "search_read", [[["sale_ok", "=", true]]], {
      fields: ["id", "name", "default_code", "list_price", "standard_price", "type", "uom_id", "categ_id", "sale_ok", "purchase_ok"],
      limit,
      order: "default_code",
    });
  },

  async searchPartners(query: string, limit = 20) {
    return odooCall<ResPartner[]>("res.partner", "search_read", [[["name", "ilike", query]]], {
      fields: ["id", "name", "email", "phone", "street", "city"],
      limit,
      order: "name",
    });
  },

  async fetchCustomerById(id: number) {
    const res = await odooCall<ResPartner[]>("res.partner", "search_read", [[["id", "=", id]]], {
      fields: ["id", "name", "email", "phone", "street", "city", "vat", "x_tin", "is_company"],
      limit: 1,
    });
    return res.length ? res[0] : null;
  },

  async fetchProductById(id: number) {
    const res = await odooCall<ProductProduct[]>("product.product", "search_read", [[["id", "=", id]]], {
      fields: ["id", "name", "default_code", "list_price", "standard_price", "type", "uom_id", "categ_id", "sale_ok", "purchase_ok"],
      limit: 1,
    });
    return res.length ? res[0] : null;
  },

  async createCustomer(data: Partial<ResPartner>) {
    return odooCall<number>("res.partner", "create", [{
      name: data.name,
      email: data.email,
      phone: data.phone,
      street: data.street,
      city: data.city,
      vat: data.vat,
      x_tin: data.x_tin,
      is_company: data.is_company,
      customer_rank: 1,
    }]);
  },

  async updateCustomer(id: number, data: Partial<ResPartner>) {
    await odooCall("res.partner", "write", [[id], {
      name: data.name,
      email: data.email,
      phone: data.phone,
      street: data.street,
      city: data.city,
      vat: data.vat,
      x_tin: data.x_tin,
      is_company: data.is_company,
    }]);
    return true;
  },

  async createProduct(data: Partial<ProductProduct & { description_sale?: string }>) {
    return odooCall<number>("product.product", "create", [{
      name: data.name,
      default_code: data.default_code,
      type: data.type || "consu",
      list_price: data.list_price || 0,
      standard_price: data.standard_price || 0,
      sale_ok: data.sale_ok ?? true,
      purchase_ok: data.purchase_ok ?? false,
      description_sale: data.description_sale,
    }]);
  },

  async updateProduct(id: number, data: Partial<ProductProduct & { description_sale?: string }>) {
    const writeData: Record<string, unknown> = {};
    if (data.name !== undefined) writeData.name = data.name;
    if (data.default_code !== undefined) writeData.default_code = data.default_code;
    if (data.type !== undefined) writeData.type = data.type;
    if (data.list_price !== undefined) writeData.list_price = data.list_price;
    if (data.standard_price !== undefined) writeData.standard_price = data.standard_price;
    if (data.sale_ok !== undefined) writeData.sale_ok = data.sale_ok;
    if (data.purchase_ok !== undefined) writeData.purchase_ok = data.purchase_ok;
    if (data.description_sale !== undefined) writeData.description_sale = data.description_sale;

    await odooCall("product.product", "write", [[id], writeData]);
    return true;
  },
};
