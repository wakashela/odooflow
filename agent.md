# agent.md — OdooFlow Frontend Project

> A beautiful, minimal Next.js 14 frontend that wraps Odoo 18's business document workflow:
> **Quotation → Proforma Invoice → Purchase Order → Tax Invoice → Delivery Note**

---

## 🧭 Project Vision

Hide Odoo's complexity behind a clean, intuitive interface. Small companies should feel like they're using a purpose-built tool — not an ERP. Every screen should feel fast, obvious, and elegant. PDF output should look as polished as the sample document provided (Jensen Automations style: clean table layout, branded header, teal accent colors, bank details footer).

---

## 🏗️ Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR, API routes, Vercel-native |
| Language | TypeScript | Type safety for Odoo RPC responses |
| Styling | Tailwind CSS + CSS Variables | Fast, consistent, themeable |
| Odoo Integration | Odoo JSON-RPC 2.0 (`/web/dataset/call_kw`) | Standard Odoo REST-like API |
| OWL | Odoo Web Library (embedded widgets only) | Optional: for complex Odoo-native components |
| PDF Generation | `@react-pdf/renderer` | Beautiful client-side PDF matching sample |
| Auth | Odoo session cookie via Next.js API proxy | Keeps credentials server-side |
| Deployment | Vercel | Zero-config, edge-ready |
| State | Zustand | Lightweight, no boilerplate |
| Forms | React Hook Form + Zod | Validation that mirrors Odoo constraints |

---

## 📁 Project Structure

```
/
├── agent.md                        ← You are here
├── app/
│   ├── layout.tsx                  ← Root layout, fonts, theme
│   ├── page.tsx                    ← Dashboard / home
│   ├── (auth)/
│   │   └── login/page.tsx          ← Odoo login form
│   ├── quotations/
│   │   ├── page.tsx                ← List view
│   │   ├── new/page.tsx            ← Create quotation
│   │   └── [id]/page.tsx           ← Detail / edit view
│   ├── proforma/
│   │   └── [id]/page.tsx           ← Proforma preview + send
│   ├── purchase-orders/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── invoices/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   └── delivery/
│       ├── page.tsx
│       └── [id]/page.tsx
├── components/
│   ├── ui/                         ← Base design system
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Table.tsx
│   │   ├── Badge.tsx               ← Status chips (Draft, Confirmed, etc.)
│   │   ├── Modal.tsx
│   │   └── Input.tsx
│   ├── layout/
│   │   ├── Sidebar.tsx             ← Navigation between doc types
│   │   ├── Header.tsx
│   │   └── WorkflowBar.tsx         ← Visual pipeline: Q→P→PO→INV→DEL
│   ├── documents/
│   │   ├── DocumentHeader.tsx      ← Reusable: company logo, client, dates
│   │   ├── LineItemsTable.tsx      ← Editable rows (qty, rate, amount)
│   │   ├── TotalsBlock.tsx         ← Subtotal, discount, tax, total
│   │   └── BankDetails.tsx         ← Footer bank info block
│   └── pdf/
│       ├── QuotationPDF.tsx
│       ├── ProformaPDF.tsx
│       ├── PurchaseOrderPDF.tsx
│       ├── TaxInvoicePDF.tsx
│       └── DeliveryNotePDF.tsx
├── lib/
│   ├── odoo/
│   │   ├── client.ts               ← Core JSON-RPC client
│   │   ├── auth.ts                 ← Login / session management
│   │   ├── sale.ts                 ← sale.order CRUD
│   │   ├── purchase.ts             ← purchase.order CRUD
│   │   ├── invoice.ts              ← account.move CRUD
│   │   ├── stock.ts                ← stock.picking (delivery)
│   │   └── partner.ts              ← res.partner (customers/vendors)
│   ├── pdf/
│   │   └── styles.ts               ← Shared PDF styles (fonts, colors)
│   └── utils.ts                    ← formatCurrency, formatDate, etc.
├── store/
│   ├── authStore.ts                ← Session, uid, company info
│   └── documentStore.ts            ← Current document being edited
├── types/
│   ├── odoo.ts                     ← Raw Odoo RPC types
│   └── documents.ts                ← App-level document types
├── app/api/
│   ├── odoo/route.ts               ← Proxy: forwards RPC to Odoo, adds auth
│   └── pdf/[type]/[id]/route.ts    ← Server-side PDF generation endpoint
└── public/
    └── logo.png                    ← Company logo for PDFs
```

---

## 🔌 Odoo 18 Integration

### Core JSON-RPC Client (`lib/odoo/client.ts`)

```typescript
// All Odoo calls go through Next.js /api/odoo proxy to hide credentials
export async function odooCall<T>(
  model: string,
  method: string,
  args: unknown[] = [],
  kwargs: Record<string, unknown> = {}
): Promise<T> {
  const res = await fetch('/api/odoo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, method, args, kwargs }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.data?.message ?? data.error.message);
  return data.result as T;
}
```

