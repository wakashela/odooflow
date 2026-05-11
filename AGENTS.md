# AGENTS.md — OdooFlow

## Commands

```bash
npm run dev       # Start dev server
npm run build     # Production build (also runs tsc)
npm run lint      # ESLint (eslint-config-next + typescript rules)
```

No test runner configured. No `npm test`.

## Verification

`lint` currently reports errors and warnings (unused vars, require imports in PDF script). Run `npm run lint` before committing to avoid regressions, but don't expect a clean baseline.

TypeScript compiles clean (`npx tsc --noEmit` passes).

## Architecture

Next.js 16 App Router app that wraps Odoo 18 business documents behind a custom UI. All Odoo RPC calls are proxied through `app/api/odoo/route.ts` — **never call Odoo directly from the browser**. Auth uses Odoo session cookies stored server-side via `app/api/auth/`.

### Odoo RPC flow

1. Browser calls `lib/odoo/client.ts:odooCall()` → POST to `/api/odoo`
2. Server route attaches `session_id` cookie from `odoo_session_id` → forwards to Odoo `/web/dataset/call_kw`
3. Error shape: `{ error: { data: { message }, message } }` — always parse `data.message` first

### Document models

| UI page | Odoo model | Key states |
|---|---|---|
| Quotations | `sale.order` | draft → sent → sale → cancel |
| Invoices | `account.move` (out_invoice) | draft → posted → cancel |
| Purchase Orders | `purchase.order` | draft → sent → purchase → done → cancel |
| Delivery | `stock.picking` | draft → confirmed → assigned → done → cancel |
| Customers | `res.partner` | — |
| Products | `product.product` | — |

### Workflow transitions

- Confirm quote: `sale.order.action_confirm([[id]])`
- Create invoice: `sale.advance.payment.inv.create_invoices([], {active_ids})`
- Post invoice: `account.move.action_post([[id]])`
- Validate delivery: `stock.picking.button_validate([[id]])`

### Line item writes

Odoo ORM commands for one2many fields: `[0, 0, {...}]` = create, `[1, id, {...}]` = update, `[2, id, false]` = delete. See `lib/odoo/sale.ts:createQuotation` for the pattern.

## Path alias

`@/*` maps to project root (`tsconfig.json` paths). Use `@/lib/...`, `@/components/...`, `@/types/...`, `@/store/...`.

## Key conventions

- **Currency**: TZS (Tanzanian Shilling). Use `formatCurrency()` from `lib/utils.ts` — already configured with `Intl.NumberFormat('en-TZ')`.
- **Dates**: Odoo returns `YYYY-MM-DD`. Display as `DD/MM/YYYY` via `formatDate()` from `lib/utils.ts`.
- **Line amount**: Compute client-side as `qty * price * (1 - discount/100)` — don't round-trip to Odoo per keystroke. Use `computeLineAmount()` from `lib/utils.ts`.
- **Odoo relation fields**: Many2one fields come as `[number, string]`. Use `odooRelationLabel()` / `odooRelationId()` from `lib/utils.ts`. False/null means not set.
- **Optimistic UI**: Update Zustand stores immediately, roll back on Odoo error.
- **Env vars**: `ODOO_URL`, `ODOO_DB` are server-only. Never prefix with `NEXT_PUBLIC_`. Session cookies are `httpOnly`.

## Fonts

`Fraunces` (headings via `--font-display`) + `DM Sans` (body via `--font-body`), loaded via `next/font/google` in `app/layout.tsx`. **Not** Sora as mentioned in `agent.md` — Fraunces is the actual font in use.

## CSS

Tailwind CSS v4 with `@tailwindcss/postcss`. Theme colors defined as CSS variables in `app/globals.css` and exposed to Tailwind via `@theme inline`. Use `--color-primary`, `--color-accent`, `--color-bg`, etc. — not the teal palette from `agent.md`.

## PDF generation

`@react-pdf/renderer` components in `components/pdf/`. Shared styles in `lib/pdf/styles.ts`, logo in `lib/pdf/logo.ts`. Server-side PDF endpoint at `app/api/pdf/`. The `scripts/generate-sample-pdf.js` script can generate a sample PDF but has lint issues (require imports).

## Scripts

- `scripts/setup_odoo.py` — Configures a fresh Odoo database for OdooFlow (Python stdlib, no deps). Run once after cloning: `python scripts/setup_odoo.py`
- `scripts/seed-data.ts` — Creates test data for development (customers, products, quotations, POs, invoices, deliveries)
- `scripts/generate-sample-pdf.js` — Generates a sample PDF to verify header layout (uses `require`, has lint warnings)

## State management

Zustand stores in `store/`:
- `authStore.ts` — session info, loading state
- `documentStore.ts` — current document being edited

## Reference

`agent.md` contains the original project spec and design vision. Where it conflicts with actual code (fonts, colors, dependency versions), **trust the code**. Current Next.js is v16 (not v14), React v19, Tailwind v4, Zod v4.
