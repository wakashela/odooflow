/**
 * Seed data script for OdooFlow end-to-end testing.
 *
 * Usage:
 *   npx tsx scripts/seed-data.ts
 *
 * Requires ODOO_URL, ODOO_DB, and optionally ODOO_USER / ODOO_PASSWORD
 * in .env.local or as environment variables.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

const ODOO_URL = process.env.ODOO_URL;
const ODOO_DB = process.env.ODOO_DB;
const ODOO_USER = process.env.ODOO_USER || "admin";
const ODOO_PASSWORD = process.env.ODOO_PASSWORD || "admin";

if (!ODOO_URL || !ODOO_DB) {
  console.error("Missing ODOO_URL or ODOO_DB. Check your .env.local");
  process.exit(1);
}

const JSONRPC_URL = `${ODOO_URL}/jsonrpc`;

interface RpcPayload {
  jsonrpc: "2.0";
  method: "call";
  id: number;
  params: Record<string, unknown>;
}

async function rpcCall<T = unknown>(
  service: string,
  method: string,
  args: unknown[] = [],
  kwargs: Record<string, unknown> = {}
): Promise<T> {
  const payload: RpcPayload = {
    jsonrpc: "2.0",
    method: "call",
    id: Date.now(),
    params: { service, method, args, kwargs },
  };

  const res = await fetch(JSONRPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (data.error) {
    throw new Error(
      `RPC Error: ${data.error.message}\n${JSON.stringify(data.error.data, null, 2)}`
    );
  }

  return data.result as T;
}

async function authenticate(): Promise<number> {
  console.log(`Authenticating ${ODOO_USER} on ${ODOO_DB}...`);
  const uid = await rpcCall<number>("common", "authenticate", [
    ODOO_DB,
    ODOO_USER,
    ODOO_PASSWORD,
    {},
  ]);
  console.log(`Authenticated (uid=${uid})`);
  return uid;
}

async function callKw<T = unknown>(
  uid: number,
  model: string,
  method: string,
  args: unknown[] = [],
  kwargs: Record<string, unknown> = {}
): Promise<T> {
  return rpcCall<T>("object", "execute_kw", [
    ODOO_DB,
    uid,
    ODOO_PASSWORD,
    model,
    method,
    args,
    kwargs,
  ]);
}

/* ------------------------------------------------------------------ */
/*  Seed helpers                                                       */
/* ------------------------------------------------------------------ */

async function createPartners(uid: number) {
  console.log("\n--- Creating partners ---");

  const customers = [
    { name: "Alpha Industries Ltd", email: "procurement@alpha.co.tz", phone: "+255 768 123 456", street: "Plot 45, Industrial Area", city: "Dar es Salaam", is_company: true, customer_rank: 1, vat: "123456789" },
    { name: "Beta Supplies Co.", email: "orders@betasupplies.com", phone: "+255 765 987 654", street: "12 Kijitonyama Road", city: "Dar es Salaam", is_company: true, customer_rank: 1, vat: "987654321" },
    { name: "Gamma Traders", email: "info@gammatraders.co.tz", phone: "+255 712 345 678", street: "Mikocheni B", city: "Dar es Salaam", is_company: true, customer_rank: 1 },
    { name: "Delta Enterprises", email: "sales@deltaent.co.tz", phone: "+255 788 456 789", street: "21 Vingunguti", city: "Dar es Salaam", is_company: true, customer_rank: 1 },
    { name: "John Mbwambo", email: "john.mbwambo@gmail.com", phone: "+255 754 111 222", street: "House 7, Masaki", city: "Dar es Salaam", is_company: false, customer_rank: 1 },
  ];

  const customerIds: number[] = [];
  for (const c of customers) {
    const id = await callKw<number>(uid, "res.partner", "create", [c]);
    customerIds.push(id);
    console.log(`  Customer created: ${c.name} (id=${id})`);
  }

  const vendors = [
    { name: "Tanzania Hardware Suppliers", email: "sales@ths.co.tz", phone: "+255 684 222 333", street: "Plot 101, Nyerere Road", city: "Dar es Salaam", is_company: true, supplier_rank: 1 },
    { name: "East African Industrial Parts", email: "info@eaip.co.tz", phone: "+255 767 444 555", street: "Block C, TIC Premises", city: "Dar es Salaam", is_company: true, supplier_rank: 1 },
    { name: "Kariakoo Spare Parts", email: "kariakoo@spares.co.tz", phone: "+255 713 666 777", street: "Kariakoo Market", city: "Dar es Salaam", is_company: true, supplier_rank: 1 },
  ];

  const vendorIds: number[] = [];
  for (const v of vendors) {
    const id = await callKw<number>(uid, "res.partner", "create", [v]);
    vendorIds.push(id);
    console.log(`  Vendor created: ${v.name} (id=${id})`);
  }

  return { customerIds, vendorIds };
}

