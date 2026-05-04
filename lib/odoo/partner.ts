import { odooCall } from "./client";
import type { ResPartner, ProductProduct } from "@/types/odoo";

export async function fetchCustomers(limit = 100): Promise<ResPartner[]> {
  return odooCall<ResPartner[]>("res.partner", "search_read", [[ ["customer_rank", ">", 0] ]], {
    fields: ["id", "name", "email", "phone", "street", "city", "vat", "is_company"],
    limit,
    order: "name",
  });
}

export async function fetchVendors(limit = 100): Promise<ResPartner[]> {
  return odooCall<ResPartner[]>("res.partner", "search_read", [[ ["supplier_rank", ">", 0] ]], {
    fields: ["id", "name", "email", "phone", "street", "city", "vat", "is_company"],
    limit,
    order: "name",
  });
}

export async function fetchProducts(limit = 200): Promise<ProductProduct[]> {
  return odooCall<ProductProduct[]>("product.product", "search_read", [[ ["sale_ok", "=", true] ]], {
    fields: ["id", "name", "default_code", "list_price", "uom_id", "categ_id", "sale_ok", "purchase_ok"],
    limit,
    order: "default_code",
  });
}

export async function searchPartners(query: string, limit = 20): Promise<ResPartner[]> {
  return odooCall<ResPartner[]>("res.partner", "search_read", [[ ["name", "ilike", query] ]], {
    fields: ["id", "name", "email", "phone", "street", "city"],
    limit,
    order: "name",
  });
}

export async function fetchCustomerById(id: number): Promise<ResPartner | null> {
  const res = await odooCall<ResPartner[]>("res.partner", "search_read", [[ ["id", "=", id] ]], {
    fields: ["id", "name", "email", "phone", "street", "city", "vat", "is_company"],
    limit: 1,
  });
  return res && res.length ? res[0] : null;
}

export async function fetchProductById(id: number): Promise<ProductProduct | null> {
  const res = await odooCall<ProductProduct[]>("product.product", "search_read", [[ ["id", "=", id] ]], {
    fields: ["id", "name", "default_code", "list_price", "uom_id", "categ_id", "sale_ok", "purchase_ok"],
    limit: 1,
  });
  return res && res.length ? res[0] : null;
}

export async function createCustomer(data: Partial<ResPartner>): Promise<number> {
  return odooCall<number>("res.partner", "create", [[{
    name: data.name,
    email: data.email,
    phone: data.phone,
    street: data.street,
    city: data.city,
    vat: data.vat,
    is_company: data.is_company,
    customer_rank: 1,
  }]]);
}

export async function updateCustomer(id: number, data: Partial<ResPartner>): Promise<boolean> {
  await odooCall("res.partner", "write", [[id], {
    name: data.name,
    email: data.email,
    phone: data.phone,
    street: data.street,
    city: data.city,
    vat: data.vat,
    is_company: data.is_company,
  }]);
  return true;
}

export async function createProduct(data: Partial<ProductProduct & { description_sale?: string }>): Promise<number> {
  return odooCall<number>("product.product", "create", [[{
    name: data.name,
    default_code: data.default_code,
    list_price: data.list_price || 0,
    sale_ok: data.sale_ok ?? true,
    purchase_ok: data.purchase_ok ?? false,
    description_sale: data.description_sale,
  }]]);
}

export async function updateProduct(id: number, data: Partial<ProductProduct & { description_sale?: string }>): Promise<boolean> {
  await odooCall("product.product", "write", [[id], {
    name: data.name,
    default_code: data.default_code,
    list_price: data.list_price,
    sale_ok: data.sale_ok,
    purchase_ok: data.purchase_ok,
    description_sale: (data as any).description_sale,
  }]);
  return true;
}
