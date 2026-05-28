# Offline Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a SQLite backend to OdooFlow via a DataBackend adapter pattern, enabling the same Next.js app to run offline with a local database.

**Architecture:** A `DataBackend` interface defines all data operations. Two implementations — `OdooBackend` (current JSON-RPC behavior) and `SqliteBackend` (new Drizzle/SQLite). A factory selects the backend via `BACKEND` env var. UI components never change between backends.

**Tech Stack:** TypeScript, Next.js 16, Zustand, Drizzle ORM, better-sqlite3

---

## Scope

This plan covers **Phase 1** (extract interface, OdooBackend, update imports) and **Phase 2** (SQLite schema, SqliteBackend, seed data). Phase 3 (feature parity workflow) is a process, not implementation tasks.

---

### Task 1: Create DataBackend interface and input types

**Files:**
- Create: `lib/data/types.ts`

-- [ ] **Step 1: Write DataBackend interface**

```typescript
// lib/data/types.ts

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
  // Authentication
  authenticate(username: string, password: string): Promise<OdooSessionInfo>;
  getSessionInfo(sessionId: string): Promise<OdooSessionInfo | null>;
  destroySession(sessionId: string): Promise<void>;

  // Generic call (for backward compat with direct odooCall usage)
  call(model: string, method: string, args: unknown[], kwargs?: Record<string, unknown>): Promise<unknown>;

  // Partners & Products
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

  // Quotations (sale.order)
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

  // Invoices (account.move)
  fetchInvoices(limit?: number, offset?: number): Promise<AccountMove[]>;
  fetchInvoiceById(id: number): Promise<AccountMove>;
  fetchInvoiceLines(invoiceId: number): Promise<AccountMoveLine[]>;
  postInvoice(id: number): Promise<boolean>;
  createInvoicesFromSaleOrder(orderId: number): Promise<number[]>;

  // Purchase Orders
  fetchPurchaseOrders(limit?: number, offset?: number): Promise<PurchaseOrder[]>;
  fetchPurchaseOrderById(id: number): Promise<PurchaseOrder>;
  fetchPurchaseOrderLines(orderId: number): Promise<PurchaseOrderLine[]>;
  confirmPurchaseOrder(id: number): Promise<boolean>;
  fetchPurchaseOrdersByOrigin(origin: string): Promise<PurchaseOrder[]>;
  createPurchaseOrderFromSaleOrder(saleOrderId: number): Promise<number>;

  // Deliveries (stock.picking)
  fetchDeliveries(limit?: number, offset?: number): Promise<StockPicking[]>;
  fetchDeliveryById(id: number): Promise<StockPicking>;
  fetchStockMoves(pickingId: number): Promise<StockMove[]>;
  validateDelivery(id: number): Promise<boolean>;
  setMoveDoneQuantity(moveId: number, quantity: number): Promise<boolean>;
  findInvoiceByOrigin(origin: string): Promise<{ id: number; name: string } | null>;
}
```

-- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: PASS

-- [ ] **Step 3: Commit**

```bash
git add lib/data/types.ts
git commit -m "feat: add DataBackend interface and input types"
```

---

### Task 2: Create OdooBackend class (Sales)

**Files:**
- Create: `lib/data/odoo/client.ts`
- Create: `lib/data/odoo/sale.ts`

-- [ ] **Step 1: Move odooCall to lib/data/odoo/client.ts**

Copy `lib/odoo/client.ts` content to `lib/data/odoo/client.ts`. The content is identical — just relocated.

```typescript
// lib/data/odoo/client.ts

export interface OdooCallParams {
  model: string;
  method: string;
  args: unknown[];
  kwargs: Record<string, unknown>;
}

export interface OdooCallResult<T> {
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: {
      name: string;
      message: string;
      debug: string;
      arguments: string[];
    };
  };
}

export async function odooCall<T>(
  model: string,
  method: string,
  args: unknown[] = [],
  kwargs: Record<string, unknown> = {},
  context?: Record<string, unknown>
): Promise<T> {
  const res = await fetch("/api/odoo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, method, args, kwargs, context }),
  });

  const data: OdooCallResult<T> = await res.json();

  if (data.error) {
    const msg =
      data.error.data?.message ||
      data.error.message ||
      "An unknown Odoo error occurred";
    throw new Error(msg);
  }

  return data.result as T;
}
```

-- [ ] **Step 2: Write OdooBackend sale methods**

Create `lib/data/odoo/sale.ts` with the sales portion of the OdooBackend. This wraps existing functions from `lib/odoo/sale.ts`.

```typescript
// lib/data/odoo/sale.ts

import { odooCall } from "./client";
import type { SaleOrder, SaleOrderLine } from "@/types/odoo";
import type { DataBackend, CreateQuotationInput, AddLineInput } from "../types";

const SALE_FIELDS = [
  "name", "state", "partner_id", "date_order", "validity_date",
  "order_line", "amount_untaxed", "amount_tax", "amount_total",
  "note", "invoice_ids", "picking_ids", "user_id", "activity_state", "client_order_ref",
  "payment_term_id",
];

const LINE_FIELDS = [
  "id", "order_id", "product_id", "name", "product_uom_qty",
  "price_unit", "price_subtotal", "discount", "tax_id", "x_delivery_time",
];

export const odooSale: Pick<DataBackend,
  "fetchQuotations" | "fetchQuotationById" | "fetchSaleOrderLines" |
  "createQuotation" | "updateQuotation" | "confirmQuotation" | "cancelQuotation" |
  "updateSaleOrderLine" | "deleteSaleOrderLine" | "addSaleOrderLine"
> = {
  async fetchQuotations(limit = 50, offset = 0) {
    return odooCall<SaleOrder[]>("sale.order", "search_read", [[]], {
      fields: SALE_FIELDS,
      limit,
      offset,
      order: "id desc",
    });
  },

  async fetchQuotationById(id: number) {
    const results = await odooCall<SaleOrder[]>("sale.order", "search_read", [[["id", "=", id]]], {
      fields: SALE_FIELDS,
      limit: 1,
    });
    if (!results.length) throw new Error("Quotation not found");
    return results[0];
  },

  async fetchSaleOrderLines(orderId: number) {
    return odooCall<SaleOrderLine[]>("sale.order.line", "search_read", [[["order_id", "=", orderId]]], {
      fields: LINE_FIELDS,
      order: "id",
    });
  },

  async createQuotation(data: CreateQuotationInput) {
    const orderLineData = data.order_line.map((line) => [
      0, 0, {
        product_id: line.product_id,
        name: line.name,
        product_uom_qty: line.product_uom_qty,
        price_unit: line.price_unit,
        discount: line.discount || 0,
        x_delivery_time: line.x_delivery_time || "",
      },
    ]);

    return odooCall<number>("sale.order", "create", [{
      partner_id: data.partner_id,
      date_order: data.date_order,
      validity_date: data.validity_date,
      note: data.note,
      client_order_ref: data.client_order_ref,
      order_line: orderLineData,
    }]);
  },

  async updateQuotation(id: number, data: Partial<SaleOrder>) {
    return odooCall<boolean>("sale.order", "write", [[id], data]);
  },

  async confirmQuotation(id: number) {
    return odooCall<boolean>("sale.order", "action_confirm", [[id]]);
  },

  async cancelQuotation(id: number) {
    return odooCall<boolean>("sale.order", "action_cancel", [[id]]);
  },

  async updateSaleOrderLine(lineId: number, data: Partial<SaleOrderLine>) {
    return odooCall<boolean>("sale.order.line", "write", [[lineId], data]);
  },

  async deleteSaleOrderLine(lineId: number) {
    return odooCall<boolean>("sale.order.line", "unlink", [[lineId]]);
  },

  async addSaleOrderLine(orderId: number, line: AddLineInput) {
    return odooCall<number>("sale.order.line", "create", [{
      order_id: orderId,
      product_id: line.product_id,
      name: line.name,
      product_uom_qty: line.product_uom_qty,
      price_unit: line.price_unit,
      discount: line.discount || 0,
    }]);
  },
};
```

-- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: PASS

-- [ ] **Step 4: Commit**

```bash
git add lib/data/odoo/client.ts lib/data/odoo/sale.ts
git commit -m "feat: add OdooBackend sale methods"
```

---

### Task 3: Create OdooBackend class (Invoice, Purchase, Stock, Partner)

**Files:**
- Create: `lib/data/odoo/invoice.ts`
- Create: `lib/data/odoo/purchase.ts`
- Create: `lib/data/odoo/stock.ts`
- Create: `lib/data/odoo/partner.ts`

-- [ ] **Step 1: Write lib/data/odoo/invoice.ts**

```typescript
// lib/data/odoo/invoice.ts

import { odooCall } from "./client";
import type { AccountMove, AccountMoveLine } from "@/types/odoo";
import type { DataBackend } from "../types";

const INVOICE_FIELDS = [
  "id", "name", "move_type", "state", "partner_id",
  "invoice_date", "invoice_date_due", "invoice_line_ids",
  "amount_untaxed", "amount_tax", "amount_total", "payment_state",
  "narration", "invoice_origin",
  "invoice_payment_term_id",
];

const LINE_FIELDS = [
  "id", "move_id", "product_id", "name", "quantity",
  "price_unit", "price_subtotal", "discount", "tax_ids", "x_delivery_time",
];

export const odooInvoice: Pick<DataBackend,
  "fetchInvoices" | "fetchInvoiceById" | "fetchInvoiceLines" |
  "postInvoice" | "createInvoicesFromSaleOrder"
> = {
  async fetchInvoices(limit = 50, offset = 0) {
    return odooCall<AccountMove[]>("account.move", "search_read", [[["move_type", "=", "out_invoice"]]], {
      fields: INVOICE_FIELDS,
      limit,
      offset,
      order: "id desc",
    });
  },

  async fetchInvoiceById(id: number) {
    const results = await odooCall<AccountMove[]>("account.move", "search_read", [[["id", "=", id]]], {
      fields: INVOICE_FIELDS,
      limit: 1,
    });
    if (!results.length) throw new Error("Invoice not found");
    return results[0];
  },

  async fetchInvoiceLines(invoiceId: number) {
    return odooCall<AccountMoveLine[]>("account.move.line", "search_read", [[["move_id", "=", invoiceId], ["display_type", "=", "product"]]], {
      fields: LINE_FIELDS,
      order: "id",
    });
  },

  async postInvoice(id: number) {
    return odooCall<boolean>("account.move", "action_post", [[id]]);
  },

  async createInvoicesFromSaleOrder(orderId: number) {
    const wizId = await odooCall<number>("sale.advance.payment.inv", "create", [{
      advance_payment_method: "delivered",
      sale_order_ids: [[6, 0, [orderId]]],
    }], {}, {
      active_ids: [orderId],
      active_model: "sale.order",
    });
    await odooCall<unknown>("sale.advance.payment.inv", "create_invoices", [[wizId]], {}, {
      active_ids: [orderId],
      active_model: "sale.order",
    });
    const invoices = await odooCall<{ invoice_ids?: number[] }[]>("sale.order", "read", [[orderId]], {
      fields: ["invoice_ids"],
    });
    const invoiceIds = invoices[0]?.invoice_ids || [];
    if (!invoiceIds.length) throw new Error("No invoices were created");

    const soLines = await odooCall<{ id: number; x_delivery_time?: string; product_id: [number, string] }[]>(
      "sale.order.line", "search_read",
      [[["order_id", "=", orderId]]],
      { fields: ["id", "x_delivery_time", "product_id"] }
    );

    for (const invId of invoiceIds) {
      const invLines = await odooCall<{ id: number; product_id: [number, string]; sale_line_ids?: [number, string][] }[]>(
        "account.move.line", "search_read",
        [[["move_id", "=", invId]]],
        { fields: ["id", "product_id", "sale_line_ids"] }
      );

      for (const soLine of soLines) {
        const dt = soLine.x_delivery_time;
        if (!dt) continue;
        const soProductId = soLine.product_id?.[0];

        const invLine = invLines.find((il) => {
          const saleLinks = il.sale_line_ids;
          if (saleLinks?.some(([sid]) => sid === soLine.id)) return true;
          if (soProductId) {
            const ilProductId = il.product_id?.[0];
            if (ilProductId === soProductId) return true;
          }
          return false;
        });

        if (invLine) {
          await odooCall<boolean>("account.move.line", "write", [
            [invLine.id],
            { x_delivery_time: dt },
          ]);
        }
      }
    }

    return invoiceIds;
  },
};
```