### API Proxy (`app/api/odoo/route.ts`)

```typescript
// Server-side: holds Odoo session, forwards calls
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const session = req.cookies.get('odoo_session')?.value;

  const odooRes = await fetch(`${process.env.ODOO_URL}/web/dataset/call_kw`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `session_id=${session}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: {
        model: body.model,
        method: body.method,
        args: body.args,
        kwargs: body.kwargs,
      },
    }),
  });

  const result = await odooRes.json();
  return NextResponse.json(result);
}
```

### Environment Variables (`.env.local`)

```env
ODOO_URL=https://your-odoo18-instance.com
ODOO_DB=your_database_name
# Never expose these to the client
ODOO_ADMIN_USER=admin
ODOO_ADMIN_PASSWORD=your_password
```

---

## 🔄 Workflow State Machine

Each document type maps to an Odoo model. Understand this mapping:

```
Quotation        → sale.order         (state: draft → sent)
Proforma Invoice → sale.order         (same record, print as proforma)
Purchase Order   → purchase.order     (state: draft → purchase → done)
Tax Invoice      → account.move       (move_type: out_invoice, state: draft → posted)
Delivery Note    → stock.picking      (state: draft → confirmed → done)
```

### Workflow Transitions

| From | Action | Odoo Method | To |
|---|---|---|---|
| Quotation (draft) | "Confirm Order" | `sale.order.action_confirm()` | Sale Order |
| Sale Order | "Create Invoice" | `sale.order._create_invoices()` | Tax Invoice (draft) |
| Tax Invoice (draft) | "Validate Invoice" | `account.move.action_post()` | Tax Invoice (posted) |
| Sale Order | "Validate Delivery" | `stock.picking.button_validate()` | Delivery Note (done) |
| Quotation | "Print Proforma" | Print with `is_proforma=True` flag | PDF only (no state change) |

---

## 📄 Document Field Mappings

### Quotation / Sale Order (`sale.order`)

```typescript
interface SaleOrder {
  id: number;
  name: string;               // "S00042"
  state: 'draft'|'sent'|'sale'|'cancel';
  partner_id: [number, string];
  date_order: string;
  validity_date: string;
  order_line: SaleOrderLine[];
  amount_untaxed: number;
  amount_tax: number;
  amount_total: number;
  note: string;               // Terms & conditions
  carrier_id?: [number, string];
  // Custom fields you may need to add in Odoo:
  x_tracking_no?: string;     // e.g. "TZ26-1555"
  x_delivery_time?: string;   // e.g. "6 WEEKS"
}

interface SaleOrderLine {
  id: number;
  product_id: [number, string];
  name: string;               // Description
  product_uom_qty: number;
  price_unit: number;
  price_subtotal: number;
  discount: number;
  tax_id: [number, string][];
}
```

### Tax Invoice (`account.move`)

```typescript
interface AccountMove {
  id: number;
  name: string;               // "INV/2026/00042"
  move_type: 'out_invoice';
  state: 'draft'|'posted'|'cancel';
  partner_id: [number, string];
  invoice_date: string;
  invoice_date_due: string;
  invoice_line_ids: AccountMoveLine[];
  amount_untaxed: number;
  amount_tax: number;
  amount_total: number;
}
```

### Delivery Note (`stock.picking`)

```typescript
interface StockPicking {
  id: number;
  name: string;               // "WH/OUT/00042"
  state: 'draft'|'waiting'|'confirmed'|'assigned'|'done'|'cancel';
  partner_id: [number, string];
  scheduled_date: string;
  date_done?: string;
  move_ids_without_package: StockMove[];
  origin: string;             // Links back to sale order name
}
```

---

## 🎨 Design System

### Visual Direction: "Refined East African Commerce"
- **Palette**: Deep teal (`#0F7B7B`) primary + warm off-white (`#FAF8F5`) background + charcoal (`#1C1C1E`) text
- **Accent**: Amber gold (`#D4A017`) for CTAs and status highlights
- **Typography**: `Sora` (headings, numerals) + `DM Sans` (body) — loaded via `next/font/google`
- **Motion**: Subtle fade-up on page load, slide-in for modals, smooth status badge transitions
- **Tables**: Clean hairline borders, alternating row tint, sticky header on scroll

### Status Badge Colors

```typescript
const STATUS_COLORS = {
  draft:     'bg-stone-100 text-stone-600',
  sent:      'bg-blue-50 text-blue-700',
  sale:      'bg-teal-50 text-teal-700',
  posted:    'bg-green-50 text-green-700',
  done:      'bg-emerald-50 text-emerald-800',
  cancel:    'bg-red-50 text-red-600',
};
```