async function createProducts(uid: number) {
  console.log("\n--- Creating products ---");

  // Try to find existing UoM "Units" and category "All"
  const [uomUnit] = await callKw<{ id: number }[]>(uid, "uom.uom", "search_read", [[["name", "=", "Units"]]], { fields: ["id"], limit: 1 });
  const [categAll] = await callKw<{ id: number }[]>(uid, "product.category", "search_read", [[["name", "=", "All"]]], { fields: ["id"], limit: 1 });

  const uomId = uomUnit?.id || 1;
  const categId = categAll?.id || 1;

  const products = [
    { name: "Hydraulic Pump HP-200", default_code: "HP-200", type: "consu", is_storable: true, list_price: 450000, standard_price: 320000, sale_ok: true, purchase_ok: true, uom_id: uomId, categ_id: categId },
    { name: "Industrial Bearing 6205", default_code: "BR-6205", type: "consu", is_storable: true, list_price: 85000, standard_price: 52000, sale_ok: true, purchase_ok: true, uom_id: uomId, categ_id: categId },
    { name: "Conveyor Belt 10m", default_code: "CB-10M", type: "consu", is_storable: true, list_price: 1200000, standard_price: 850000, sale_ok: true, purchase_ok: true, uom_id: uomId, categ_id: categId },
    { name: "PLC Controller S7-1200", default_code: "PLC-S71200", type: "consu", is_storable: true, list_price: 2300000, standard_price: 1800000, sale_ok: true, purchase_ok: true, uom_id: uomId, categ_id: categId },
    { name: "Pneumatic Cylinder 50mm", default_code: "PC-50", type: "consu", is_storable: true, list_price: 320000, standard_price: 210000, sale_ok: true, purchase_ok: true, uom_id: uomId, categ_id: categId },
    { name: "Electric Motor 3HP", default_code: "EM-3HP", type: "consu", is_storable: true, list_price: 780000, standard_price: 560000, sale_ok: true, purchase_ok: true, uom_id: uomId, categ_id: categId },
    { name: "Gearbox Reducer 1:50", default_code: "GB-150", type: "consu", is_storable: true, list_price: 1450000, standard_price: 1050000, sale_ok: true, purchase_ok: true, uom_id: uomId, categ_id: categId },
    { name: "Installation & Commissioning", default_code: "SRV-INST", type: "service", is_storable: false, list_price: 500000, standard_price: 300000, sale_ok: true, purchase_ok: false, uom_id: uomId, categ_id: categId },
  ];

  const productIds: number[] = [];
  for (const p of products) {
    const id = await callKw<number>(uid, "product.product", "create", [p]);
    productIds.push(id);
    console.log(`  Product created: ${p.name} (id=${id})`);
  }

  return productIds;
}