-- [ ] **Step 2: Write lib/data/odoo/purchase.ts**

```typescript
// lib/data/odoo/purchase.ts

import { odooCall } from "./client";
import type { PurchaseOrder, PurchaseOrderLine } from "@/types/odoo";
import type { DataBackend } from "../types";
import { odooSale } from "./sale";

const PO_FIELDS = [
  "id", "name", "state", "partner_id", "date_order",
  "date_planned", "order_line", "amount_untaxed", "amount_tax", "amount_total",
  "notes", "origin",
];

const PO_LINE_FIELDS = [
  "id", "order_id", "product_id", "name", "product_qty",
  "price_unit", "price_subtotal", "product_uom", "taxes_id",
];

export const odooPurchase: Pick<DataBackend,
  "fetchPurchaseOrders" | "fetchPurchaseOrderById" | "fetchPurchaseOrderLines" |
  "confirmPurchaseOrder" | "fetchPurchaseOrdersByOrigin" | "createPurchaseOrderFromSaleOrder"
> = {
  async fetchPurchaseOrders(limit = 50, offset = 0) {
    return odooCall<PurchaseOrder[]>("purchase.order", "search_read", [[]], {
      fields: PO_FIELDS,
      limit,
      offset,
      order: "id desc",
    });
  },

  async fetchPurchaseOrderById(id: number) {
    const results = await odooCall<PurchaseOrder[]>("purchase.order", "search_read", [[["id", "=", id]]], {
      fields: PO_FIELDS,
      limit: 1,
    });
    if (!results.length) throw new Error("Purchase order not found");
    return results[0];
  },

  async fetchPurchaseOrderLines(orderId: number) {
    return odooCall<PurchaseOrderLine[]>("purchase.order.line", "search_read", [[["order_id", "=", orderId]]], {
      fields: PO_LINE_FIELDS,
      order: "id",
    });
  },

  async confirmPurchaseOrder(id: number) {
    return odooCall<boolean>("purchase.order", "button_confirm", [[id]]);
  },

  async fetchPurchaseOrdersByOrigin(origin: string) {
    return odooCall<PurchaseOrder[]>("purchase.order", "search_read", [[["origin", "=", origin]]], {
      fields: PO_FIELDS,
      order: "id desc",
    });
  },

  async createPurchaseOrderFromSaleOrder(saleOrderId: number) {
    const saleOrder = await odooSale.fetchQuotationById(saleOrderId);
    const saleLines = await odooSale.fetchSaleOrderLines(saleOrderId);

    if (!saleOrder.partner_id?.[0]) {
      throw new Error("Sale order partner is required to create a purchase order");
    }

    const purchaseOrderId = await odooCall<number>("purchase.order", "create", [{
      partner_id: saleOrder.partner_id[0],
      origin: saleOrder.name,
    }]);

    for (const line of saleLines) {
      if (!line.product_id?.[0]) continue;
      await odooCall<number>("purchase.order.line", "create", [{
        order_id: purchaseOrderId,
        product_id: line.product_id[0],
        name: line.name,
        product_qty: line.product_uom_qty,
        price_unit: line.price_unit,
      }]);
    }

    return purchaseOrderId;
  },
};
```

-- [ ] **Step 3: Write lib/data/odoo/stock.ts**

```typescript
// lib/data/odoo/stock.ts

import { odooCall } from "./client";
import type { StockPicking, StockMove } from "@/types/odoo";
import type { DataBackend } from "../types";

const PICKING_FIELDS = [
  "id", "name", "state", "partner_id", "scheduled_date",
  "date_done", "move_ids_without_package", "origin", "picking_type_id",
];

const MOVE_FIELDS = [
  "id", "picking_id", "product_id", "name", "product_uom_qty",
  "quantity", "product_uom",
];

export const odooStock: Pick<DataBackend,
  "fetchDeliveries" | "fetchDeliveryById" | "fetchStockMoves" |
  "validateDelivery" | "setMoveDoneQuantity" | "findInvoiceByOrigin"
> = {
  async fetchDeliveries(limit = 50, offset = 0) {
    return odooCall<StockPicking[]>("stock.picking", "search_read", [[["picking_type_code", "=", "outgoing"]]], {
      fields: PICKING_FIELDS,
      limit,
      offset,
      order: "id desc",
    });
  },

  async fetchDeliveryById(id: number) {
    const results = await odooCall<StockPicking[]>("stock.picking", "search_read", [[["id", "=", id]]], {
      fields: PICKING_FIELDS,
      limit: 1,
    });
    if (!results.length) throw new Error("Delivery not found");
    return results[0];
  },

  async fetchStockMoves(pickingId: number) {
    return odooCall<StockMove[]>("stock.move", "search_read", [[["picking_id", "=", pickingId]]], {
      fields: MOVE_FIELDS,
      order: "id",
    });
  },

  async validateDelivery(id: number) {
    return odooCall<boolean>("stock.picking", "button_validate", [[id]]);
  },

  async setMoveDoneQuantity(moveId: number, quantity: number) {
    return odooCall<boolean>("stock.move", "write", [[moveId], { quantity }]);
  },

  async findInvoiceByOrigin(origin: string) {
    const results = await odooCall<{ id: number; name: string }[]>(
      "account.move",
      "search_read",
      [[["invoice_origin", "=", origin], ["move_type", "=", "out_invoice"]]],
      { fields: ["id", "name"], limit: 1 }
    );
    return results.length > 0 ? results[0] : null;
  },
};
```

-- [ ] **Step 4: Write lib/data/odoo/partner.ts**

```typescript
// lib/data/odoo/partner.ts

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
```

-- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: PASS

-- [ ] **Step 6: Commit**

```bash
git add lib/data/odoo/invoice.ts lib/data/odoo/purchase.ts lib/data/odoo/stock.ts lib/data/odoo/partner.ts
git commit -m "feat: add OdooBackend invoice, purchase, stock, partner methods"
```

---

### Task 4: Create OdooBackend class (composite and auth)

**Files:**
- Create: `lib/data/odoo/backend.ts`

-- [ ] **Step 1: Write composite OdooBackend class**

```typescript
// lib/data/odoo/backend.ts

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
    // Authentication is handled by app/api/auth/login/route.ts
    // This method is a pass-through since auth goes through /api/auth
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

  // Partners & Products
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

  // Quotations
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

  // Invoices
  fetchInvoices = odooInvoice.fetchInvoices;
  fetchInvoiceById = odooInvoice.fetchInvoiceById;
  fetchInvoiceLines = odooInvoice.fetchInvoiceLines;
  postInvoice = odooInvoice.postInvoice;
  createInvoicesFromSaleOrder = odooInvoice.createInvoicesFromSaleOrder;

  // Purchase Orders
  fetchPurchaseOrders = odooPurchase.fetchPurchaseOrders;
  fetchPurchaseOrderById = odooPurchase.fetchPurchaseOrderById;
  fetchPurchaseOrderLines = odooPurchase.fetchPurchaseOrderLines;
  confirmPurchaseOrder = odooPurchase.confirmPurchaseOrder;
  fetchPurchaseOrdersByOrigin = odooPurchase.fetchPurchaseOrdersByOrigin;
  createPurchaseOrderFromSaleOrder = odooPurchase.createPurchaseOrderFromSaleOrder;

  // Deliveries
  fetchDeliveries = odooStock.fetchDeliveries;
  fetchDeliveryById = odooStock.fetchDeliveryById;
  fetchStockMoves = odooStock.fetchStockMoves;
  validateDelivery = odooStock.validateDelivery;
  setMoveDoneQuantity = odooStock.setMoveDoneQuantity;
  findInvoiceByOrigin = odooStock.findInvoiceByOrigin;
}
```

-- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: PASS

-- [ ] **Step 3: Commit**

```bash
git add lib/data/odoo/backend.ts
git commit -m "feat: add composite OdooBackend class"
```

---

### Task 5: Create backend factory and index

**Files:**
- Create: `lib/data/backend.ts`
- Create: `lib/data/index.ts`

-- [ ] **Step 1: Write backend factory**

```typescript
// lib/data/backend.ts

import type { DataBackend } from "./types";
import { OdooBackend } from "./odoo/backend";

let cached: DataBackend | null = null;

export function getBackend(): DataBackend {
  if (cached) return cached;

  const type = process.env.BACKEND || "odoo";

  if (type === "sqlite") {
    // Dynamically import to avoid requiring better-sqlite3 in odoo mode
    throw new Error("SqliteBackend not yet implemented");
  } else {
    cached = new OdooBackend();
  }

  return cached;
}
```

-- [ ] **Step 2: Write index**

```typescript
// lib/data/index.ts

export { getBackend } from "./backend";
export type { DataBackend, CreateQuotationInput, AddLineInput } from "./types";
export { odooCall } from "./odoo/client";
```

-- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: PASS

-- [ ] **Step 4: Commit**

```bash
git add lib/data/backend.ts lib/data/index.ts
git commit -m "feat: add backend factory and index"
```

---

### Task 6: Update all UI imports to use lib/data

**Files:**
- Modify: `app/page.tsx:6`
- Modify: `app/quotations/page.tsx:7`
- Modify: `app/quotations/[id]/page.tsx:6-9,11`
- Modify: `app/quotations/new/page.tsx:5-6`
- Modify: `app/invoices/page.tsx:6`
- Modify: `app/invoices/[id]/page.tsx:6-7,10-11`
- Modify: `app/proforma/page.tsx:7`
- Modify: `app/proforma/[id]/page.tsx:6-7,9,12`
- Modify: `app/purchase-orders/page.tsx:6`
- Modify: `app/purchase-orders/[id]/page.tsx:6-7,9-10`
- Modify: `app/delivery/page.tsx:5`
- Modify: `app/delivery/[id]/page.tsx:6-7,10`
- Modify: `app/packing-lists/page.tsx:5`
- Modify: `app/packing-lists/[id]/page.tsx:6-7,10`
- Modify: `app/packing-list/[id]/page.tsx:6,9`
- Modify: `app/customers/page.tsx:7`
- Modify: `app/customers/[id]/page.tsx:6`
- Modify: `app/customers/new/page.tsx:5`
- Modify: `app/products/page.tsx:7`
- Modify: `app/products/[id]/page.tsx:6`
- Modify: `app/products/new/page.tsx:5`
- Modify: `app/settings/page.tsx:17` (uses odoo settings functions)
- Modify: `components/layout/AuthProvider.tsx:6` (imports checkSession from auth)
- Modify: `components/layout/Sidebar.tsx:9` (imports logout from auth)

