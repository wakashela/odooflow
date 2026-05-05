# GEMINI.md - OdooFlow Instructional Context

## Project Overview
OdooFlow is a specialized Next.js application that provides a streamlined, elegant frontend for Odoo 18 business workflows. It is designed to hide Odoo's complexity, focusing on the document lifecycle: **Quotation → Proforma Invoice → Purchase Order → Tax Invoice → Delivery Note**.

### Core Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (v5+)
- **React**: v19
- **Styling**: Tailwind CSS v4 with `@tailwindcss/postcss`
- **State Management**: Zustand
- **PDF Engine**: `@react-pdf/renderer`
- **Odoo Integration**: Custom JSON-RPC 2.0 client via server-side API proxy

## Building and Running
- **Install Dependencies**: `npm install`
- **Development**: `npm run dev`
- **Build**: `npm run build` (Includes `tsc` type checking and Next.js build)
- **Lint**: `npm run lint` (ESLint)
- **Tests**: None configured. **Validation must be done manually or via reproduction scripts.**

## Architectural Patterns

### Odoo RPC Architecture
- **Proxy Pattern**: Never call Odoo directly from the browser. All calls must go through the `/api/odoo` proxy route.
- **Client**: Use `odooCall<T>(model, method, args, kwargs)` from `@/lib/odoo/client`.
- **Authentication**: Odoo session cookies are managed server-side and stored in `httpOnly` cookies.

### State & Data Flow
- **Zustand Stores**:
  - `authStore`: Manages session info and loading states.
  - `documentStore`: Holds the state of the document currently being viewed or edited.
- **Optimistic UI**: Implement immediate UI updates for user actions and roll back on Odoo error responses.

### Document Mappings
| Document | Odoo Model | Key States |
| :--- | :--- | :--- |
| Quotations | `sale.order` | draft, sent, sale, cancel |
| Invoices | `account.move` | draft, posted, cancel |
| Purchase Orders | `purchase.order` | draft, purchase, done, cancel |
| Delivery | `stock.picking` | draft, confirmed, assigned, done |

## Development Conventions

### Coding Standards
- **Path Alias**: Use `@/*` for absolute imports (e.g., `@/lib`, `@/components`).
- **Typing**: Rigorously type all Odoo RPC responses in `types/odoo.ts`.
- **Calculations**: Compute line item amounts (`qty * price * (1 - discount/100)`) client-side in real-time using `computeLineAmount`.

### Formatting & UI
- **Currency**: Tanzanian Shilling (TZS). Use `formatCurrency()` from `@/lib/utils`.
- **Dates**: Odoo uses `YYYY-MM-DD`. Display as `DD/MM/YYYY` using `formatDate()` from `@/lib/utils`.
- **Typography**: 
  - Headings: `Fraunces`
  - Body: `DM Sans`
- **Design System**: "Refined East African Commerce" - Teal (#0F7B7B) primary color, off-white background, soft rounded corners.

### PDF Generation
- Components are located in `components/pdf/`.
- Shared styles are in `lib/pdf/styles.ts`.
- Branded headers and footers (bank details) must match Jensen Automations specifications.

## Strategic Guidelines
- **Security**: Never expose `ODOO_URL`, `ODOO_DB`, or credentials to the client. Keep them in `.env.local` and prefix nothing with `NEXT_PUBLIC_`.
- **Error Handling**: Odoo error messages are nested. Always check `error.data.message` before falling back to `error.message`.
- **Trust the Code**: If `agent.md` (the original spec) conflicts with the actual implementation (e.g., Next.js versions, fonts), **the code is the source of truth.**

## Strategic Re-evaluation
If you fail to resolve a bug or implement a feature after 3 attempts:
1. Stop and verify the Odoo model and method signatures. Odoo 18 may have breaking changes from older versions.
2. Check the server-side API logs for the raw JSON-RPC request/response.
3. Verify if the issue is a TypeScript mismatch between the UI types and the actual Odoo ORM return values.
