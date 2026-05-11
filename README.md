# OdooFlow

A Next.js application that wraps Odoo business documents behind a custom UI — Quotations, Invoices, Purchase Orders, Delivery Notes, and Packing Lists — with live PDF generation and branded document output.

## Features

- **Documents** — Manage Quotations, Proforma Invoices, Purchase Orders, Invoices, Delivery Notes, Packing Lists
- **PDF Generation** — Professional, branded PDFs for every document type with customizable colors and company branding
- **Settings** — Configure company name, address, logo, bank details, and PDF color scheme
- **Optimistic UI** — Instant feedback with automatic rollback on error
- **Odoo-native auth** — Uses your existing Odoo session cookies, no separate login

## Quick Setup

### 1. Clone & Install

```bash
git clone <repo-url> odooflow
cd odooflow
npm install
```

### 2. Configure Environment

Copy the example env file and fill in your Odoo credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
ODOO_URL=https://your-odoo-instance.com   # or http://localhost:8069 for local
ODOO_DB=your_database_name
ODOO_USER=your_username
ODOO_PASSWORD=your_password
```

> **Note:** `ODOO_DB`, `ODOO_USER`, and `ODOO_PASSWORD` are only needed if you plan to use server-side features (PDF generation, settings). The app itself runs fully client-side and primarily needs `ODOO_URL`.

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with your Odoo credentials.

## Project Structure

```
app/           — Next.js App Router pages and API routes
components/   — UI components, document views, PDF templates
lib/           — Odoo RPC client, PDF styles, utilities
store/         — Zustand stores for auth and document state
types/         — TypeScript definitions for Odoo models
public/        — Static assets (logo, icons)
```

## Odoo Requirements

The app communicates with Odoo via its JSON-RPC API (`/web/dataset/call_kw`). Ensure your Odoo instance:

- Is accessible from where the app runs
- Has CORS enabled for the app's origin (or run behind the same domain)
- Has the following modules installed (standard in Odoo apps):
  - `sale` — Quotations, Proforma Invoices
  - `purchase` — Purchase Orders
  - `account` — Invoices
  - `stock` — Delivery Notes, Packing Lists

### Adding Custom Bank Fields (Optional)

If you want bank account numbers to appear on PDFs, add these fields to the `res.partner.bank` model in Odoo:

| Field Name      | Type     | Label       |
|----------------|----------|-------------|
| `x_tzs_account` | Char     | TZS Account |
| `x_usd_account` | Char     | USD Account |
| `x_branch`      | Char     | Branch      |
| `x_sort_code`   | Char     | Sort Code   |

### Adding PDF Color Settings (Optional)

If you want to customize PDF accent colors, add these config parameters to `ir.config_parameter`:

| Key                    | Type | Default     |
|-----------------------|------|-------------|
| `odooflow.pdf.primary`     | Char | `#0A9688`   |
| `odooflow.pdf.primary_dark` | Char | `#00796B`   |
| `odooflow.pdf.accent`       | Char | `#F57F17`   |

## Available Scripts

```bash
npm run dev    # Start development server
npm run build  # Production build (runs tsc + next build)
npm run lint   # ESLint
```

## License

This project is proprietary and confidential.