### WorkflowBar Component

Show pipeline progress at top of every document page:
```
[Quotation] ──▶ [Proforma] ──▶ [Purchase Order] ──▶ [Tax Invoice] ──▶ [Delivery Note]
     ✓                ✓               ●                    ○                  ○
```
- ✓ = completed (teal filled circle)
- ● = current (amber outline)
- ○ = pending (grey)

---

## 📋 PDF Design Specification

Match the Jensen Automations sample document style:

### PDF Layout (per document)
```
┌─────────────────────────────────────────────────────┐
│  [LOGO]    COMPANY NAME (bold)                       │
│            TIN · VRN · Address · Phone · Email       │
├──────────────────────┬──────────────────────────────┤
│  ADDRESS             │  SHIP TO          [DOC TYPE] │
│  Client name         │  Delivery address  [Doc No.] │
│  P.O Box             │                   [Date]     │
│                      │                   [Exp Date] │
├──────────────────────┴──────────────────────────────┤
│  SHIP VIA: Sea & Air Freight    TRACKING: TZ26-1555  │
├──────────┬──────────┬──────────────────┬────┬───────┤
│ DATE     │ ACTIVITY │ DESCRIPTION      │QTY │AMOUNT │
├──────────┼──────────┼──────────────────┼────┼───────┤
│ ...rows...                                          │
├─────────────────────────────────────────────────────┤
│                          SUBTOTAL:   34,156,875.29  │
│                          DISCOUNT:     -239,098.13  │
│                          TAX (18%):  6,105,199.88   │
│                          TOTAL TZS: 40,022,977.04   │
├─────────────────────────────────────────────────────┤
│  Bank: CRDB BANK · Account: 015C001GAEC00            │
│  Swift: CORUTZTZ · Branch: UDSM · Sort: 3386         │
└─────────────────────────────────────────────────────┘
```

### PDF Color Scheme
- Header background: `#0F7B7B` (teal) with white text
- Table header: `#0F7B7B` with white text
- Alternating rows: `#FFFFFF` / `#F5F9F9`
- Totals row highlight: `#E8F4F4`
- Document type badge: teal filled rectangle (top right)

---

## 🚀 Development Phases

### Phase 1: Foundation (Week 1)
- [ ] `npx create-next-app@latest odooflow --typescript --tailwind --app`
- [ ] Install deps: `zustand`, `react-hook-form`, `zod`, `@react-pdf/renderer`, `lucide-react`
- [ ] Set up `/api/odoo` proxy route
- [ ] Build `lib/odoo/client.ts` and `lib/odoo/auth.ts`
- [ ] Login page → stores session cookie → redirects to dashboard
- [ ] Sidebar + WorkflowBar layout shell

### Phase 2: Quotations (Week 1-2)
- [ ] List quotations from `sale.order` (state=draft)
- [ ] Create new quotation form (customer picker, line items, dates)
- [ ] Edit / delete line items with live totals calculation
- [ ] "Confirm Order" button → calls `action_confirm()`
- [ ] Quotation PDF generation with Jensen-style layout

### Phase 3: Proforma → Invoice (Week 2)
- [ ] Proforma PDF (same data as quotation, different header label)
- [ ] "Create Invoice" flow → `_create_invoices()`
- [ ] Tax Invoice detail view with `account.move` data
- [ ] "Validate Invoice" → `action_post()`
- [ ] Tax Invoice PDF with TRA tax summary block

### Phase 4: Purchase Orders (Week 3)
- [ ] `purchase.order` list + detail views
- [ ] Create PO from scratch or linked to sale
- [ ] Purchase Order PDF

### Phase 5: Delivery Notes (Week 3)
- [ ] `stock.picking` list + detail
- [ ] Delivery confirmation UI
- [ ] Delivery Note PDF (product list, quantities, serial numbers if applicable)

### Phase 6: Polish + Deploy (Week 4)
- [ ] Dashboard with KPI cards (open quotes, unpaid invoices, pending deliveries)
- [ ] Search, filter, pagination on all list views
- [ ] Mobile-responsive layout
- [ ] Vercel deployment + environment variable setup
- [ ] Error boundary + toast notifications for Odoo errors

---

## ⚙️ Odoo 18 Setup Checklist

Before starting development, ensure your Odoo 18 instance has:

1. **CORS configured** — Add your Vercel domain to allowed origins in Odoo system settings, OR use the Next.js proxy (recommended — avoids CORS entirely).

2. **API user created** — Create a dedicated Odoo user with minimal permissions:
   - Sales: read/write on `sale.order`
   - Purchase: read/write on `purchase.order`
   - Accounting: read/write on `account.move`
   - Inventory: read/write on `stock.picking`

