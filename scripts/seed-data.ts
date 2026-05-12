/**
 * Comprehensive seed data script for OdooFlow end-to-end testing.
 *
 * Usage:
 *   npx tsx scripts/seed-data.ts
 *
 * Requires ODOO_URL, ODOO_DB, ODOO_USER, ODOO_PASSWORD in .env.local.
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

async function createCustomFields(uid: number) {
  console.log("\n--- Creating custom seed-data fields ---");

  const models = [
    { model: "sale.order", name: "x_seed_data", label: "Seed Data" },
    { model: "purchase.order", name: "x_seed_data", label: "Seed Data" },
    { model: "account.move", name: "x_seed_data", label: "Seed Data" },
    { model: "res.partner", name: "x_seed_data", label: "Seed Data" },
    { model: "product.product", name: "x_seed_data", label: "Seed Data" },
  ];

  for (const m of models) {
    try {
      const modelIds = await callKw<number[]>(uid, "ir.model", "search", [[["model", "=", m.model]]], { limit: 1 });
      const modelId = modelIds[0];
      if (!modelId) {
        console.warn(`  Model ${m.model} not found — skipping field`);
        continue;
      }
      const existing = await callKw<number[]>(uid, "ir.model.fields", "search", [[["model_id", "=", modelId], ["name", "=", m.name]]], {});
      if (existing.length === 0) {
        await callKw(uid, "ir.model.fields", "create", [{
          model_id: modelId,
          name: m.name,
          field_description: m.label,
          ttype: "boolean",
          state: "manual",
        }]);
        console.log(`  Created ${m.model}.${m.name}`);
      } else {
        console.log(`  Field ${m.model}.${m.name} already exists`);
      }
    } catch (e) {
      console.warn(`  Could not create ${m.model}.${m.name}: ${(e as Error).message}`);
    }
  }
}

async function deleteExistingSeedData(uid: number) {
  console.log("\n--- Cleaning up existing seed data ---");

  const modelsToCheck = [
    { model: "sale.order", field: "x_seed_data" },
    { model: "account.move", field: "x_seed_data" },
    { model: "purchase.order", field: "x_seed_data" },
  ];

  for (const { model, field } of modelsToCheck) {
    try {
      const ids = await callKw<number[]>(uid, model, "search", [[[field, "=", true]]], {});
      if (ids.length > 0) {
        await callKw(uid, model, "unlink", [ids]);
        console.log(`  Deleted ${ids.length} records from ${model}`);
      }
    } catch {
      // Field may not exist yet — skip
    }
  }

  // Delete partners and products by name pattern (they don't have x_seed_data in clean state)
  try {
    const customerIds = await callKw<number[]>(uid, "res.partner", "search", [
      [["name", "in", [
        "Riverside Mining Co. Ltd",
        "Kilimanjaro Food Processing Ltd",
        "Coastal Textiles Industries",
        "Mbeya Steel Fabricators",
        "Dr. Grace Nkya",
        "Morogoro Agricultural Cooperative",
        "Tanzania Hardware & Industrial Supplies Ltd",
        "East African Industrial Parts Ltd",
        "Dar es Salaam Bearing Centre",
]]]
    ], {});
    if (customerIds.length > 0) {
      await callKw(uid, "res.partner", "unlink", [customerIds]);
      console.log(`  Deleted ${customerIds.length} partners`);
    }
  } catch {}

  try {
    const productNames = [
      "[HP-200] Hydraulic Pump 200Bar",
      "[BR-6205] Deep Groove Ball Bearing 6205",
      "[CB-10M] Industrial Conveyor Belt 10m",
      "[PC-50] Pneumatic Cylinder 50mm Bore",
      "[EM-3HP] Electric Motor 3HP 3-Phase",
      "[GB-150] Gearbox Reducer 1:50 Ratio",
      "[V-BELT-A85] V-Belt A85 Industrial",
      "[SHAFT-40] Transmission Shaft 40mm",
      "[PLC-S71200] Siemens PLC S7-1200 CPU 1214C",
      "[HMI-KTP700] HMI Touch Panel 7-inch",
      "[SSR-40A] Solid State Relay 40A",
      "[SENSOR-PROX] Proximity Sensor Inductive M18",
      "[SRV-INST] On-Site Installation & Commissioning",
      "[SRV-DELIVERY] Equipment Delivery & Logistics",
      "[SRV-TRAIN] Equipment Operator Training",
    ];
    const productIds = await callKw<number[]>(uid, "product.product", "search", [[["name", "in", productNames]]], {});
    if (productIds.length > 0) {
      await callKw(uid, "product.product", "unlink", [productIds]);
      console.log(`  Deleted ${productIds.length} products`);
    }
  } catch {}

  console.log("  Cleanup complete.\n");
}

/* ------------------------------------------------------------------ */
/*  PARTNERS                                                           */
/* ------------------------------------------------------------------ */