-- [ ] **Step 1: Update app/quotations/page.tsx**

Replace:
```typescript
import { fetchQuotations } from "@/lib/odoo/sale";
```
With:
```typescript
import { getBackend } from "@/lib/data";
```

Replace `fetchQuotations()` call with:
```typescript
const backend = getBackend();
const data = await backend.fetchQuotations();
```

-- [ ] **Step 2: Update app/quotations/[id]/page.tsx**

Replace:
```typescript
import { fetchQuotationById, fetchSaleOrderLines, confirmQuotation, updateSaleOrderLine, deleteSaleOrderLine, addSaleOrderLine, updateQuotation } from "@/lib/odoo/sale";
import { createInvoicesFromSaleOrder } from "@/lib/odoo/invoice";
import { createPurchaseOrderFromSaleOrder, fetchPurchaseOrdersByOrigin } from "@/lib/odoo/purchase";
import { fetchProducts, fetchCustomerById, searchPartners } from "@/lib/odoo/partner";
import { fetchCompanySettings, fetchBankDetails, fetchPrintSettings } from "@/lib/odoo/settings";
```

With:
```typescript
import { getBackend } from "@/lib/data";
import { fetchCompanySettings, fetchBankDetails, fetchPrintSettings } from "@/lib/odoo/settings";
```

Replace all direct function calls with `const backend = getBackend();` then `backend.fetchQuotationById(id)` etc.

-- [ ] **Step 3: Update app/quotations/new/page.tsx**

Replace:
```typescript
import { createQuotation } from "@/lib/odoo/sale";
import { fetchCustomers, fetchProducts, searchPartners, createCustomer, createProduct } from "@/lib/odoo/partner";
```
With:
```typescript
import { getBackend } from "@/lib/data";
```

Replace direct calls with `backend.createQuotation(...)`, `backend.fetchCustomers()`, etc.

-- [ ] **Step 4: Update all list pages (invoices, proforma, purchase-orders, delivery, packing-lists, customers, products)**

For each list page (invoices/page.tsx, proforma/page.tsx, purchase-orders/page.tsx, delivery/page.tsx, packing-lists/page.tsx, customers/page.tsx, products/page.tsx):

Replace direct import like `import { fetchInvoices } from "@/lib/odoo/invoice"` with:
```typescript
import { getBackend } from "@/lib/data";
```

Replace function call like `const data = await fetchInvoices()` with:
```typescript
const backend = getBackend();
const data = await backend.fetchInvoices();
```

Replace type import like `import type { AccountMove } from "@/types/odoo"` — keep these, they don't change.

-- [ ] **Step 5: Update all detail pages (invoices/[id], proforma/[id], purchase-orders/[id], delivery/[id], packing-lists/[id], packing-list/[id])**

For each detail page, replace direct imports like:
```typescript
import { fetchInvoiceById, fetchInvoiceLines, postInvoice } from "@/lib/odoo/invoice";
import { odooCall } from "@/lib/odoo/client";
import { fetchCustomerById } from "@/lib/odoo/partner";
import { fetchCompanySettings, fetchBankDetails, fetchPrintSettings } from "@/lib/odoo/settings";
```
With:
```typescript
import { getBackend } from "@/lib/data";
import { fetchCompanySettings, fetchBankDetails, fetchPrintSettings } from "@/lib/odoo/settings";
```

Replace `odooCall(model, method, args, kwargs)` calls with `backend.call(model, method, args, kwargs)`.

Replace `fetchCustomerById(id)` with `backend.fetchCustomerById(id)`, etc.

-- [ ] **Step 6: Update detail pages (customers/[id], products/[id], customers/new, products/new)**

Replace:
```typescript
import { fetchCustomerById, updateCustomer } from "@/lib/odoo/partner";
```
With:
```typescript
import { getBackend } from "@/lib/data";
```

Replace `fetchCustomerById(id)` with `backend.fetchCustomerById(id)`, etc.

-- [ ] **Step 7: Update app/page.tsx**

Replace:
```typescript
import { odooCall } from "@/lib/odoo/client";
```
With:
```typescript
import { getBackend } from "@/lib/data";
```

Replace `odooCall(model, method, args, kwargs)` with `backend.call(model, method, args, kwargs)`.

-- [ ] **Step 8: Update components/layout/AuthProvider.tsx**

Replace:
```typescript
import { checkSession } from "@/lib/odoo/auth";
```
With:
```typescript
import { checkSession } from "@/lib/odoo/auth";  // Keep — auth uses /api/auth, not the data backend
```
No change needed — auth goes through `/api/auth`, not the DataBackend.

-- [ ] **Step 9: Update components/layout/Sidebar.tsx**

Replace:
```typescript
import { logout } from "@/lib/odoo/auth";
```
With:
```typescript
import { logout } from "@/lib/odoo/auth";  // Keep — auth uses /api/auth
```
No change needed.

-- [ ] **Step 10: Update app/settings/page.tsx**

Keep the settings imports from `@/lib/odoo/settings` unchanged. Settings are Odoo-specific (res.company, ir.config_parameter) and will be handled by the direct `odooCall` / `call()` method on the backend or kept as-is for now.

-- [ ] **Step 11: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: PASS (may show warnings about unused imports — fix any that are compiler errors)

-- [ ] **Step 12: Verify dev server starts**

```bash
npm run dev
# Check http://localhost:3000 loads without runtime errors
```
Expected: Pages load, data fetches from Odoo work as before.

-- [ ] **Step 13: Commit**

```bash
git add app/
git commit -m "refactor: update UI imports to use DataBackend"
```

---

### Task 7: Add backward compatibility shims in lib/odoo/

**Files:**
- Modify: `lib/odoo/client.ts`
- Modify: `lib/odoo/sale.ts`
- Modify: `lib/odoo/invoice.ts`
- Modify: `lib/odoo/purchase.ts`
- Modify: `lib/odoo/stock.ts`
- Modify: `lib/odoo/partner.ts`

-- [ ] **Step 1: Update lib/odoo/client.ts to re-export**

Replace entire content with:
```typescript
// Re-export from lib/data for backward compat
export { odooCall } from "../data/odoo/client";
export type { OdooCallParams, OdooCallResult } from "../data/odoo/client";
```

-- [ ] **Step 2: Update lib/odoo/sale.ts to re-export**

Replace entire content with:
```typescript
// Re-export from lib/data for backward compat
export { odooSale as fetchQuotations } from "../data/odoo/sale";
// Note: for individual exports, use the odooSale object
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
```

-- [ ] **Step 3: Update lib/odoo/invoice.ts to re-export**

Replace entire content with:
```typescript
import { odooInvoice } from "../data/odoo/invoice";
export const {
  fetchInvoices,
  fetchInvoiceById,
  fetchInvoiceLines,
  postInvoice,
  createInvoicesFromSaleOrder,
} = odooInvoice;
```

-- [ ] **Step 4: Update lib/odoo/purchase.ts to re-export**

Replace entire content with:
```typescript
import { odooPurchase } from "../data/odoo/purchase";
export const {
  fetchPurchaseOrders,
  fetchPurchaseOrderById,
  fetchPurchaseOrderLines,
  confirmPurchaseOrder,
  fetchPurchaseOrdersByOrigin,
  createPurchaseOrderFromSaleOrder,
} = odooPurchase;
```

-- [ ] **Step 5: Update lib/odoo/stock.ts to re-export**

Replace entire content with:
```typescript
import { odooStock } from "../data/odoo/stock";
export const {
  fetchDeliveries,
  fetchDeliveryById,
  fetchStockMoves,
  validateDelivery,
  setMoveDoneQuantity,
  findInvoiceByOrigin,
} = odooStock;
```

-- [ ] **Step 6: Update lib/odoo/partner.ts to re-export**

Replace entire content with:
```typescript
import { odooPartner } from "../data/odoo/partner";
export const {
  fetchCustomers,
  fetchVendors,
  fetchProducts,
  searchPartners,
  fetchCustomerById,
  fetchProductById,
  createCustomer,
  updateCustomer,
  createProduct,
  updateProduct,
} = odooPartner;
```

-- [ ] **Step 7: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: PASS

-- [ ] **Step 8: Verify lint**

```bash
npm run lint
```
Expected: No new errors (baseline may have existing warnings)

-- [ ] **Step 9: Commit**

```bash
git add lib/odoo/
git commit -m "refactor: add backward compat shims in lib/odoo"
```

---

### Task 8: Install SQLite dependencies

**Files:**
- Modify: `package.json`

-- [ ] **Step 1: Install dependencies**

```bash
npm install drizzle-orm better-sqlite3
npm install -D drizzle-kit @types/better-sqlite3
```
Expected: Packages installed successfully. If `better-sqlite3` fails to compile native addon, ensure `build-essential` and `python3` are installed:
```bash
sudo apt-get install -y build-essential python3
```

-- [ ] **Step 2: Verify drizzle-orm imports work**

Run a quick check:
```bash
node -e "require('drizzle-orm')"
```
Expected: No error

-- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add drizzle-orm and better-sqlite3"
```

---

### Task 9: Create SQLite schema

**Files:**
- Create: `lib/data/sqlite/schema.ts`

-- [ ] **Step 1: Write schema**

```typescript
// lib/data/sqlite/schema.ts

import { sqliteTable, integer, real, text } from "drizzle-orm/sqlite-core";

export const sequences = sqliteTable("sequences", {
  name: text("name").primaryKey(),
  currentValue: integer("current_value").default(0),
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
});

export const partners = sqliteTable("partners", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  street: text("street"),
  street2: text("street2"),
  city: text("city"),
  stateId: integer("state_id"),
  zip: text("zip"),
  countryId: integer("country_id"),
  vat: text("vat"),
  xTin: text("x_tin"),
  isCompany: integer("is_company", { mode: "boolean" }).default(false),
  customerRank: integer("customer_rank").default(0),
  supplierRank: integer("supplier_rank").default(0),
});

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  defaultCode: text("default_code"),
  listPrice: real("list_price").default(0),
  standardPrice: real("standard_price").default(0),
  type: text("type").default("consu"),
  saleOk: integer("sale_ok", { mode: "boolean" }).default(true),
  purchaseOk: integer("purchase_ok", { mode: "boolean" }).default(false),
});

export const saleOrders = sqliteTable("sale_orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  state: text("state").default("draft"),
  partnerId: integer("partner_id").references(() => partners.id),
  dateOrder: text("date_order"),
  validityDate: text("validity_date"),
  amountUntaxed: real("amount_untaxed").default(0),
  amountTax: real("amount_tax").default(0),
  amountTotal: real("amount_total").default(0),
  note: text("note"),
  clientOrderRef: text("client_order_ref"),
  paymentTermId: integer("payment_term_id"),
});