3. **Custom fields** (optional but recommended):
   ```python
   # Add to sale.order via Odoo Studio or custom module
   x_tracking_no = fields.Char("Tracking No.")
   x_delivery_time = fields.Char("Delivery Time")
   x_ship_via = fields.Char("Ship Via")
   x_part_make = fields.Char("Make/Origin")
   ```

4. **Company details** — Ensure `res.company` has:
   - Logo uploaded
   - TIN, VRN populated (via `vat` field)
   - Bank account details linked

5. **Tax configured** — 18% VAT tax (`account.tax`) mapped correctly to invoice lines.

---

## 🧪 Key Odoo RPC Calls Reference

```typescript
// Fetch sale orders (quotations)
await odooCall('sale.order', 'search_read', 
  [[['state', 'in', ['draft', 'sent']]]],
  { fields: ['name', 'partner_id', 'date_order', 'amount_total', 'state'], limit: 50 }
);

// Confirm a quotation
await odooCall('sale.order', 'action_confirm', [[orderId]]);

// Create invoice from sale order
await odooCall('sale.order', 'action_move_create', [[orderId]]);
// OR for Odoo 18:
await odooCall('sale.advance.payment.inv', 'create_invoices', 
  [], { active_ids: [orderId] }
);

// Post (validate) an invoice
await odooCall('account.move', 'action_post', [[invoiceId]]);

// Validate delivery
await odooCall('stock.picking', 'button_validate', [[pickingId]]);

// Get customer list for dropdown
await odooCall('res.partner', 'search_read',
  [[['customer_rank', '>', 0]]],
  { fields: ['id', 'name', 'street', 'city', 'email', 'phone'], limit: 100 }
);

// Get products for line item picker
await odooCall('product.product', 'search_read',
  [[['sale_ok', '=', true]]],
  { fields: ['id', 'name', 'list_price', 'uom_id', 'default_code'], limit: 200 }
);
```

---

## 🎯 Agent Instructions

When building this project, follow these rules:

1. **Always proxy Odoo calls** through `/api/odoo` — never call Odoo directly from the browser.

2. **Type everything** — all Odoo responses must have TypeScript interfaces in `types/odoo.ts`.

3. **Optimistic UI** — update the UI immediately on actions, roll back on error. Use Zustand for this.

4. **PDF fidelity** — PDFs must match the Jensen Automations sample: teal headers, clean table, totals block, bank details footer. Use `@react-pdf/renderer` with `Sora` font.

5. **Error handling** — Odoo returns errors in `result.error`. Always parse and surface these as human-readable toasts, not raw JSON.

6. **No OWL unless necessary** — OWL (Odoo Web Library) is only needed if embedding actual Odoo widgets. For this project, replicate the UI in React instead. Only consider OWL for the Chatter/activity log widget if needed.

7. **Currency formatting** — All amounts are TZS (Tanzanian Shillings). Format as `TZS 40,022,977.04`. Use `Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS' })`.

8. **Date formatting** — Odoo returns dates as `YYYY-MM-DD`. Display as `DD/MM/YYYY` (East African convention).

9. **Line item calculations** — Always compute `amount = qty × rate × (1 - discount/100)` locally in real-time; don't round-trip to Odoo for every keystroke. Sync on save.

10. **Vercel deployment** — All env vars with `ODOO_` prefix must be set in Vercel project settings. Never prefix them with `NEXT_PUBLIC_`.

---

## 🔐 Authentication Flow

```
1. User visits /login
2. POST credentials to /api/auth/login
3. Server calls Odoo: POST /web/session/authenticate
4. Odoo returns session_id cookie
5. Store session_id in httpOnly cookie via Next.js response
6. All subsequent /api/odoo calls attach this cookie
7. On 401 from Odoo → clear cookie → redirect to /login
```

---

## 📦 package.json Dependencies

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "typescript": "^5.4.0",
    "@react-pdf/renderer": "^3.4.0",
    "zustand": "^4.5.0",
    "react-hook-form": "^7.51.0",
    "zod": "^3.23.0",
    "lucide-react": "^0.378.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.3.0",
    "date-fns": "^3.6.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

## 🚦 Getting Started (Run This First)

```bash
# 1. Create the Next.js app
npx create-next-app@latest odooflow \
  --typescript \
  --tailwind \
  --app \
  --src-dir=false \
  --import-alias="@/*"

cd odooflow

# 2. Install all dependencies
npm install @react-pdf/renderer zustand react-hook-form zod \
  lucide-react clsx tailwind-merge date-fns

# 3. Create environment file
cat > .env.local << EOF
ODOO_URL=https://localhost:8069
ODOO_DB=jensenintl
EOF

# 4. Drop agent.md in root (you've already done this)

# 5. Start building — Phase 1 first!
npm run dev
```

---

*Built for Jensen Automations Technology Limited workflow. Powered by Odoo 18 + Next.js 14.*