async function createQuotations(
  uid: number,
  customerIds: number[],
  productIds: number[]
) {
  console.log("\n--- Creating quotations / sale orders ---");

  const quotations: { id: number; partnerId: number; lines: { productId: number; qty: number; price: number }[]; state: string }[] = [];

  const configs = [
    { partnerIdx: 0, lines: [{ productIdx: 0, qty: 2, price: 440000 }, { productIdx: 1, qty: 10, price: 82000 }], state: "draft" },
    { partnerIdx: 1, lines: [{ productIdx: 2, qty: 1, price: 1150000 }, { productIdx: 7, qty: 1, price: 480000 }], state: "sent" },
    { partnerIdx: 2, lines: [{ productIdx: 3, qty: 1, price: 2250000 }, { productIdx: 4, qty: 4, price: 310000 }], state: "sale" },
    { partnerIdx: 0, lines: [{ productIdx: 5, qty: 3, price: 760000 }, { productIdx: 6, qty: 2, price: 1400000 }], state: "sale" },
    { partnerIdx: 3, lines: [{ productIdx: 0, qty: 5, price: 430000 }, { productIdx: 2, qty: 2, price: 1180000 }], state: "draft" },
    { partnerIdx: 4, lines: [{ productIdx: 1, qty: 20, price: 80000 }], state: "cancel" },
  ];

  for (const cfg of configs) {
    const partnerId = customerIds[cfg.partnerIdx];

    const orderLineData = cfg.lines.map((l) => [
      0, 0,
      {
        product_id: productIds[l.productIdx],
        name: "",
        product_uom_qty: l.qty,
        price_unit: l.price,
        discount: 0,
      },
    ]);

    const orderId = await callKw<number>(uid, "sale.order", "create", [{
      partner_id: partnerId,
      order_line: orderLineData,
      validity_date: "2026-06-30",
      note: "Auto-generated seed quotation for testing.",
    }]);

    console.log(`  Quotation #${orderId} created (partner=${partnerId}, state=${cfg.state})`);

    if (cfg.state === "sent") {
      await callKw(uid, "sale.order", "action_quotation_sent", [[orderId]]);
      console.log(`    -> marked as sent`);
    } else if (cfg.state === "sale") {
      await callKw(uid, "sale.order", "action_confirm", [[orderId]]);
      console.log(`    -> confirmed (sale)`);
    } else if (cfg.state === "cancel") {
      await callKw(uid, "sale.order", "action_cancel", [[orderId]]);
      console.log(`    -> cancelled`);
    }

    quotations.push({
      id: orderId,
      partnerId,
      lines: cfg.lines.map((l) => ({ productId: productIds[l.productIdx], qty: l.qty, price: l.price })),
      state: cfg.state,
    });
  }

  return quotations;
}

async function createPurchaseOrders(uid: number, quotations: { id: number; partnerId: number; state: string }[]) {
  console.log("\n--- Creating purchase orders ---");

  const confirmed = quotations.filter((q) => q.state === "sale");
  const purchaseOrderIds: number[] = [];

  for (const so of confirmed) {
    try {
      const poId = await callKw<number>(uid, "purchase.order", "create", [{
        partner_id: so.partnerId,
        origin: `SO-${so.id}`,
        date_planned: "2026-06-15",
      }]);

      // Add a generic line referencing product 0 just for linking
      const [firstProduct] = await callKw<{ id: number }[]>(uid, "product.product", "search_read", [[]], { fields: ["id"], limit: 1 });
      if (firstProduct?.id) {
        await callKw(uid, "purchase.order.line", "create", [{
          order_id: poId,
          product_id: firstProduct.id,
          name: "Auto-generated PO line",
          product_qty: 1,
          price_unit: 100000,
        }]);
      }

      purchaseOrderIds.push(poId);
      console.log(`  Purchase order #${poId} created (origin=SO-${so.id})`);
    } catch (e) {
      console.warn(`  Failed to create PO for SO-${so.id}: ${(e as Error).message}`);
    }
  }

  return purchaseOrderIds;
}