export const saleOrderLines = sqliteTable("sale_order_lines", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").references(() => saleOrders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id),
  name: text("name"),
  productUomQty: real("product_uom_qty").default(0),
  priceUnit: real("price_unit").default(0),
  priceSubtotal: real("price_subtotal").default(0),
  discount: real("discount").default(0),
  xDeliveryTime: text("x_delivery_time"),
});

export const accountMoves = sqliteTable("account_moves", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  moveType: text("move_type").default("out_invoice"),
  state: text("state").default("draft"),
  partnerId: integer("partner_id").references(() => partners.id),
  invoiceDate: text("invoice_date"),
  invoiceDateDue: text("invoice_date_due"),
  amountUntaxed: real("amount_untaxed").default(0),
  amountTax: real("amount_tax").default(0),
  amountTotal: real("amount_total").default(0),
  paymentState: text("payment_state"),
  narration: text("narration"),
  invoiceOrigin: text("invoice_origin"),
  invoicePaymentTermId: integer("invoice_payment_term_id"),
});

export const accountMoveLines = sqliteTable("account_move_lines", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  moveId: integer("move_id").references(() => accountMoves.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id),
  name: text("name"),
  quantity: real("quantity").default(0),
  priceUnit: real("price_unit").default(0),
  priceSubtotal: real("price_subtotal").default(0),
  discount: real("discount").default(0),
  xDeliveryTime: text("x_delivery_time"),
});

export const purchaseOrders = sqliteTable("purchase_orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  state: text("state").default("draft"),
  partnerId: integer("partner_id").references(() => partners.id),
  dateOrder: text("date_order"),
  datePlanned: text("date_planned"),
  amountUntaxed: real("amount_untaxed").default(0),
  amountTax: real("amount_tax").default(0),
  amountTotal: real("amount_total").default(0),
  notes: text("notes"),
  origin: text("origin"),
});

export const purchaseOrderLines = sqliteTable("purchase_order_lines", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").references(() => purchaseOrders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id),
  name: text("name"),
  productQty: real("product_qty").default(0),
  priceUnit: real("price_unit").default(0),
  priceSubtotal: real("price_subtotal").default(0),
});

export const stockPickings = sqliteTable("stock_pickings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  state: text("state").default("draft"),
  partnerId: integer("partner_id").references(() => partners.id),
  scheduledDate: text("scheduled_date"),
  dateDone: text("date_done"),
  origin: text("origin"),
  pickingTypeId: integer("picking_type_id"),
});

export const stockMoves = sqliteTable("stock_moves", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  pickingId: integer("picking_id").references(() => stockPickings.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id),
  name: text("name"),
  productUomQty: real("product_uom_qty").default(0),
  quantityDone: real("quantity_done").default(0),
});
```

-- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: PASS

-- [ ] **Step 3: Commit**

```bash
git add lib/data/sqlite/schema.ts
git commit -m "feat: add SQLite schema with Drizzle"
```

---

### Task 10: Create SQLite database connection

**Files:**
- Create: `lib/data/sqlite/db.ts`

-- [ ] **Step 1: Write database connection**

```typescript
// lib/data/sqlite/db.ts

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";

const DB_PATH = process.env.SQLITE_PATH || path.join(process.cwd(), "odooflow.db");

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

export function getNextId(seqName: string): number {
  const stmt = sqlite.prepare(
    "INSERT INTO sequences (name, current_value) VALUES (?, 1) ON CONFLICT(name) DO UPDATE SET current_value = current_value + 1 RETURNING current_value"
  );
  const result = stmt.get(seqName) as { current_value: number };
  return result.current_value;
}

export function generateDocNumber(prefix: string, seqName: string): string {
  const id = getNextId(seqName);
  return `${prefix}${String(id).padStart(4, "0")}`;
}
```

-- [ ] **Step 2: Create Drizzle config for migrations**

Create `drizzle.config.ts` at project root:
```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/data/sqlite/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: "./odooflow.db",
  },
});
```

-- [ ] **Step 3: Generate initial migration**

```bash
npx drizzle-kit generate
```
Expected: Migration files created in `drizzle/` directory.

-- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: PASS

-- [ ] **Step 5: Commit**

```bash
git add lib/data/sqlite/db.ts drizzle.config.ts drizzle/
git commit -m "feat: add SQLite database connection and initial migration"
```

---

### Task 11: Create SQLite partner backend

**Files:**
- Create: `lib/data/sqlite/partner.ts`

-- [ ] **Step 1: Write partner backend**

```typescript
// lib/data/sqlite/partner.ts

import type { ResPartner, ProductProduct } from "@/types/odoo";
import type { DataBackend } from "../types";
import { db, getNextId } from "./db";
import { partners, products } from "./schema";
import { eq, ilike } from "drizzle-orm";

export const sqlitePartner: Pick<DataBackend,
  "fetchCustomers" | "fetchVendors" | "fetchProducts" |
  "searchPartners" | "fetchCustomerById" | "fetchProductById" |
  "createCustomer" | "updateCustomer" | "createProduct" | "updateProduct"
> = {
  async fetchCustomers(limit = 100) {
    const rows = await db.select().from(partners)
      .where(eq(partners.customerRank, 1)) // drizzle-orm: use sql for >
      .orderBy(partners.name)
      .limit(limit);
    // Since customer_rank > 0 check isn't trivially done with eq, use a callback workaround
    // For simplicity, filter in JS
    return rows.filter(r => r.customerRank > 0).slice(0, limit).map(toResPartner);
  },

  async fetchVendors(limit = 100) {
    const rows = await db.select().from(partners)
      .orderBy(partners.name)
      .limit(limit);
    return rows.filter(r => r.supplierRank > 0).slice(0, limit).map(toResPartner);
  },

  async fetchProducts(limit = 200) {
    const rows = await db.select().from(products)
      .where(eq(products.saleOk, true))
      .orderBy(products.defaultCode)
      .limit(limit);
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      default_code: r.defaultCode || false,
      list_price: r.listPrice,
      standard_price: r.standardPrice,
      type: r.type as "consu" | "service" | "combo",
      uom_id: [0, ""],
      categ_id: [0, ""],
      sale_ok: r.saleOk,
      purchase_ok: r.purchaseOk,
    }));
  },

  async searchPartners(query: string, limit = 20) {
    const pattern = `%${query}%`;
    const rows = await db.select().from(partners)
      .where(ilike(partners.name, pattern))
      .orderBy(partners.name)
      .limit(limit);
    return rows.map(toResPartner);
  },

  async fetchCustomerById(id: number) {
    const rows = await db.select().from(partners).where(eq(partners.id, id)).limit(1);
    return rows.length ? toResPartner(rows[0]) : null;
  },

  async fetchProductById(id: number) {
    const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!rows.length) return null;
    const r = rows[0];
    return {
      id: r.id,
      name: r.name,
      default_code: r.defaultCode || false,
      list_price: r.listPrice,
      standard_price: r.standardPrice,
      type: r.type as "consu" | "service" | "combo",
      uom_id: [0, ""],
      categ_id: [0, ""],
      sale_ok: r.saleOk,
      purchase_ok: r.purchaseOk,
    };
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
    is_company: r.isCompany,
    customer_rank: r.customerRank,
    supplier_rank: r.supplierRank,
  };
}
```

-- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: PASS

-- [ ] **Step 3: Commit**

```bash
git add lib/data/sqlite/partner.ts
git commit -m "feat: add SQLite partner/product backend"
```

---

### Task 12: Create SQLite sale backend

**Files:**
- Create: `lib/data/sqlite/sale.ts`

-- [ ] **Step 1: Write sale backend**

```typescript
// lib/data/sqlite/sale.ts

import type { SaleOrder, SaleOrderLine } from "@/types/odoo";
import type { DataBackend, CreateQuotationInput, AddLineInput } from "../types";
import { db, generateDocNumber } from "./db";
import { saleOrders, saleOrderLines, partners, products } from "./schema";
import { eq, desc } from "drizzle-orm";

export const sqliteSale: Pick<DataBackend,
  "fetchQuotations" | "fetchQuotationById" | "fetchSaleOrderLines" |
  "createQuotation" | "updateQuotation" | "confirmQuotation" | "cancelQuotation" |
  "updateSaleOrderLine" | "deleteSaleOrderLine" | "addSaleOrderLine"
