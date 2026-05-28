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