async function createAndPostInvoices(uid: number, quotations: { id: number; state: string }[]) {
  console.log("\n--- Creating & posting invoices from sale orders ---");

  const confirmed = quotations.filter((q) => q.state === "sale");
  const invoiceIds: number[] = [];

  for (const so of confirmed) {
    try {
      // Use Odoo's wizard to create invoice from sale order
      const wizId = await callKw<number>(uid, "sale.advance.payment.inv", "create", [{
        advance_payment_method: "delivered",
        sale_order_ids: [[6, 0, [so.id]]],
      }], { context: { active_ids: [so.id], active_model: "sale.order" } });

      await callKw(uid, "sale.advance.payment.inv", "create_invoices", [[wizId]], { context: { active_ids: [so.id], active_model: "sale.order" } });

      const [soRead] = await callKw<{ invoice_ids: number[] }[]>(uid, "sale.order", "read", [[so.id]], { fields: ["invoice_ids"] });
      const invs = soRead?.invoice_ids || [];

      for (const invId of invs) {
        await callKw(uid, "account.move", "action_post", [[invId]]);
        invoiceIds.push(invId);
        console.log(`  Invoice #${invId} created & posted (from SO-${so.id})`);
      }
    } catch (e) {
      console.warn(`  Failed to invoice SO-${so.id}: ${(e as Error).message}`);
    }
  }

  return invoiceIds;
}

async function validateDeliveries(uid: number, quotations: { id: number; state: string }[]) {
  console.log("\n--- Validating deliveries ---");

  const confirmed = quotations.filter((q) => q.state === "sale");
  const validatedIds: number[] = [];

  for (const so of confirmed) {
    try {
      const [soRead] = await callKw<{ picking_ids: number[] }[]>(uid, "sale.order", "read", [[so.id]], { fields: ["picking_ids"] });
      const pickings = soRead?.picking_ids || [];

      for (const pickId of pickings) {
        try {
          // Set all move quantities to their reserved quantity before validating
          const moves = await callKw<{ id: number; product_uom_qty: number }[]>(uid, "stock.move", "search_read", [[["picking_id", "=", pickId]]], { fields: ["id", "product_uom_qty"] });
          for (const move of moves) {
            await callKw(uid, "stock.move", "write", [[move.id], { quantity: move.product_uom_qty }]);
          }

          await callKw(uid, "stock.picking", "button_validate", [[pickId]]);
          validatedIds.push(pickId);
          console.log(`  Delivery #${pickId} validated (from SO-${so.id})`);
        } catch (e) {
          console.warn(`    Could not validate delivery #${pickId}: ${(e as Error).message}`);
        }
      }
    } catch (e) {
      console.warn(`  Failed reading pickings for SO-${so.id}: ${(e as Error).message}`);
    }
  }

  return validatedIds;
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

async function main() {
  try {
    const uid = await authenticate();

    const { customerIds, vendorIds } = await createPartners(uid);
    const productIds = await createProducts(uid);
    const quotations = await createQuotations(uid, customerIds, productIds);
    const purchaseOrderIds = await createPurchaseOrders(uid, quotations);
    const invoiceIds = await createAndPostInvoices(uid, quotations);
    const deliveryIds = await validateDeliveries(uid, quotations);

    console.log("\n========================================");
    console.log("Seed data created successfully!");
    console.log("========================================");
    console.log(`Customers : ${customerIds.length}`);
    console.log(`Vendors   : ${vendorIds.length}`);
    console.log(`Products  : ${productIds.length}`);
    console.log(`Quotations: ${quotations.length}`);
    console.log(`Purchase Orders: ${purchaseOrderIds.length}`);
    console.log(`Invoices  : ${invoiceIds.length}`);
    console.log(`Deliveries: ${deliveryIds.length}`);
    console.log("========================================");
  } catch (err) {
    console.error("\nFatal error:", (err as Error).message);
    process.exit(1);
  }
}

main();
