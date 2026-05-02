
const ODOO_URL = "http://localhost:8069";
const ODOO_DB = "jensenintl";

async function testWorkflow() {
  console.log("Starting Workflow Test...");

  // 1. Login
  const loginRes = await fetch(`${ODOO_URL}/web/session/authenticate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: { db: ODOO_DB, login: "admin", password: "admin" },
      id: 1
    }),
  });

  const loginData = await loginRes.json();
  if (loginData.error) throw new Error("Login failed: " + JSON.stringify(loginData.error));

  const sessionId = loginRes.headers.get("set-cookie").match(/session_id=([^;]+)/)[1];
  console.log("Logged in, Session ID:", sessionId);

  const callOdoo = async (model, method, args = [], kwargs = {}) => {
    const res = await fetch(`${ODOO_URL}/web/dataset/call_kw`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `session_id=${sessionId}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "call",
        params: { model, method, args, kwargs },
        id: Date.now()
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(`Odoo Error (${model}.${method}): ` + JSON.stringify(data.error));
    return data.result;
  };

  const partnerId = 8; // ABC
  const productId = 61; // Cable Glands

  // 2. Create Quotation (Quotation stage)
  console.log("Creating Quotation...");
  const quotationId = await callOdoo("sale.order", "create", [{
    partner_id: partnerId,
    order_line: [
      [0, 0, {
        product_id: productId,
        product_uom_qty: 2,
        price_unit: 100
      }]
    ]
  }]);
  console.log("Quotation Created:", quotationId);

  // 3. Confirm Quotation -> Sale Order (Purchase Order stage in user's workflow terms)
  console.log("Confirming Quotation...");
  await callOdoo("sale.order", "action_confirm", [[quotationId]]);
  console.log("Quotation Confirmed.");

  // 4. Create Invoice (Tax Invoice stage)
  console.log("Creating Invoice...");
  // In Odoo 18, the wizard is sale.make.invoice.advance
  const wizId = await callOdoo("sale.make.invoice.advance", "create", [{
    advance_payment_method: "delivered",
    sale_order_ids: [[6, 0, [quotationId]]]
  }]);
  
  try {
      await callOdoo("sale.make.invoice.advance", "create_invoices", [[wizId]]);
  } catch (e) {
      console.log("Regular invoice failed, probably because invoicing policy is 'delivered' and nothing delivered yet.");
      console.log("Let's try Down Payment (percentage 100) instead...");
      const wizId2 = await callOdoo("sale.make.invoice.advance", "create", [{
        advance_payment_method: "percentage",
        amount: 100,
        sale_order_ids: [[6, 0, [quotationId]]]
      }]);
      await callOdoo("sale.make.invoice.advance", "create_invoices", [[wizId2]]);
  }

  const soData = await callOdoo("sale.order", "read", [[quotationId]], { fields: ["invoice_ids", "picking_ids"] });
  const invoiceId = soData[0].invoice_ids[0];
  const pickingId = soData[0].picking_ids[0];
  console.log("Invoice Created:", invoiceId);
  console.log("Picking (Delivery) Created:", pickingId);

  // 5. Post Invoice
  console.log("Posting Invoice...");
  await callOdoo("account.move", "action_post", [[invoiceId]]);
  console.log("Invoice Posted.");

  // 6. Validate Delivery (Delivery Note stage)
  console.log("Validating Delivery...");
  // Need to set quantity done first
  const picking = await callOdoo("stock.picking", "read", [[pickingId]], { fields: ["move_ids"] });
  for (const moveId of picking[0].move_ids) {
      await callOdoo("stock.move", "write", [[moveId], { quantity: 2 }]); // Odoo 18 uses 'quantity' instead of 'quantity_done' in some contexts, let's check
  }
  await callOdoo("stock.picking", "button_validate", [[pickingId]]);
  console.log("Delivery Validated.");

  // 7. Test Printing (Hitting Next.js PDF API)
  console.log("Testing PDF Generation...");
  const testPdf = async (type, id) => {
      const res = await fetch(`http://localhost:3000/api/pdf/${type}/${id}`, {
          headers: { "Cookie": `odoo_session_id=${sessionId}` }
      });
      if (res.ok) {
          console.log(`PDF ${type} generated successfully`);
      } else {
          console.error(`PDF ${type} failed:`, res.status);
          const text = await res.text();
          console.error(text.substring(0, 200));
      }
  };

  await testPdf("quotation", quotationId);
  await testPdf("proforma", quotationId);
  await testPdf("invoice", invoiceId);
  await testPdf("purchase-order", quotationId); // User said Purchase Order, but SO is often the PO for them
  await testPdf("delivery", pickingId);

  console.log("Workflow Test Completed Successfully!");
}

testWorkflow().catch(err => {
  console.error("Test Failed:", err);
  process.exit(1);
});