async function createPartners(uid: number) {
  console.log("--- Creating partners ---");

  const customers = [
    {
      name: "Riverside Mining Co. Ltd",
      email: "procurement@riversidemining.co.tz",
      phone: "+255 768 123 456",
      street: "Plot 45, Industrial Area, Block 7",
      city: "Mwanza",
      country_id: 214,
      is_company: true,
      customer_rank: 1,
      vat: "120-876-543",
    },
    {
      name: "Kilimanjaro Food Processing Ltd",
      email: "purchasing@kilifood.co.tz",
      phone: "+255 765 987 654",
      street: "12 Kilimanjaro Road, Njiro",
      city: "Arusha",
      country_id: 214,
      is_company: true,
      customer_rank: 1,
      vat: "110-234-567",
      x_tin: "TIN-110234567",
    },
    {
      name: "Coastal Textiles Industries",
      email: "orders@coastaltextiles.co.tz",
      phone: "+255 712 345 678",
      street: "Mikocheni B Industrial Plot 8",
      city: "Dar es Salaam",
      country_id: 214,
      is_company: true,
      customer_rank: 1,
      vat: "130-345-678",
      x_tin: "TIN-130345678",
    },
    {
      name: "Mbeya Steel Fabricators",
      email: "store@mbeyasteel.co.tz",
      phone: "+255 788 456 789",
      street: "21 Vingunguti Industrial Area",
      city: "Mbeya",
      country_id: 214,
      is_company: true,
      customer_rank: 1,
      vat: "140-456-789",
      x_tin: "TIN-140456789",
    },
    {
      name: "Dr. Grace Nkya",
      email: "grace.nkya@gmail.com",
      phone: "+255 754 111 222",
      street: "House 7, Masaki Peninsula",
      city: "Dar es Salaam",
      country_id: 214,
      is_company: false,
      customer_rank: 1,
    },
    {
      name: "Morogoro Agricultural Cooperative",
      email: "admin@morocoop.agric.tz",
      phone: "+255 699 555 888",
      street: "Mbuyura Farm Road, Morogoro",
      city: "Morogoro",
      country_id: 214,
      is_company: true,
      customer_rank: 1,
      vat: "150-567-890",
      x_tin: "TIN-150567890",
    },
  ];

  const customerIds: number[] = [];
  for (const c of customers) {
    const id = await callKw<number>(uid, "res.partner", "create", [c]);
    customerIds.push(id);
    console.log(`  Customer: ${c.name} (id=${id})`);

    await callKw(uid, "res.partner.bank", "create", [{
      partner_id: id,
      bank_name: "CRDB Bank Plc",
      acc_holder_name: c.name,
      acc_number: `${100000 + id}TZ`,
      x_tzs_account: `TZ${String(100000 + id).padStart(10, "0")}`,
      x_usd_account: `USD${String(100000 + id).padStart(10, "0")}`,
      bank_bic: "CORUTZTZ",
      x_branch: "Main Branch",
      x_sort_code: `${3000 + id}`,
    }]);
    console.log(`    Bank account created for ${c.name}`);
  }

  const vendors = [
    {
      name: "Tanzania Hardware & Industrial Supplies Ltd",
      email: "sales@ths.co.tz",
      phone: "+255 684 222 333",
      street: "Plot 101, Nyerere Road",
      city: "Dar es Salaam",
      country_id: 214,
      is_company: true,
      supplier_rank: 1,
    },
    {
      name: "East African Industrial Parts Ltd",
      email: "info@eaip.co.tz",
      phone: "+255 767 444 555",
      street: "Block C, TIC Premises",
      city: "Dar es Salaam",
      country_id: 214,
      is_company: true,
      supplier_rank: 1,
    },
    {
      name: "Dar es Salaam Bearing Centre",
      email: "sales@ddbc.co.tz",
      phone: "+255 713 666 777",
      street: "Kariakoo Market, Shop 45",
      city: "Dar es Salaam",
      country_id: 214,
      is_company: true,
      supplier_rank: 1,
    },
  ];

  const vendorIds: number[] = [];
  for (const v of vendors) {
    const id = await callKw<number>(uid, "res.partner", "create", [v]);
    vendorIds.push(id);
    console.log(`  Vendor: ${v.name} (id=${id})`);
  }

  return { customerIds, vendorIds };
}