> = {
  async fetchQuotations(limit = 50, offset = 0) {
    const rows = await db
      .select({
        id: saleOrders.id,
        name: saleOrders.name,
        state: saleOrders.state,
        partnerId: saleOrders.partnerId,
        partnerName: partners.name,
        dateOrder: saleOrders.dateOrder,
        validityDate: saleOrders.validityDate,
        amountUntaxed: saleOrders.amountUntaxed,
        amountTax: saleOrders.amountTax,
        amountTotal: saleOrders.amountTotal,
        note: saleOrders.note,
        clientOrderRef: saleOrders.clientOrderRef,
        paymentTermId: saleOrders.paymentTermId,
      })
      .from(saleOrders)
      .leftJoin(partners, eq(saleOrders.partnerId, partners.id))
      .orderBy(desc(saleOrders.id))
      .limit(limit)
      .offset(offset);

    return rows.map(toSaleOrder);
  },

  async fetchQuotationById(id: number) {
    const rows = await db
      .select({
        id: saleOrders.id,
        name: saleOrders.name,
        state: saleOrders.state,
        partnerId: saleOrders.partnerId,
        partnerName: partners.name,
        dateOrder: saleOrders.dateOrder,
        validityDate: saleOrders.validityDate,
        amountUntaxed: saleOrders.amountUntaxed,
        amountTax: saleOrders.amountTax,
        amountTotal: saleOrders.amountTotal,
        note: saleOrders.note,
        clientOrderRef: saleOrders.clientOrderRef,
        paymentTermId: saleOrders.paymentTermId,
      })
      .from(saleOrders)
      .leftJoin(partners, eq(saleOrders.partnerId, partners.id))
      .where(eq(saleOrders.id, id))
      .limit(1);

    if (!rows.length) throw new Error("Quotation not found");
    return toSaleOrder(rows[0]);
  },

  async fetchSaleOrderLines(orderId: number) {
    const rows = await db
      .select({
        id: saleOrderLines.id,
        orderId: saleOrderLines.orderId,
        productId: saleOrderLines.productId,
        productName: products.name,
        name: saleOrderLines.name,
        productUomQty: saleOrderLines.productUomQty,
        priceUnit: saleOrderLines.priceUnit,
        priceSubtotal: saleOrderLines.priceSubtotal,
        discount: saleOrderLines.discount,
        xDeliveryTime: saleOrderLines.xDeliveryTime,
      })
      .from(saleOrderLines)
      .leftJoin(products, eq(saleOrderLines.productId, products.id))
      .where(eq(saleOrderLines.orderId, orderId))
      .orderBy(saleOrderLines.id);

    return rows.map((r) => ({
      id: r.id,
      order_id: [r.orderId, ""],
      product_id: r.productId ? [r.productId, r.productName || ""] : [0, r.name],
      name: r.name || "",
      product_uom_qty: r.productUomQty,
      price_unit: r.priceUnit,
      price_subtotal: r.priceSubtotal,
      discount: r.discount,
      tax_id: [],
      x_delivery_time: r.xDeliveryTime || "",
    }));
  },

  async createQuotation(data: CreateQuotationInput) {
    const name = generateDocNumber("SO", "sale_order");

    const [order] = await db.insert(saleOrders).values({
      name,
      partnerId: data.partner_id,
      dateOrder: data.date_order || new Date().toISOString().slice(0, 10),
      validityDate: data.validity_date,
      note: data.note || "",
      clientOrderRef: data.client_order_ref || "",
      state: "draft",
    }).returning({ id: saleOrders.id });

    for (const line of data.order_line) {
      await db.insert(saleOrderLines).values({
        orderId: order.id,
        productId: line.product_id,
        name: line.name,
        productUomQty: line.product_uom_qty,
        priceUnit: line.price_unit,
        discount: line.discount || 0,
        priceSubtotal: line.product_uom_qty * line.price_unit * (1 - (line.discount || 0) / 100),
        xDeliveryTime: line.x_delivery_time || "",
      });
    }

    await recalculateOrderTotals(order.id);
    return order.id;
  },

  async updateQuotation(id: number, data: Partial<SaleOrder>) {
    const updateData: Record<string, unknown> = {};
    if (data.note !== undefined) updateData.note = data.note;
    if (data.client_order_ref !== undefined) updateData.clientOrderRef = data.client_order_ref;
    if (data.date_order !== undefined) updateData.dateOrder = data.date_order;
    if (data.validity_date !== undefined) updateData.validityDate = data.validity_date;
    if (data.partner_id !== undefined) updateData.partnerId = data.partner_id[0];

    if (Object.keys(updateData).length) {
      await db.update(saleOrders).set(updateData).where(eq(saleOrders.id, id));
    }
    return true;
  },

  async confirmQuotation(id: number) {
    await db.update(saleOrders).set({ state: "sale" }).where(eq(saleOrders.id, id));
    return true;
  },

  async cancelQuotation(id: number) {
    await db.update(saleOrders).set({ state: "cancel" }).where(eq(saleOrders.id, id));
    return true;
  },

  async updateSaleOrderLine(lineId: number, data: Partial<SaleOrderLine>) {
    const updateData: Record<string, unknown> = {};
    if (data.product_uom_qty !== undefined) updateData.productUomQty = data.product_uom_qty;
    if (data.price_unit !== undefined) updateData.priceUnit = data.price_unit;
    if (data.discount !== undefined) updateData.discount = data.discount;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.x_delivery_time !== undefined) updateData.xDeliveryTime = data.x_delivery_time;

    if (Object.keys(updateData).length) {
      const line = await db.select({ orderId: saleOrderLines.orderId })
        .from(saleOrderLines)
        .where(eq(saleOrderLines.id, lineId))
        .limit(1);

      await db.update(saleOrderLines).set(updateData).where(eq(saleOrderLines.id, lineId));

      if (line.length) {
        await recalculateOrderTotals(line[0].orderId);
      }
    }
    return true;
  },

  async deleteSaleOrderLine(lineId: number) {
    const line = await db.select({ orderId: saleOrderLines.orderId })
      .from(saleOrderLines)
      .where(eq(saleOrderLines.id, lineId))
      .limit(1);

    await db.delete(saleOrderLines).where(eq(saleOrderLines.id, lineId));

    if (line.length) {
      await recalculateOrderTotals(line[0].orderId);
    }
    return true;
  },

  async addSaleOrderLine(orderId: number, line: AddLineInput) {
    const [row] = await db.insert(saleOrderLines).values({
      orderId,
      productId: line.product_id,
      name: line.name,
      productUomQty: line.product_uom_qty,
      priceUnit: line.price_unit,
      discount: line.discount || 0,
      priceSubtotal: line.product_uom_qty * line.price_unit * (1 - (line.discount || 0) / 100),
    }).returning({ id: saleOrderLines.id });

    await recalculateOrderTotals(orderId);
    return row.id;
  },
};

function toSaleOrder(row: {
  id: number;
  name: string;
  state: string | null;
  partnerId: number | null;
  partnerName: string | null;
  dateOrder: string | null;
  validityDate: string | null;
  amountUntaxed: number | null;
  amountTax: number | null;
  amountTotal: number | null;
  note: string | null;
  clientOrderRef: string | null;
  paymentTermId: number | null;
}): SaleOrder {
  return {
    id: row.id,
    name: row.name,
    state: (row.state || "draft") as SaleOrder["state"],
    partner_id: [row.partnerId || 0, row.partnerName || ""],
    date_order: row.dateOrder || "",
    validity_date: row.validityDate || "",
    order_line: [],
    amount_untaxed: row.amountUntaxed || 0,
    amount_tax: row.amountTax || 0,
    amount_total: row.amountTotal || 0,
    note: row.note || "",
    client_order_ref: row.clientOrderRef || false,
    payment_term_id: false,
  };
}

async function recalculateOrderTotals(orderId: number): Promise<void> {
  const lines = await db
    .select({
      qty: saleOrderLines.productUomQty,
      price: saleOrderLines.priceUnit,
      discount: saleOrderLines.discount,
    })
    .from(saleOrderLines)
    .where(eq(saleOrderLines.orderId, orderId));

  const amountUntaxed = lines.reduce((sum, l) => {
    return sum + l.qty * l.price * (1 - l.discount / 100);
  }, 0);

  await db.update(saleOrders)
    .set({ amountUntaxed, amountTax: 0, amountTotal: amountUntaxed })
    .where(eq(saleOrders.id, orderId));
}
```

-- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: PASS

-- [ ] **Step 3: Commit**

```bash
git add lib/data/sqlite/sale.ts
git commit -m "feat: add SQLite sales backend"
```

---

### Task 13: Create SQLite invoice, purchase, and stock backends

**Files:**
- Create: `lib/data/sqlite/invoice.ts`
- Create: `lib/data/sqlite/purchase.ts`
- Create: `lib/data/sqlite/stock.ts`

-- [ ] **Step 1: Write SQLite invoice backend**

```typescript
// lib/data/sqlite/invoice.ts

import type { AccountMove, AccountMoveLine } from "@/types/odoo";
import type { DataBackend } from "../types";
import { db, generateDocNumber } from "./db";
import { accountMoves, accountMoveLines, saleOrders, saleOrderLines, partners, products } from "./schema";
import { eq, desc } from "drizzle-orm";

export const sqliteInvoice: Pick<DataBackend,
  "fetchInvoices" | "fetchInvoiceById" | "fetchInvoiceLines" |
  "postInvoice" | "createInvoicesFromSaleOrder"
> = {
  async fetchInvoices(limit = 50, offset = 0) {
    const rows = await db.select({
      id: accountMoves.id,
      name: accountMoves.name,
      moveType: accountMoves.moveType,
      state: accountMoves.state,
      partnerId: accountMoves.partnerId,
      partnerName: partners.name,
      invoiceDate: accountMoves.invoiceDate,
      invoiceDateDue: accountMoves.invoiceDateDue,
      amountUntaxed: accountMoves.amountUntaxed,
      amountTax: accountMoves.amountTax,
      amountTotal: accountMoves.amountTotal,
      paymentState: accountMoves.paymentState,
      narration: accountMoves.narration,
      invoiceOrigin: accountMoves.invoiceOrigin,
      invoicePaymentTermId: accountMoves.invoicePaymentTermId,
    })
      .from(accountMoves)
      .leftJoin(partners, eq(accountMoves.partnerId, partners.id))
      .where(eq(accountMoves.moveType, "out_invoice"))
      .orderBy(desc(accountMoves.id))
      .limit(limit).offset(offset);

    return rows.map(toAccountMove);
  },

  async fetchInvoiceById(id: number) {
    const rows = await db.select({
      id: accountMoves.id,
      name: accountMoves.name,
      moveType: accountMoves.moveType,
      state: accountMoves.state,
      partnerId: accountMoves.partnerId,
      partnerName: partners.name,
      invoiceDate: accountMoves.invoiceDate,
      invoiceDateDue: accountMoves.invoiceDateDue,
      amountUntaxed: accountMoves.amountUntaxed,
      amountTax: accountMoves.amountTax,
      amountTotal: accountMoves.amountTotal,
      paymentState: accountMoves.paymentState,
      narration: accountMoves.narration,
      invoiceOrigin: accountMoves.invoiceOrigin,
      invoicePaymentTermId: accountMoves.invoicePaymentTermId,
    })
      .from(accountMoves)
      .leftJoin(partners, eq(accountMoves.partnerId, partners.id))
      .where(eq(accountMoves.id, id))
      .limit(1);
    if (!rows.length) throw new Error("Invoice not found");
    return toAccountMove(rows[0]);
  },

  async fetchInvoiceLines(invoiceId: number) {
    const rows = await db.select({
      id: accountMoveLines.id,
      moveId: accountMoveLines.moveId,
      productId: accountMoveLines.productId,
      productName: products.name,
      name: accountMoveLines.name,
      quantity: accountMoveLines.quantity,
      priceUnit: accountMoveLines.priceUnit,
      priceSubtotal: accountMoveLines.priceSubtotal,
      discount: accountMoveLines.discount,
      xDeliveryTime: accountMoveLines.xDeliveryTime,
    })
      .from(accountMoveLines)
      .leftJoin(products, eq(accountMoveLines.productId, products.id))
      .where(eq(accountMoveLines.moveId, invoiceId))
      .orderBy(accountMoveLines.id);

    return rows.map((r) => ({
      id: r.id,
      move_id: [r.moveId, ""],
      product_id: r.productId ? [r.productId, r.productName || ""] : [0, r.name],
      name: r.name || "",
      quantity: r.quantity,
      price_unit: r.priceUnit,
      price_subtotal: r.priceSubtotal,
      discount: r.discount,
      tax_ids: [],
      x_delivery_time: r.xDeliveryTime || "",
    }));
  },

  async postInvoice(id: number) {
    await db.update(accountMoves).set({ state: "posted" }).where(eq(accountMoves.id, id));
    return true;
  },

  async createInvoicesFromSaleOrder(orderId: number) {
    const soRows = await db.select({
      id: saleOrders.id,
      name: saleOrders.name,
      partnerId: saleOrders.partnerId,
    })
      .from(saleOrders)
      .where(eq(saleOrders.id, orderId))
      .limit(1);

    if (!soRows.length) throw new Error("Sale order not found");

    const so = soRows[0];
    const invoiceName = generateDocNumber("INV", "account_move");

    const [inv] = await db.insert(accountMoves).values({
      name: invoiceName,
      moveType: "out_invoice",
      state: "draft",
      partnerId: so.partnerId,
      invoiceDate: new Date().toISOString().slice(0, 10),
      invoiceOrigin: so.name,
    }).returning({ id: accountMoves.id });

    const lines = await db.select().from(saleOrderLines)
      .where(eq(saleOrderLines.orderId, orderId));

    for (const line of lines) {
      await db.insert(accountMoveLines).values({
        moveId: inv.id,
        productId: line.productId,
        name: line.name,
        quantity: line.productUomQty,
        priceUnit: line.priceUnit,
        discount: line.discount,
        priceSubtotal: line.priceSubtotal,
        xDeliveryTime: line.xDeliveryTime,
      });
    }

    await recalculateInvoiceTotals(inv.id);
    return [inv.id];
  },
};

