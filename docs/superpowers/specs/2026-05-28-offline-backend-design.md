# Offline Backend Design Spec

**Date**: 2026-05-28
**Status**: Approved
**Author**: OdooFlow Team

## Goal

Create an offline-first version of OdooFlow that runs as a self-hosted Node.js server with SQLite as the database. The offline version mirrors the entire Odoo API surface used by OdooFlow but stores data locally. Both versions share identical UI and business logic — only the data access layer differs.

## Constraints

- No sync between online and offline versions
- Self-hosted Node.js server (same Next.js app)
- SQLite via Drizzle ORM (type-safe, fast, lightweight)
- Single repo, backend adapter pattern
- Feature development: online first, then port to offline

## Architecture

### Backend Adapter Pattern

An abstract `DataBackend` interface defines every data operation the UI needs. Two implementations exist:

1. **OdooBackend** — current behavior, calls Odoo JSON-RPC via `/api/odoo`
2. **SqliteBackend** — new, calls SQLite via Drizzle ORM

A factory function selects the backend based on the `BACKEND` environment variable.

### Directory Structure

```
lib/
  data/
    index.ts              ← re-exports getBackend() and all types
    types.ts              ← DataBackend interface
    backend.ts            ← factory: reads BACKEND env, returns Odoo or Sqlite backend
    odoo/
      client.ts           ← moved from lib/odoo/client.ts (odooCall)
      sale.ts             ← implements DataBackend for sales via Odoo RPC
      invoice.ts          ← implements DataBackend for invoices via Odoo RPC
      purchase.ts         ← implements DataBackend for purchase orders via Odoo RPC
      stock.ts            ← implements DataBackend for deliveries via Odoo RPC
      partner.ts          ← implements DataBackend for partners/products via Odoo RPC
    sqlite/
      schema.ts           ← Drizzle table definitions
      db.ts               ← SQLite connection (better-sqlite3 via drizzle)
      sale.ts             ← implements DataBackend for sales via SQLite
      invoice.ts          ← implements DataBackend for invoices via SQLite
      purchase.ts         ← implements DataBackend for purchase orders via SQLite
      stock.ts            ← implements DataBackend for deliveries via SQLite
      partner.ts          ← implements DataBackend for partners/products via SQLite
      seed.ts             ← migration/seed script for offline DB
  odoo/                   ← KEPT for backward compat (re-exports from data/odoo/)
```

### Environment Variable

```
BACKEND=odoo    # default — uses Odoo JSON-RPC
BACKEND=sqlite  # offline — uses local SQLite
```

## DataBackend Interface

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

## SQLite Schema (Drizzle)

```typescript
// lib/data/sqlite/schema.ts

import { sqliteTable, integer, real, text } from "drizzle-orm/sqlite-core";

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

## Backend Factory

```typescript
// lib/data/backend.ts

import type { DataBackend } from "./types";

let cached: DataBackend | null = null;

export function getBackend(): DataBackend {
  if (cached) return cached;

  const type = process.env.BACKEND || "odoo";

  if (type === "sqlite") {
    const { SqliteBackend } = require("./sqlite/backend");
    cached = new SqliteBackend();
  } else {
    const { OdooBackend } = require("./odoo/backend");
    cached = new OdooBackend();
  }

  return cached;
}
```

## Migration Strategy

### Phase 1 — Extract Interface (no behavior change)

1. Create `lib/data/types.ts` with the `DataBackend` interface
2. Create `lib/data/odoo/` — move existing `lib/odoo/` code into classes that implement the interface
3. Create `lib/data/backend.ts` factory
4. Update all UI imports: `@/lib/odoo/sale` → `@/lib/data`
5. Keep `lib/odoo/` as thin re-exports for backward compat

### Phase 2 — SQLite Implementation

1. Create `lib/data/sqlite/schema.ts` with Drizzle tables
2. Create `lib/data/sqlite/db.ts` with SQLite connection
3. Implement each method in `lib/data/sqlite/*.ts` using Drizzle queries
4. The SQLite backend converts between its flat format and the Odoo-format types (e.g., `partner_id: [id, name]`)
5. Add `BACKEND=sqlite` env var support
6. Create seed script for test data

### Phase 3 — Feature Parity Workflow

- **Online first**: add feature to `lib/data/odoo/`, UI uses `getBackend()`
- **Then mirror**: implement same method in `lib/data/sqlite/`
- **UI never changes** between versions

## Data Format Conversion

The SQLite backend must convert between its relational format and the Odoo-format types that UI components expect:

```typescript
// Example: SQLite row → Odoo SaleOrder format
function toSaleOrder(row: SaleOrderRow, partnerName: string): SaleOrder {
  return {
    id: row.id,
    name: row.name,
    state: row.state as SaleOrder["state"],
    partner_id: [row.partnerId, partnerName],  // Many2one format
    date_order: row.dateOrder,
    validity_date: row.validityDate || "",
    order_line: [],  // Fetched separately
    amount_untaxed: row.amountUntaxed,
    amount_tax: row.amountTax,
    amount_total: row.amountTotal,
    note: row.note || "",
    client_order_ref: row.clientOrderRef || false,
    payment_term_id: false,
  };
}
```

## Sequence Generation

For offline document numbering (SO0001, INV0001, PO0001), use a `sequences` table:

```sql
CREATE TABLE sequences (
  name TEXT PRIMARY KEY,
  current_value INTEGER DEFAULT 0
);
```

Each backend method that creates a document increments the sequence and formats it with zero-padding.

## Authentication (Offline)

The online version uses Odoo session cookies via `app/api/auth/`. For the offline version:

- **Option A**: Simple local auth — a `users` table with username/password hash. Login returns a session token stored in a cookie. The `authenticate()` and `getSessionInfo()` methods query this table.
- **Option B**: No auth — the offline version runs without authentication (trusted LAN environment).

**Recommendation**: Option A for basic security. The `DataBackend` interface includes auth methods, and the SQLite backend implements them against a local `users` table.

## Complex Workflows

### createInvoicesFromSaleOrder

In Odoo, this uses a `sale.advance.payment.inv` wizard. For the SQLite backend, this must be reimplemented as direct operations:

1. Fetch the sale order and its lines
2. Create an `account_move` (invoice) with `move_type = "out_invoice"`
3. Copy each sale order line as an `account_move_line`
4. Copy `x_delivery_time` from sale order lines to invoice lines
5. Return the new invoice ID(s)

This is the most complex method to port — the Odoo wizard automates tax calculation and account assignment. The SQLite version must handle these explicitly.

## New Dependencies

- `drizzle-orm` — ORM
- `better-sqlite3` — SQLite driver (Node.js native)
- `drizzle-kit` — migrations and studio (dev only)

## Testing

- Existing online behavior must remain unchanged (regression test)
- SQLite backend tested with seed data
- Both backends must return identical types for identical data