/* ------------------------------------------------------------------ */
/*  PRODUCTS                                                           */
/* ------------------------------------------------------------------ */

async function createProducts(uid: number) {
  console.log("\n--- Creating products ---");

  const uomUnit = await callKw<{ id: number }[]>(uid, "uom.uom", "search_read", [[["name", "=", "Units"]]], { fields: ["id"], limit: 1 });
  const categAll = await callKw<{ id: number }[]>(uid, "product.category", "search_read", [[["name", "=", "All"]]], { fields: ["id"], limit: 1 });
  const categMechanics = await callKw<{ id: number }[]>(uid, "product.category", "search_read", [[["name", "ilike", "Mechanical"]]], { fields: ["id"], limit: 1 });
  const categElectronics = await callKw<{ id: number }[]>(uid, "product.category", "search_read", [[["name", "ilike", "Electronic"]]], { fields: ["id"], limit: 1 });
  const categServices = await callKw<{ id: number }[]>(uid, "product.category", "search_read", [[["name", "ilike", "Service"]]], { fields: ["id"], limit: 1 });

  const uomId = uomUnit[0]?.id || 1;
  const categMechId = categMechanics[0]?.id || categAll[0]?.id || 1;
  const categElecId = categElectronics[0]?.id || categAll[0]?.id || 1;
  const categServId = categServices[0]?.id || categAll[0]?.id || 1;

  const products = [
    // Mechanical / Industrial parts
    {
      name: "[HP-200] Hydraulic Pump 200Bar",
      default_code: "HP-200",
      type: "consu",
      is_storable: true,
      list_price: 450000,
      standard_price: 320000,
      sale_ok: true,
      purchase_ok: true,
      uom_id: uomId,
      categ_id: categMechId,
      description: "Heavy-duty hydraulic pump rated at 200 bar, suitable for industrial presses and lifts. Flow rate: 45 L/min.",
    },
    {
      name: "[BR-6205] Deep Groove Ball Bearing 6205",
      default_code: "BR-6205",
      type: "consu",
      is_storable: true,
      list_price: 85000,
      standard_price: 52000,
      sale_ok: true,
      purchase_ok: true,
      uom_id: uomId,
      categ_id: categMechId,
      description: "Single row deep groove ball bearing, bore 25mm, OD 52mm. Sealed (2RS) variant.",
    },
    {
      name: "[CB-10M] Industrial Conveyor Belt 10m",
      default_code: "CB-10M",
      type: "consu",
      is_storable: true,
      list_price: 1200000,
      standard_price: 850000,
      sale_ok: true,
      purchase_ok: true,
      uom_id: uomId,
      categ_id: categMechId,
      description: "Rubber conveyor belt, 1000mm wide, 10 meters roll. EP200 grade with heat resistance.",
    },
    {
      name: "[PC-50] Pneumatic Cylinder 50mm Bore",
      default_code: "PC-50",
      type: "consu",
      is_storable: true,
      list_price: 320000,
      standard_price: 210000,
      sale_ok: true,
      purchase_ok: true,
      uom_id: uomId,
      categ_id: categMechId,
      description: "Double-acting pneumatic cylinder, 50mm bore, 200mm stroke. ISO 15552 standard.",
    },
    {
      name: "[EM-3HP] Electric Motor 3HP 3-Phase",
      default_code: "EM-3HP",
      type: "consu",
      is_storable: true,
      list_price: 780000,
      standard_price: 560000,
      sale_ok: true,
      purchase_ok: true,
      uom_id: uomId,
      categ_id: categMechId,
      description: "3HP (2.2kW) 3-phase induction motor, 1450 RPM, B3 mounting, IP55 protection.",
    },
    {
      name: "[GB-150] Gearbox Reducer 1:50 Ratio",
      default_code: "GB-150",
      type: "consu",
      is_storable: true,
      list_price: 1450000,
      standard_price: 1050000,
      sale_ok: true,
      purchase_ok: true,
      uom_id: uomId,
      categ_id: categMechId,
      description: "Helical gear reducer, 1:50 reduction ratio, input 1400 RPM, output 28 RPM. Torque: 450 Nm.",
    },
    {
      name: "[V-BELT-A85] V-Belt A85 Industrial",
      default_code: "V-BELT-A85",
      type: "consu",
      is_storable: true,
      list_price: 95000,
      standard_price: 62000,
      sale_ok: true,
      purchase_ok: true,
      uom_id: uomId,
      categ_id: categMechId,
      description: "Classical V-belt, A section, 85-inch outer length. For light-duty industrial power transmission.",
    },
    {
      name: "[SHAFT-40] Transmission Shaft 40mm",
      default_code: "SHAFT-40",
      type: "consu",
      is_storable: true,
      list_price: 185000,
      standard_price: 130000,
      sale_ok: true,
      purchase_ok: true,
      uom_id: uomId,
      categ_id: categMechId,
      description: "Hardened transmission shaft, 40mm diameter, 1000mm length. Delivered cut to length.",
    },
    // Electronics / Automation
    {
      name: "[PLC-S71200] Siemens PLC S7-1200 CPU 1214C",
      default_code: "PLC-S71200",
      type: "consu",
      is_storable: true,
      list_price: 2300000,
      standard_price: 1800000,
      sale_ok: true,
      purchase_ok: true,
      uom_id: uomId,
      categ_id: categElecId,
      description: "Siemens SIMATIC S7-1200 CPU 1214C DC/DC/DC, 14 DI / 10 DO, Ethernet port. TIA Portal compatible.",
    },
    {
      name: "[HMI-KTP700] HMI Touch Panel 7-inch",
      default_code: "HMI-KTP700",
      type: "consu",
      is_storable: true,
      list_price: 1850000,
      standard_price: 1400000,
      sale_ok: true,
      purchase_ok: true,
      uom_id: uomId,
      categ_id: categElecId,
      description: "7-inch widescreen HMI, 800x480 resolution, touchscreen. Profinet & RS485 communication.",
    },
    {
      name: "[SSR-40A] Solid State Relay 40A",
      default_code: "SSR-40A",
      type: "consu",
      is_storable: true,
      list_price: 145000,
      standard_price: 95000,
      sale_ok: true,
      purchase_ok: true,
      uom_id: uomId,
      categ_id: categElecId,
      description: "Solid state relay, 40A output, 24-480VAC, input 3-32VDC. Zero-crossing type.",
    },
    {
      name: "[SENSOR-PROX] Proximity Sensor Inductive M18",
      default_code: "SENSOR-PROX",
      type: "consu",
      is_storable: true,
      list_price: 95000,
      standard_price: 60000,
      sale_ok: true,
      purchase_ok: true,
      uom_id: uomId,
      categ_id: categElecId,
      description: "Inductive proximity sensor, M18 threaded, 8mm sensing range, PNP NO output, 24VDC.",
    },
    // Services
    {
      name: "[SRV-INST] On-Site Installation & Commissioning",
      default_code: "SRV-INST",
      type: "service",
      is_storable: false,
      list_price: 500000,
      standard_price: 300000,
      sale_ok: true,
      purchase_ok: false,
      uom_id: uomId,
      categ_id: categServId,
      description: "Professional on-site installation and commissioning of industrial equipment. Includes setup, calibration, and operator training. Per day rate.",
    },
    {
      name: "[SRV-DELIVERY] Equipment Delivery & Logistics",
      default_code: "SRV-DELIVERY",
      type: "service",
      is_storable: false,
      list_price: 350000,
      standard_price: 200000,
      sale_ok: true,
      purchase_ok: false,
      uom_id: uomId,
      categ_id: categServId,
      description: "Transportation and delivery of equipment to site. Includes offloading and positioning. Regional rates apply.",
    },
    {
      name: "[SRV-TRAIN] Equipment Operator Training",
      default_code: "SRV-TRAIN",
      type: "service",
      is_storable: false,
      list_price: 250000,
      standard_price: 150000,
      sale_ok: true,
      purchase_ok: false,
      uom_id: uomId,
      categ_id: categServId,
      description: "Hands-on operator training session covering safe operation, daily maintenance, and basic troubleshooting.",
    },
  ];

  const productIds: number[] = [];
  for (const p of products) {
    const id = await callKw<number>(uid, "product.product", "create", [p]);
    productIds.push(id);
    console.log(`  Product: ${p.name} (id=${id})`);
  }

  return productIds;
}