function toAccountMove(row: {
  id: number;
  name: string;
  moveType: string | null;
  state: string | null;
  partnerId: number | null;
  partnerName: string | null;
  invoiceDate: string | null;
  invoiceDateDue: string | null;
  amountUntaxed: number | null;
  amountTax: number | null;
  amountTotal: number | null;
  paymentState: string | null;
  narration: string | null;
  invoiceOrigin: string | null;
  invoicePaymentTermId: number | null;
}): AccountMove {
  return {
    id: row.id,
    name: row.name,
    move_type: (row.moveType || "out_invoice") as AccountMove["move_type"],
    state: (row.state || "draft") as AccountMove["state"],
    partner_id: [row.partnerId || 0, row.partnerName || ""],
    invoice_date: row.invoiceDate || "",
    invoice_date_due: row.invoiceDateDue || "",
    invoice_line_ids: [],
    amount_untaxed: row.amountUntaxed || 0,
    amount_tax: row.amountTax || 0,
    amount_total: row.amountTotal || 0,
    payment_state: (row.paymentState || "not_paid") as AccountMove["payment_state"],
    narration: row.narration || "",
    invoice_origin: row.invoiceOrigin || "",
    invoice_payment_term_id: false,
  };
}

async function recalculateInvoiceTotals(invoiceId: number): Promise<void> {
  const lines = await db
    .select({ qty: accountMoveLines.quantity, price: accountMoveLines.priceUnit, discount: accountMoveLines.discount })
    .from(accountMoveLines)
    .where(eq(accountMoveLines.moveId, invoiceId));

  const amountUntaxed = lines.reduce((sum, l) => sum + l.qty * l.price * (1 - l.discount / 100), 0);
  await db.update(accountMoves).set({ amountUntaxed, amountTax: 0, amountTotal: amountUntaxed }).where(eq(accountMoves.id, invoiceId));
}
```

-- [ ] **Step 2: Write SQLite purchase backend**

```typescript
// lib/data/sqlite/purchase.ts

import type { PurchaseOrder, PurchaseOrderLine } from "@/types/odoo";
import type { DataBackend } from "../types";
import { db, generateDocNumber } from "./db";
import { purchaseOrders, purchaseOrderLines, saleOrders, saleOrderLines, partners, products } from "./schema";
import { eq, desc } from "drizzle-orm";

export const sqlitePurchase: Pick<DataBackend,
  "fetchPurchaseOrders" | "fetchPurchaseOrderById" | "fetchPurchaseOrderLines" |
  "confirmPurchaseOrder" | "fetchPurchaseOrdersByOrigin" | "createPurchaseOrderFromSaleOrder"
> = {
  async fetchPurchaseOrders(limit = 50, offset = 0) {
    const rows = await db.select({
      id: purchaseOrders.id,
      name: purchaseOrders.name,
      state: purchaseOrders.state,
      partnerId: purchaseOrders.partnerId,
      partnerName: partners.name,
      dateOrder: purchaseOrders.dateOrder,
      datePlanned: purchaseOrders.datePlanned,
      amountUntaxed: purchaseOrders.amountUntaxed,
      amountTax: purchaseOrders.amountTax,
      amountTotal: purchaseOrders.amountTotal,
      notes: purchaseOrders.notes,
      origin: purchaseOrders.origin,
    })
      .from(purchaseOrders)
      .leftJoin(partners, eq(purchaseOrders.partnerId, partners.id))
      .orderBy(desc(purchaseOrders.id))
      .limit(limit).offset(offset);

    return rows.map(toPurchaseOrder);
  },

  async fetchPurchaseOrderById(id: number) {
    const rows = await db.select({
      id: purchaseOrders.id,
      name: purchaseOrders.name,
      state: purchaseOrders.state,
      partnerId: purchaseOrders.partnerId,
      partnerName: partners.name,
      dateOrder: purchaseOrders.dateOrder,
      datePlanned: purchaseOrders.datePlanned,
      amountUntaxed: purchaseOrders.amountUntaxed,
      amountTax: purchaseOrders.amountTax,
      amountTotal: purchaseOrders.amountTotal,
      notes: purchaseOrders.notes,
      origin: purchaseOrders.origin,
    })
      .from(purchaseOrders)
      .leftJoin(partners, eq(purchaseOrders.partnerId, partners.id))
      .where(eq(purchaseOrders.id, id))
      .limit(1);
    if (!rows.length) throw new Error("Purchase order not found");
    return toPurchaseOrder(rows[0]);
  },

  async fetchPurchaseOrderLines(orderId: number) {
    const rows = await db.select({
      id: purchaseOrderLines.id,
      orderId: purchaseOrderLines.orderId,
      productId: purchaseOrderLines.productId,
      productName: products.name,
      name: purchaseOrderLines.name,
      productQty: purchaseOrderLines.productQty,
      priceUnit: purchaseOrderLines.priceUnit,
      priceSubtotal: purchaseOrderLines.priceSubtotal,
    })
      .from(purchaseOrderLines)
      .leftJoin(products, eq(purchaseOrderLines.productId, products.id))
      .where(eq(purchaseOrderLines.orderId, orderId))
      .orderBy(purchaseOrderLines.id);

    return rows.map((r) => ({
      id: r.id,
      order_id: [r.orderId, ""],
      product_id: r.productId ? [r.productId, r.productName || ""] : [0, r.name],
      name: r.name || "",
      product_qty: r.productQty,
      price_unit: r.priceUnit,
      price_subtotal: r.priceSubtotal,
      product_uom: [0, ""],
      taxes_id: [],
    }));
  },

  async confirmPurchaseOrder(id: number) {
    await db.update(purchaseOrders).set({ state: "purchase" }).where(eq(purchaseOrders.id, id));
    return true;
  },

  async fetchPurchaseOrdersByOrigin(origin: string) {
    const rows = await db.select({
      id: purchaseOrders.id,
      name: purchaseOrders.name,
      state: purchaseOrders.state,
      partnerId: purchaseOrders.partnerId,
      partnerName: partners.name,
      dateOrder: purchaseOrders.dateOrder,
      datePlanned: purchaseOrders.datePlanned,
      amountUntaxed: purchaseOrders.amountUntaxed,
      amountTax: purchaseOrders.amountTax,
      amountTotal: purchaseOrders.amountTotal,
      notes: purchaseOrders.notes,
      origin: purchaseOrders.origin,
    })
      .from(purchaseOrders)
      .leftJoin(partners, eq(purchaseOrders.partnerId, partners.id))
      .where(eq(purchaseOrders.origin, origin))
      .orderBy(desc(purchaseOrders.id));

    return rows.map(toPurchaseOrder);
  },

  async createPurchaseOrderFromSaleOrder(saleOrderId: number) {
    const soRows = await db.select().from(saleOrders).where(eq(saleOrders.id, saleOrderId)).limit(1);
    if (!soRows.length) throw new Error("Sale order not found");

    const so = soRows[0];
    const poName = generateDocNumber("PO", "purchase_order");

    const [po] = await db.insert(purchaseOrders).values({
      name: poName,
      partnerId: so.partnerId,
      origin: so.name,
      dateOrder: new Date().toISOString().slice(0, 10),
    }).returning({ id: purchaseOrders.id });

    const lines = await db.select().from(saleOrderLines).where(eq(saleOrderLines.orderId, saleOrderId));
    for (const line of lines) {
      await db.insert(purchaseOrderLines).values({
        orderId: po.id,
        productId: line.productId,
        name: line.name,
        productQty: line.productUomQty,
        priceUnit: line.priceUnit,
        priceSubtotal: line.priceSubtotal,
      });
    }

    await recalculatePoTotals(po.id);
    return po.id;
  },
};

function toPurchaseOrder(row: {
  id: number;
  name: string;
  state: string | null;
  partnerId: number | null;
  partnerName: string | null;
  dateOrder: string | null;
  datePlanned: string | null;
  amountUntaxed: number | null;
  amountTax: number | null;
  amountTotal: number | null;
  notes: string | null;
  origin: string | null;
}): PurchaseOrder {
  return {
    id: row.id,
    name: row.name,
    state: (row.state || "draft") as PurchaseOrder["state"],
    partner_id: [row.partnerId || 0, row.partnerName || ""],
    date_order: row.dateOrder || "",
    date_planned: row.datePlanned || "",
    order_line: [],
    amount_untaxed: row.amountUntaxed || 0,
    amount_tax: row.amountTax || 0,
    amount_total: row.amountTotal || 0,
    notes: row.notes || "",
    origin: row.origin || "",
  };
}

async function recalculatePoTotals(orderId: number): Promise<void> {
  const lines = await db
    .select({ qty: purchaseOrderLines.productQty, price: purchaseOrderLines.priceUnit })
    .from(purchaseOrderLines)
    .where(eq(purchaseOrderLines.orderId, orderId));

  const amountUntaxed = lines.reduce((sum, l) => sum + l.qty * l.price, 0);
  await db.update(purchaseOrders).set({ amountUntaxed, amountTax: 0, amountTotal: amountUntaxed }).where(eq(purchaseOrders.id, orderId));
}
```

-- [ ] **Step 3: Write SQLite stock backend**

```typescript
// lib/data/sqlite/stock.ts

import type { StockPicking, StockMove } from "@/types/odoo";
import type { DataBackend } from "../types";
import { db } from "./db";
import { stockPickings, stockMoves, accountMoves, partners, products } from "./schema";
import { eq, desc } from "drizzle-orm";

export const sqliteStock: Pick<DataBackend,
  "fetchDeliveries" | "fetchDeliveryById" | "fetchStockMoves" |
  "validateDelivery" | "setMoveDoneQuantity" | "findInvoiceByOrigin"
> = {
  async fetchDeliveries(limit = 50, offset = 0) {
    const rows = await db.select({
      id: stockPickings.id,
      name: stockPickings.name,
      state: stockPickings.state,
      partnerId: stockPickings.partnerId,
      partnerName: partners.name,
      scheduledDate: stockPickings.scheduledDate,
      dateDone: stockPickings.dateDone,
      origin: stockPickings.origin,
      pickingTypeId: stockPickings.pickingTypeId,
    })
      .from(stockPickings)
      .leftJoin(partners, eq(stockPickings.partnerId, partners.id))
      .orderBy(desc(stockPickings.id))
      .limit(limit).offset(offset);

    return rows.map(toStockPicking);
  },

  async fetchDeliveryById(id: number) {
    const rows = await db.select({
      id: stockPickings.id,
      name: stockPickings.name,
      state: stockPickings.state,
      partnerId: stockPickings.partnerId,
      partnerName: partners.name,
      scheduledDate: stockPickings.scheduledDate,
      dateDone: stockPickings.dateDone,
      origin: stockPickings.origin,
      pickingTypeId: stockPickings.pickingTypeId,
    })
      .from(stockPickings)
      .leftJoin(partners, eq(stockPickings.partnerId, partners.id))
      .where(eq(stockPickings.id, id))
      .limit(1);
    if (!rows.length) throw new Error("Delivery not found");
    return toStockPicking(rows[0]);
  },

  async fetchStockMoves(pickingId: number) {
    const rows = await db.select({
      id: stockMoves.id,
      pickingId: stockMoves.pickingId,
      productId: stockMoves.productId,
      productName: products.name,
      name: stockMoves.name,
      productUomQty: stockMoves.productUomQty,
      quantityDone: stockMoves.quantityDone,
    })
      .from(stockMoves)
      .leftJoin(products, eq(stockMoves.productId, products.id))
      .where(eq(stockMoves.pickingId, pickingId))
      .orderBy(stockMoves.id);

    return rows.map((r) => ({
      id: r.id,
      picking_id: [r.pickingId, ""],
      product_id: r.productId ? [r.productId, r.productName || ""] : [0, r.name],
      name: r.name || "",
      product_uom_qty: r.productUomQty,
      quantity_done: r.quantityDone,
      product_uom: [0, ""],
    }));
  },

  async validateDelivery(id: number) {
    await db.update(stockPickings).set({ state: "done", dateDone: new Date().toISOString().slice(0, 10) }).where(eq(stockPickings.id, id));
    return true;
  },

  async setMoveDoneQuantity(moveId: number, quantity: number) {
    await db.update(stockMoves).set({ quantityDone: quantity }).where(eq(stockMoves.id, moveId));
    return true;
  },

  async findInvoiceByOrigin(origin: string) {
    const rows = await db.select({ id: accountMoves.id, name: accountMoves.name })
      .from(accountMoves)
      .where(eq(accountMoves.invoiceOrigin, origin))
      .limit(1);
    return rows.length ? { id: rows[0].id, name: rows[0].name } : null;
  },
};

