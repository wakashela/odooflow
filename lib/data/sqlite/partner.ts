import type { ResPartner, ProductProduct } from "@/types/odoo";
import type { DataBackend } from "../types";
import { db } from "./db";
import { partners, products } from "./schema";
import { eq, like } from "drizzle-orm";

export const sqlitePartner: Pick<DataBackend,
  "fetchCustomers" | "fetchVendors" | "fetchProducts" |
  "searchPartners" | "fetchCustomerById" | "fetchProductById" |
  "createCustomer" | "updateCustomer" | "createProduct" | "updateProduct"
> = {
  async fetchCustomers(limit = 100) {
    const rows = await db.select().from(partners).orderBy(partners.name).all();
    return rows.filter(r => (r.customerRank ?? 0) > 0).slice(0, limit).map(toResPartner);
  },

  async fetchVendors(limit = 100) {
    const rows = await db.select().from(partners).orderBy(partners.name).all();
    return rows.filter(r => (r.supplierRank ?? 0) > 0).slice(0, limit).map(toResPartner);
  },

  async fetchProducts(limit = 200) {
    const rows = await db.select().from(products)
      .where(eq(products.saleOk, true))
      .orderBy(products.defaultCode)
      .limit(limit)
      .all();
    return rows.map(toProductProduct);
  },

  async searchPartners(query: string, limit = 20) {
    const pattern = `%${query}%`;
    const rows = await db.select().from(partners)
      .where(like(partners.name, pattern))
      .orderBy(partners.name)
      .limit(limit)
      .all();
    return rows.map(toResPartner);
  },

  async fetchCustomerById(id: number) {
    const rows = await db.select().from(partners).where(eq(partners.id, id)).limit(1).all();
    return rows.length ? toResPartner(rows[0]) : null;
  },

  async fetchProductById(id: number) {
    const rows = await db.select().from(products).where(eq(products.id, id)).limit(1).all();
    return rows.length ? toProductProduct(rows[0]) : null;
  },

  async createCustomer(data: Partial<ResPartner>) {
    const [row] = await db.insert(partners).values({
      name: data.name || "",
      email: data.email || "",
      phone: data.phone || "",
      street: data.street || "",
      city: data.city || "",
      vat: data.vat || "",
      xTin: data.x_tin || "",
      isCompany: data.is_company ?? false,
      customerRank: 1,
    }).returning({ id: partners.id });
    return row.id;
  },

  async updateCustomer(id: number, data: Partial<ResPartner>) {
    await db.update(partners).set({
      name: data.name,
      email: data.email || "",
      phone: data.phone || "",
      street: data.street || "",
      city: data.city || "",
      vat: data.vat || "",
      xTin: data.x_tin || "",
      isCompany: data.is_company,
    }).where(eq(partners.id, id));
    return true;
  },

  async createProduct(data: Partial<ProductProduct & { description_sale?: string }>) {
    const [row] = await db.insert(products).values({
      name: data.name || "",
      defaultCode: data.default_code || "",
      listPrice: data.list_price || 0,
      standardPrice: data.standard_price || 0,
      type: (data.type as string) || "consu",
      saleOk: data.sale_ok ?? true,
      purchaseOk: data.purchase_ok ?? false,
    }).returning({ id: products.id });
    return row.id;
  },

  async updateProduct(id: number, data: Partial<ProductProduct & { description_sale?: string }>) {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.default_code !== undefined) updateData.defaultCode = data.default_code;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.list_price !== undefined) updateData.listPrice = data.list_price;
    if (data.standard_price !== undefined) updateData.standardPrice = data.standard_price;
    if (data.sale_ok !== undefined) updateData.saleOk = data.sale_ok;
    if (data.purchase_ok !== undefined) updateData.purchaseOk = data.purchase_ok;
    await db.update(products).set(updateData).where(eq(products.id, id));
    return true;
  },
};

function toResPartner(r: typeof partners.$inferSelect): ResPartner {
  return {
    id: r.id,
    name: r.name,
    email: r.email || false,
    phone: r.phone || false,
    street: r.street || false,
    street2: r.street2 || false,
    city: r.city || false,
    state_id: false,
    zip: r.zip || false,
    country_id: false,
    vat: r.vat || false,
    x_tin: r.xTin || false,
    is_company: r.isCompany ?? false,
    customer_rank: r.customerRank ?? 0,
    supplier_rank: r.supplierRank ?? 0,
  };
}

function toProductProduct(r: typeof products.$inferSelect): ProductProduct {
  return {
    id: r.id,
    name: r.name,
    default_code: r.defaultCode || false,
    list_price: r.listPrice ?? 0,
    standard_price: r.standardPrice ?? 0,
    type: (r.type ?? "consu") as "consu" | "service" | "combo",
    uom_id: [0, ""],
    categ_id: [0, ""],
    sale_ok: r.saleOk ?? true,
    purchase_ok: r.purchaseOk ?? false,
  };
}