/* ------------------------------------------------------------------ */
/*  Helper: build order line with [CODE] name format                  */
/* ------------------------------------------------------------------ */

function buildLine(productId: number, code: string, description: string, qty: number, price: number, discount: number = 0) {
  return [
    0, 0,
    {
      product_id: productId,
      name: `[${code}] ${description}`,
      product_uom_qty: qty,
      price_unit: price,
      discount,
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  QUOTATIONS                                                         */
/* ------------------------------------------------------------------ */

async function createQuotations(uid: number, customerIds: number[], productIds: number[]) {
  console.log("\n--- Creating quotations ---");

  const [
    ,        // 0: HP-200
    ,        // 1: BR-6205
    ,        // 2: CB-10M
    ,        // 3: PC-50
    ,        // 4: EM-3HP
    ,        // 5: GB-150
    ,        // 6: V-BELT-A85
    ,        // 7: SHAFT-40
    ,        // 8: PLC-S71200
    ,        // 9: HMI-KTP700
    ,        // 10: SSR-40A
    ,        // 11: SENSOR-PROX
    ,        // 12: SRV-INST
    ,        // 13: SRV-DELIVERY
    ,        // 14: SRV-TRAIN
  ] = productIds;

  const TERMS = `<p>1. Prices are in Tanzanian Shillings (TZS) and exclusive of VAT.</p><p>2. Payment terms: 30 days from invoice date.</p><p>3. Delivery: FOB Dar es Salaam. Lead time: 2-4 weeks from order confirmation.</p><p>4. Warranty: 12 months from date of commissioning on mechanical and electrical parts.</p><p>5. Installation and commissioning services available upon request at additional cost.</p>`;

  const configs: { customerIdx: number; lines: ReturnType<typeof buildLine>[]; state: string; ref?: string }[] = [
    // QUO01 - Draft
    {
      customerIdx: 0,
      lines: [
        buildLine(productIds[0], "HP-200", "Hydraulic Pump 200Bar", 2, 440000),
        buildLine(productIds[1], "BR-6205", "Deep Groove Ball Bearing 6205", 10, 82000),
        buildLine(productIds[6], "V-BELT-A85", "V-Belt A85 Industrial", 4, 92000),
      ],
      state: "draft",
      ref: "RM/QUO/2026-001",
    },
    // QUO02 - Sent
    {
      customerIdx: 1,
      lines: [
        buildLine(productIds[8], "PLC-S71200", "Siemens PLC S7-1200 CPU 1214C", 1, 2250000),
        buildLine(productIds[9], "HMI-KTP700", "HMI Touch Panel 7-inch", 1, 1800000),
        buildLine(productIds[10], "SSR-40A", "Solid State Relay 40A", 6, 140000),
        buildLine(productIds[11], "SENSOR-PROX", "Proximity Sensor Inductive M18", 12, 92000),
        buildLine(productIds[12], "SRV-INST", "On-Site Installation & Commissioning", 3, 480000),
      ],
      state: "sent",
      ref: "KF/QUO/2026-012",
    },
    // QUO03 - Confirmed (sale) — creates proforma + invoices
    {
      customerIdx: 2,
      lines: [
        buildLine(productIds[2], "CB-10M", "Industrial Conveyor Belt 10m", 3, 1180000),
        buildLine(productIds[3], "PC-50", "Pneumatic Cylinder 50mm Bore", 8, 310000),
        buildLine(productIds[4], "EM-3HP", "Electric Motor 3HP 3-Phase", 4, 760000),
        buildLine(productIds[5], "GB-150", "Gearbox Reducer 1:50 Ratio", 2, 1420000),
        buildLine(productIds[13], "SRV-DELIVERY", "Equipment Delivery & Logistics", 1, 850000, 10),
      ],
      state: "sale",
      ref: "CT/QUO/2026-003",
    },
    // QUO04 - Confirmed (sale)
    {
      customerIdx: 3,
      lines: [
        buildLine(productIds[0], "HP-200", "Hydraulic Pump 200Bar", 3, 445000),
        buildLine(productIds[5], "GB-150", "Gearbox Reducer 1:50 Ratio", 2, 1430000),
        buildLine(productIds[7], "SHAFT-40", "Transmission Shaft 40mm", 6, 180000, 5),
        buildLine(productIds[12], "SRV-INST", "On-Site Installation & Commissioning", 2, 490000),
        buildLine(productIds[14], "SRV-TRAIN", "Equipment Operator Training", 2, 240000),
      ],
      state: "sale",
      ref: "MS/QUO/2026-007",
    },
    // QUO05 - Draft
    {
      customerIdx: 4,
      lines: [
        buildLine(productIds[1], "BR-6205", "Deep Groove Ball Bearing 6205", 20, 80000),
        buildLine(productIds[6], "V-BELT-A85", "V-Belt A85 Industrial", 8, 94000),
        buildLine(productIds[11], "SENSOR-PROX", "Proximity Sensor Inductive M18", 10, 90000),
      ],
      state: "draft",
      ref: "PER/QUO/2026-015",
    },
    // QUO06 - Sent
    {
      customerIdx: 5,
      lines: [
        buildLine(productIds[8], "PLC-S71200", "Siemens PLC S7-1200 CPU 1214C", 2, 2280000),
        buildLine(productIds[9], "HMI-KTP700", "HMI Touch Panel 7-inch", 2, 1820000),
        buildLine(productIds[11], "SENSOR-PROX", "Proximity Sensor Inductive M18", 20, 88000),
        buildLine(productIds[12], "SRV-INST", "On-Site Installation & Commissioning", 5, 475000),
        buildLine(productIds[14], "SRV-TRAIN", "Equipment Operator Training", 3, 245000),
      ],
      state: "sent",
      ref: "MAC/QUO/2026-022",
    },
  ];

  const quotations: { id: number; customerId: number; state: string }[] = [];

  for (const cfg of configs) {
    const partnerId = customerIds[cfg.customerIdx];

    const orderId = await callKw<number>(uid, "sale.order", "create", [{
      partner_id: partnerId,
      client_order_ref: cfg.ref,
      order_line: cfg.lines,
      validity_date: "2026-12-31",
      note: TERMS,
    }]);

    console.log(`  Quotation #${orderId} (${cfg.ref}) state=${cfg.state}`);

    if (cfg.state === "sent") {
      await callKw(uid, "sale.order", "action_quotation_sent", [[orderId]]);
    } else if (cfg.state === "sale") {
      await callKw(uid, "sale.order", "action_confirm", [[orderId]]);
    }

    quotations.push({ id: orderId, customerId: partnerId, state: cfg.state });
  }

  return quotations;
}

/* ------------------------------------------------------------------ */
/*  PURCHASE ORDERS                                                    */
/* ------------------------------------------------------------------ */

async function createPurchaseOrders(uid: number, quotations: { id: number; customerId: number; state: string }[]) {
  console.log("\n--- Creating purchase orders ---");

  const confirmed = quotations.filter((q) => q.state === "sale");
  const poIds: number[] = [];

  const vendorIds = await callKw<number[]>(uid, "res.partner", "search", [[["supplier_rank", "=", 1], ["name", "in", [
    "Tanzania Hardware & Industrial Supplies Ltd",
    "East African Industrial Parts Ltd",
    "Dar es Salaam Bearing Centre",
  ]]]], {});

  if (confirmed.length === 0 || vendorIds.length === 0) {
    console.log("  No confirmed orders or vendors to create POs from.");
    return poIds;
  }

  for (let i = 0; i < confirmed.length; i++) {
    const so = confirmed[i];
    const vendorId = vendorIds[i % vendorIds.length];

    const poId = await callKw<number>(uid, "purchase.order", "create", [{
      partner_id: vendorId,
      origin: `SO/${so.id}`,
      date_planned: "2026-07-15",
      notes: "Purchase order for industrial supplies. Payment: 60 days net.",
    }]);

    await callKw(uid, "purchase.order.line", "create", [{
      order_id: poId,
      product_id: 1,
      name: "[HP-200] Hydraulic Pump 200Bar",
      product_qty: 2,
      price_unit: 320000,
      date_planned: "2026-07-15",
    }]);
    await callKw(uid, "purchase.order.line", "create", [{
      order_id: poId,
      product_id: 2,
      name: "[BR-6205] Deep Groove Ball Bearing 6205",
      product_qty: 10,
      price_unit: 52000,
      date_planned: "2026-07-15",
    }]);
    await callKw(uid, "purchase.order.line", "create", [{
      order_id: poId,
      product_id: 8,
      name: "[SRV-LOG] Logistics Service",
      product_qty: 1,
      price_unit: 200000,
      date_planned: "2026-07-15",
    }]);

    poIds.push(poId);
    console.log(`  PO #${poId} created (origin=SO/${so.id}, vendor=${vendorId})`);

    try {
      await callKw(uid, "purchase.order", "button_confirm", [[poId]]);
      console.log(`    -> PO #${poId} confirmed`);
    } catch {}
  }

  return poIds;
}

/* ------------------------------------------------------------------ */
/*  INVOICES                                                           */
/* ------------------------------------------------------------------ */

async function createInvoices(uid: number, quotations: { id: number; state: string }[]) {
  console.log("\n--- Creating invoices from sale orders ---");

  const confirmed = quotations.filter((q) => q.state === "sale");
  const invoiceIds: number[] = [];

  for (const so of confirmed) {
    try {
      const wizId = await callKw<number>(uid, "sale.advance.payment.inv", "create", [{
        advance_payment_method: "delivered",
        sale_order_ids: [[6, 0, [so.id]]],
      }], { context: { active_ids: [so.id], active_model: "sale.order" } });

      await callKw(uid, "sale.advance.payment.inv", "create_invoices", [[wizId]], {
        context: { active_ids: [so.id], active_model: "sale.order" },
      });

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

/* ------------------------------------------------------------------ */
/*  DELIVERIES                                                         */
/* ------------------------------------------------------------------ */

async function createDeliveries(uid: number, quotations: { id: number; state: string }[]) {
  console.log("\n--- Creating and validating deliveries ---");

  const confirmed = quotations.filter((q) => q.state === "sale");
  const deliveryIds: number[] = [];

  for (const so of confirmed) {
    try {
      const [soRead] = await callKw<{ picking_ids: number[] }[]>(uid, "sale.order", "read", [[so.id]], { fields: ["picking_ids"] });
      const pickings = soRead?.picking_ids || [];

      for (const pickId of pickings) {
        try {
          const moves = await callKw<{ id: number; product_uom_qty: number }[]>(
            uid, "stock.move", "search_read",
            [[["picking_id", "=", pickId]]],
            { fields: ["id", "product_uom_qty"] }
          );

          for (const move of moves) {
            await callKw(uid, "stock.move", "write", [[move.id], { quantity: move.product_uom_qty }]);
          }

          await callKw(uid, "stock.picking", "button_validate", [[pickId]]);
          deliveryIds.push(pickId);
          console.log(`  Delivery #${pickId} validated (from SO-${so.id})`);
        } catch (e) {
          console.warn(`    Could not validate delivery #${pickId}: ${(e as Error).message}`);
        }
      }
    } catch (e) {
      console.warn(`  Failed reading pickings for SO-${so.id}: ${(e as Error).message}`);
    }
  }

  return deliveryIds;
}

/* ------------------------------------------------------------------ */
/*  MAIN                                                               */
/* ------------------------------------------------------------------ */

async function main() {
  try {
    const uid = await authenticate();

    await createCustomFields(uid);
    await deleteExistingSeedData(uid);

    const { customerIds, vendorIds } = await createPartners(uid);
    const productIds = await createProducts(uid);
    const quotations = await createQuotations(uid, customerIds, productIds);
    const purchaseOrderIds = await createPurchaseOrders(uid, quotations);
    const invoiceIds = await createInvoices(uid, quotations);
    const deliveryIds = await createDeliveries(uid, quotations);

    console.log("\n========================================");
    console.log("Seed data created successfully!");
    console.log("========================================");
    console.log(`Customers  : ${customerIds.length}`);
    console.log(`Vendors    : ${vendorIds.length}`);
    console.log(`Products   : ${productIds.length}`);
    console.log(`Quotations : ${quotations.length} (mix of draft, sent, confirmed)`);
    console.log(`POs        : ${purchaseOrderIds.length}`);
    console.log(`Invoices   : ${invoiceIds.length}`);
    console.log(`Deliveries : ${deliveryIds.length}`);
    console.log("========================================");
    console.log("\nAll records created with proper [CODE] names.");
    console.log("Run again to clean and re-seed with fresh data.\n");
  } catch (err) {
    console.error("\nFatal error:", (err as Error).message);
    process.exit(1);
  }
}

main();
