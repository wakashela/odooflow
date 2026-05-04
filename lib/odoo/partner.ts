import { odooCall } from "./client";
import type { ResPartner, ProductProduct } from "@/types/odoo";

export async function fetchCustomers(limit = 100): Promise<ResPartner[]> {
  return odooCall<ResPartner[]>("res.partner", "search_read", [[["customer_rank", ">", 0]]], {
    fields: ["id", "name", "email", "phone", "street", "city", "vat", "is_company"],
    limit,
    order: "name",
  });
}

export async function fetchVendors(limit = 100): Promise<ResPartner[]> {
  return odooCall<ResPartner[]>("res.partner", "search_read", [[["supplier_rank", ">", 0]]], {
    fields: ["id", "name", "email", "phone", "street", "city", "vat", "is_company"],
    limit,
    order: "name",
  });
}

export async function fetchProducts(limit = 200): Promise<ProductProduct[]> {
  return odooCall<ProductProduct[]>("product.product", "search_read", [[["sale_ok", "=", true]]], {
    fields: ["id", "name", "default_code", "list_price", "uom_id", "categ_id", "sale_ok"],
    limit,
    order: "default_code",
  });
}

export async function searchPartners(query: string, limit = 20): Promise<ResPartner[]> {
  return odooCall<ResPartner[]>("res.partner", "search_read", [[["name", "ilike", query]]], {
    fields: ["id", "name", "email", "phone", "street", "city"],
    limit,
    order: "name",
  });
}

export async function fetchCustomerById(id: number): Promise<ResPartner | null> {
  const res = await odooCall<ResPartner[]>("res.partner", "search_read", [[["id", "=", id]]], {
    fields: ["id", "name", "email", "phone", "street", "city", "vat", "is_company"],
    limit: 1,
  });
  return res && res.length ? res[0] : null;
}

export async function fetchProductById(id: number): Promise<ProductProduct | null> {
  const res = await odooCall<ProductProduct[]>("product.product", "search_read", [[["id", "=", id]]], {
    fields: ["id", "name", "default_code", "list_price", "uom_id", "categ_id", "sale_ok", "purchase_ok"],
    limit: 1,
  });
  return res && res.length ? res[0] : null;
}