function toStockPicking(row: {
  id: number;
  name: string;
  state: string | null;
  partnerId: number | null;
  partnerName: string | null;
  scheduledDate: string | null;
  dateDone: string | null;
  origin: string | null;
  pickingTypeId: number | null;
}): StockPicking {
  return {
    id: row.id,
    name: row.name,
    state: (row.state || "draft") as StockPicking["state"],
    partner_id: [row.partnerId || 0, row.partnerName || ""],
    scheduled_date: row.scheduledDate || "",
    date_done: row.dateDone || "",
    move_ids_without_package: [],
    origin: row.origin || "",
    picking_type_id: [row.pickingTypeId || 0, ""],
  };
}
```

-- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: PASS

-- [ ] **Step 5: Commit**

```bash
git add lib/data/sqlite/invoice.ts lib/data/sqlite/purchase.ts lib/data/sqlite/stock.ts
git commit -m "feat: add SQLite invoice, purchase, and stock backends"
```

---

### Task 14: Create SQLite composite backend and auth

**Files:**
- Create: `lib/data/sqlite/backend.ts`

-- [ ] **Step 1: Write SqliteBackend class**

```typescript
// lib/data/sqlite/backend.ts

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
  async authenticate(username: string, password: string): Promise<OdooSessionInfo> {
    const rows = await db.select().from(users).where(eq(users.username, username)).limit(1);
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
      user_context: { lang: "en_US", tz: "Africa/Dar_es_Salaam", uid: user.id },
      user_companies: { current_company: 1, allowed_companies: {} },
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

  async call(model: string, method: string, args: unknown[], kwargs: Record<string, unknown> = {}): Promise<unknown> {
    // Direct SQLite operations for common patterns
    if (model === "res.company" && method === "search_read") {
      return [{
        id: 1, name: "OdooFlow Offline", street: "", street2: "", city: "", zip: "",
        phone: "", email: "", website: "", vat: "", logo: "",
        country_id: false, partner_id: 0,
      }];
    }
    if (model === "res.partner.bank" && method === "search_read") {
      return [];
    }
    if (model === "ir.config_parameter") {
      return [];
    }
    // Fallback: return empty for unsupported direct calls
    return null;
  }

  // Partners & Products
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

  // Quotations
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

  // Invoices
  fetchInvoices = sqliteInvoice.fetchInvoices;
  fetchInvoiceById = sqliteInvoice.fetchInvoiceById;
  fetchInvoiceLines = sqliteInvoice.fetchInvoiceLines;
  postInvoice = sqliteInvoice.postInvoice;
  createInvoicesFromSaleOrder = sqliteInvoice.createInvoicesFromSaleOrder;

  // Purchase Orders
  fetchPurchaseOrders = sqlitePurchase.fetchPurchaseOrders;
  fetchPurchaseOrderById = sqlitePurchase.fetchPurchaseOrderById;
  fetchPurchaseOrderLines = sqlitePurchase.fetchPurchaseOrderLines;
  confirmPurchaseOrder = sqlitePurchase.confirmPurchaseOrder;
  fetchPurchaseOrdersByOrigin = sqlitePurchase.fetchPurchaseOrdersByOrigin;
  createPurchaseOrderFromSaleOrder = sqlitePurchase.createPurchaseOrderFromSaleOrder;

  // Deliveries
  fetchDeliveries = sqliteStock.fetchDeliveries;
  fetchDeliveryById = sqliteStock.fetchDeliveryById;
  fetchStockMoves = sqliteStock.fetchStockMoves;
  validateDelivery = sqliteStock.validateDelivery;
  setMoveDoneQuantity = sqliteStock.setMoveDoneQuantity;
  findInvoiceByOrigin = sqliteStock.findInvoiceByOrigin;
}
```

-- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: PASS

-- [ ] **Step 3: Commit**

```bash
git add lib/data/sqlite/backend.ts
git commit -m "feat: add SqliteBackend composite class with auth"
```

---

### Task 15: Update backend factory to support SQLite

**Files:**
- Modify: `lib/data/backend.ts`

-- [ ] **Step 1: Update factory**

Change:
```typescript
if (type === "sqlite") {
  throw new Error("SqliteBackend not yet implemented");
}
```
To:
```typescript
if (type === "sqlite") {
  const { SqliteBackend } = require("./sqlite/backend");
  cached = new SqliteBackend();
}
```

The full file:
```typescript
// lib/data/backend.ts

import type { DataBackend } from "./types";
import { OdooBackend } from "./odoo/backend";

let cached: DataBackend | null = null;

export function getBackend(): DataBackend {
  if (cached) return cached;

  const type = process.env.BACKEND || "odoo";

  if (type === "sqlite") {
    const { SqliteBackend } = require("./sqlite/backend");
    cached = new SqliteBackend();
  } else {
    cached = new OdooBackend();
  }

  return cached;
}
```

-- [ ] **Step 2: Add BACKEND env var to .env.example**

```bash
echo "BACKEND=odoo" >> .env.example
```

-- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: PASS

-- [ ] **Step 4: Commit**

```bash
git add lib/data/backend.ts .env.example
git commit -m "feat: add SqliteBackend to factory"
```

---

### Task 16: Update auth API routes for offline mode

**Files:**
- Modify: `app/api/auth/login/route.ts`
- Modify: `app/api/auth/session/route.ts`

-- [ ] **Step 1: Update login route for offline mode**

Replace the Odoo RPC logic with conditional backend:

```typescript
// app/api/auth/login/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getBackend } from "@/lib/data/backend";

const ODOO_URL = process.env.ODOO_URL!;
const ODOO_DB = process.env.ODOO_DB!;
const BACKEND = process.env.BACKEND || "odoo";

export async function POST(req: NextRequest) {
  const { login, password, db } = await req.json();
  const database = db || ODOO_DB;

  try {
    if (BACKEND === "sqlite") {
      const backend = getBackend();
      const session = await backend.authenticate(login, password);
      const token = (session as unknown as Record<string, unknown>)._token as string;

      const response = NextResponse.json({ session });
      response.cookies.set("odoo_session_id", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      return response;
    }

    // Original Odoo RPC login flow
    const payload = {
      jsonrpc: "2.0",
      method: "call",
      id: Date.now(),
      params: { db: database, login, password },
    };

    const odooRes = await fetch(`${ODOO_URL}/web/session/authenticate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const setCookieHeader = odooRes.headers.get("set-cookie");
    let sessionId = "";

    if (setCookieHeader) {
      const match = setCookieHeader.match(/session_id=([^;]+)/);
      if (match) sessionId = match[1];
    }

    const data = await odooRes.json();

    if (data.error || !data.result?.uid) {
      return NextResponse.json(
        { message: data.error?.data?.message || "Invalid credentials" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ session: data.result });

    if (sessionId) {
      response.cookies.set("odoo_session_id", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;
  } catch (err) {
    return NextResponse.json(
      { message: `Connection failed: ${(err as Error).message}` },
      { status: 502 }
    );
  }
}
```

-- [ ] **Step 2: Update session route for offline mode**

```typescript
// app/api/auth/session/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getBackend } from "@/lib/data/backend";

const ODOO_URL = process.env.ODOO_URL!;
const ODOO_DB = process.env.ODOO_DB!;
const BACKEND = process.env.BACKEND || "odoo";

export async function GET(req: NextRequest) {
  const sessionId = req.cookies.get("odoo_session_id")?.value;

  if (!sessionId) {
    return NextResponse.json({ session: null }, { status: 401 });
  }

  try {
    if (BACKEND === "sqlite") {
      const backend = getBackend();
      const session = await backend.getSessionInfo(sessionId);
      if (!session) {
        return NextResponse.json({ session: null }, { status: 401 });
      }
      return NextResponse.json({ session });
    }

    // Original Odoo session check
    const payload = {
      jsonrpc: "2.0",
      method: "call",
      id: Date.now(),
      params: { db: ODOO_DB, login: "", password: "" },
    };

    const odooRes = await fetch(`${ODOO_URL}/web/session/get_session_info`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `session_id=${sessionId}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await odooRes.json();

    if (data.error || !data.result?.uid) {
      return NextResponse.json({ session: null }, { status: 401 });
    }

    return NextResponse.json({ session: data.result });
  } catch {
    return NextResponse.json({ session: null }, { status: 502 });
  }
}
```

-- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: PASS

-- [ ] **Step 4: Commit**

```bash
git add app/api/auth/login/route.ts app/api/auth/session/route.ts
git commit -m "feat: add offline auth support to API routes"
```

---

### Task 17: Update Odoo API route for offline mode

**Files:**
- Modify: `app/api/odoo/route.ts`

-- [ ] **Step 1: Add offline mode support**

```typescript
// app/api/odoo/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getBackend } from "@/lib/data/backend";

const ODOO_URL = process.env.ODOO_URL!;
const ODOO_DB = process.env.ODOO_DB!;
const BACKEND = process.env.BACKEND || "odoo";

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (BACKEND === "sqlite") {
    try {
      const backend = getBackend();
      const result = await backend.call(body.model, body.method, body.args, body.kwargs || {});
      return NextResponse.json({ result });
    } catch (err) {
      return NextResponse.json(
        { error: { message: (err as Error).message, code: 500 } },
        { status: 500 }
      );
    }
  }

  const sessionId = req.cookies.get("odoo_session_id")?.value;

  if (!sessionId) {
    return NextResponse.json(
      { error: { message: "Not authenticated", code: 401 } },
      { status: 401 }
    );
  }

  const { context: rpcContext, ...restBody } = body;
  const rpcPayload = {
    jsonrpc: "2.0",
    method: "call",
    id: Date.now(),
    params: {
      ...restBody,
      ...(rpcContext ? { context: rpcContext } : {}),
      db: ODOO_DB,
    },
  };

  try {
    const odooRes = await fetch(`${ODOO_URL}/web/dataset/call_kw`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `session_id=${sessionId}`,
      },
      body: JSON.stringify(rpcPayload),
    });

    if (odooRes.status === 401 || odooRes.status === 403) {
      return NextResponse.json(
        { error: { message: "Session expired", code: 401 } },
        { status: 401 }
      );
    }

    const result = await odooRes.json();

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 200 });
    }

    return NextResponse.json({ result: result.result });
  } catch (err) {
    return NextResponse.json(
      { error: { message: `Odoo connection failed: ${(err as Error).message}` } },
      { status: 502 }
    );
  }
}
```

-- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: PASS

-- [ ] **Step 3: Commit**

```bash
git add app/api/odoo/route.ts
git commit -m "feat: add offline mode to Odoo API route"
```

---

### Task 18: Create seed script for offline database

**Files:**
- Create: `lib/data/sqlite/seed.ts`

-- [ ] **Step 1: Write seed script**

```typescript
// lib/data/sqlite/seed.ts

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import crypto from "crypto";
import path from "path";

const DB_PATH = process.env.SQLITE_PATH || path.join(process.cwd(), "odooflow.db");

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const db = drizzle(sqlite, { schema });

async function seed() {
  // Create tables
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sequences (
      name TEXT PRIMARY KEY,
      current_value INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS partners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      street TEXT,
      street2 TEXT,
      city TEXT,
      state_id INTEGER,
      zip TEXT,
      country_id INTEGER,
      vat TEXT,
      x_tin TEXT,
      is_company INTEGER DEFAULT 0,
      customer_rank INTEGER DEFAULT 0,
      supplier_rank INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      default_code TEXT,
      list_price REAL DEFAULT 0,
      standard_price REAL DEFAULT 0,
      type TEXT DEFAULT 'consu',
      sale_ok INTEGER DEFAULT 1,
      purchase_ok INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS sale_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      state TEXT DEFAULT 'draft',
      partner_id INTEGER REFERENCES partners(id),
      date_order TEXT,
      validity_date TEXT,
      amount_untaxed REAL DEFAULT 0,
      amount_tax REAL DEFAULT 0,
      amount_total REAL DEFAULT 0,
      note TEXT,
      client_order_ref TEXT,
      payment_term_id INTEGER
    );
    CREATE TABLE IF NOT EXISTS sale_order_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES sale_orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      name TEXT,
      product_uom_qty REAL DEFAULT 0,
      price_unit REAL DEFAULT 0,
      price_subtotal REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      x_delivery_time TEXT
    );
    CREATE TABLE IF NOT EXISTS account_moves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      move_type TEXT DEFAULT 'out_invoice',
      state TEXT DEFAULT 'draft',
      partner_id INTEGER REFERENCES partners(id),
      invoice_date TEXT,
      invoice_date_due TEXT,
      amount_untaxed REAL DEFAULT 0,
      amount_tax REAL DEFAULT 0,
      amount_total REAL DEFAULT 0,
      payment_state TEXT,
      narration TEXT,
      invoice_origin TEXT,
      invoice_payment_term_id INTEGER
    );
    CREATE TABLE IF NOT EXISTS account_move_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      move_id INTEGER REFERENCES account_moves(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      name TEXT,
      quantity REAL DEFAULT 0,
      price_unit REAL DEFAULT 0,
      price_subtotal REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      x_delivery_time TEXT
    );
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      state TEXT DEFAULT 'draft',
      partner_id INTEGER REFERENCES partners(id),
      date_order TEXT,
      date_planned TEXT,
      amount_untaxed REAL DEFAULT 0,
      amount_tax REAL DEFAULT 0,
      amount_total REAL DEFAULT 0,
      notes TEXT,
      origin TEXT
    );
    CREATE TABLE IF NOT EXISTS purchase_order_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      name TEXT,
      product_qty REAL DEFAULT 0,
      price_unit REAL DEFAULT 0,
      price_subtotal REAL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS stock_pickings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      state TEXT DEFAULT 'draft',
      partner_id INTEGER REFERENCES partners(id),
      scheduled_date TEXT,
      date_done TEXT,
      origin TEXT,
      picking_type_id INTEGER
    );
    CREATE TABLE IF NOT EXISTS stock_moves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      picking_id INTEGER REFERENCES stock_pickings(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      name TEXT,
      product_uom_qty REAL DEFAULT 0,
      quantity_done REAL DEFAULT 0
    );
  `);

  // Seed sequences
  sqlite.exec(`
    INSERT OR IGNORE INTO sequences (name, current_value) VALUES ('sale_order', 0);
    INSERT OR IGNORE INTO sequences (name, current_value) VALUES ('account_move', 0);
    INSERT OR IGNORE INTO sequences (name, current_value) VALUES ('purchase_order', 0);
    INSERT OR IGNORE INTO sequences (name, current_value) VALUES ('stock_picking', 0);
  `);

  // Seed default admin user
  await db.insert(schema.users).values({
    username: "admin",
    passwordHash: hashPassword("admin"),
    name: "Administrator",
  }).onConflictDoNothing().run();

  // Seed sample customers
  await db.insert(schema.partners).values([
    { name: "Acme Corporation", email: "info@acme.com", phone: "+255 712 345 678", street: "123 Main St", city: "Dar es Salaam", vat: "123456789", isCompany: true, customerRank: 1 },
    { name: "Tech Solutions Ltd", email: "sales@techsolutions.com", phone: "+255 713 456 789", street: "456 Tech Ave", city: "Arusha", isCompany: true, customerRank: 1 },
    { name: "Global Traders", email: "info@globaltraders.com", phone: "+255 714 567 890", street: "789 Trade Blvd", city: "Mwanza", isCompany: true, customerRank: 1 },
  ]).onConflictDoNothing().run();

  // Seed sample products
  await db.insert(schema.products).values([
    { name: "Laptop - Dell XPS 15", defaultCode: "LAP-001", listPrice: 2500000, standardPrice: 2000000, type: "consu", saleOk: true, purchaseOk: true },
    { name: "Monitor - Samsung 27\"", defaultCode: "MON-001", listPrice: 450000, standardPrice: 350000, type: "consu", saleOk: true, purchaseOk: true },
    { name: "Keyboard - Logitech MX", defaultCode: "KEY-001", listPrice: 150000, standardPrice: 100000, type: "consu", saleOk: true, purchaseOk: true },
    { name: "Mouse - Logitech MX Master", defaultCode: "MOU-001", listPrice: 120000, standardPrice: 80000, type: "consu", saleOk: true, purchaseOk: true },
    { name: "Web Development Service", defaultCode: "SRV-001", listPrice: 5000000, standardPrice: 0, type: "service", saleOk: true, purchaseOk: false },
  ]).onConflictDoNothing().run();

  console.log("Seed complete! Created admin user (admin/admin), 3 customers, 5 products");
  console.log(`Database: ${DB_PATH}`);
}

seed().catch(console.error);
```

-- [ ] **Step 2: Add seed script to package.json**

Add to `scripts`:
```json
"seed:offline": "tsx lib/data/sqlite/seed.ts"
```

-- [ ] **Step 3: Run seed script**

```bash
npm run seed:offline
```
Expected: "Seed complete! Created admin user (admin/admin), 3 customers, 5 products"

-- [ ] **Step 4: Commit**

```bash
git add lib/data/sqlite/seed.ts package.json
git commit -m "feat: add offline seed script"
```

---

### Task 19: Verify SQLite backend works end-to-end

**Files:**
- Modify: `.env.local` (add BACKEND=sqlite temporarily)

-- [ ] **Step 1: Switch to SQLite backend**

Add to `.env.local`:
```
BACKEND=sqlite
SQLITE_PATH=./odooflow.db
```

**Remove or comment out** `ODOO_URL` and `ODOO_DB` for this test.

-- [ ] **Step 2: Start dev server**

```bash
npm run dev
```
Open http://localhost:3000 in the browser.

-- [ ] **Step 3: Test login**

Navigate to http://localhost:3000/login. Login with username `admin`, password `admin`.
Expected: Login succeeds, redirected to dashboard.

-- [ ] **Step 4: Test customer list**

Navigate to http://localhost:3000/customers.
Expected: Shows Acme Corporation, Tech Solutions Ltd, Global Traders.

-- [ ] **Step 5: Test product list**

Navigate to http://localhost:3000/products.
Expected: Shows 5 products (Laptop, Monitor, Keyboard, Mouse, Web Development Service).

-- [ ] **Step 6: Test create quotation**

Navigate to http://localhost:3000/quotations/new.
Create a new quotation with a customer and product lines.
Expected: Quotation created, listed at /quotations.

-- [ ] **Step 7: Test quotation detail**

Click on the created quotation.
Expected: Shows quotation details with line items. Can confirm/cancel.

-- [ ] **Step 8: Test create invoice from quotation**

On the quotation detail page, create an invoice.
Expected: Invoice created, listed at /invoices.

-- [ ] **Step 9: Restore online config**

Revert `.env.local` to original Odoo config.

-- [ ] **Step 10: Commit any fixes**

If any issues found during testing, fix and commit:
```bash
git add -A
git commit -m "fix: SQLite backend end-to-end fixes"
```

---

### Task 20: Run final verification

-- [ ] **Step 1: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: PASS

-- [ ] **Step 2: Verify Lint**

```bash
npm run lint
```
Expected: No new errors beyond baseline

-- [ ] **Step 3: Verify online mode still works**

Ensure `.env.local` has Odoo config and `BACKEND=odoo` (or not set):
```bash
npm run dev
```
Open http://localhost:3000. Login with Odoo credentials.
Expected: All pages work as before with Odoo backend.

-- [ ] **Step 4: Add BACKEND to .env.example**

Verify `.env.example` contains:
```
BACKEND=odoo
```

-- [ ] **Step 5: Add SQLITE_PATH to .env.example**

```bash
echo "SQLITE_PATH=./odooflow.db" >> .env.example
```

-- [ ] **Step 6: Final commit**

```bash
git add .env.example
git commit -m "chore: add BACKEND and SQLITE_PATH to env example"
```

---

## Implementation Notes

1. **Type compatibility**: The SQLite backend converts flat rows to Odoo-format types (e.g., `partner_id: [id, name]`). This ensures UI components work unchanged.

2. **Auth in offline mode**: Offline auth uses SHA-256 hashed passwords in a local `users` table. Session tokens are generated via `crypto.randomBytes()`. Tokens are stored in an in-memory Map (lost on server restart — acceptable for offline LAN use).

3. **Settings**: Company settings, bank details, and PDF colors are not stored in the offline DB. The `call()` method on SqliteBackend returns defaults. For production offline use, a settings management API will be needed.

4. **Tax handling**: The offline version sets `amountTax = 0` and `amountTotal = amountUntaxed`. OdooFlow's TZS-based workflows don't typically use taxes, so this is acceptable.

5. **Direct odooCall usage**: Pages that use `odooCall` directly (not wrapped in model functions) go through `backend.call()`. The SQLite backend handles common Odoo models in `call()`; edge cases may return null.

6. **PDF generation**: PDF routes use `lib/odoo/server-settings.ts` which directly calls Odoo. For offline mode, these need refactoring (out of scope for this plan — treat as follow-up work).

7. **No test runner**: Verification is via `npx tsc --noEmit`, `npm run lint`, and manual end-to-end testing (Task 19). No test framework exists in the project.
