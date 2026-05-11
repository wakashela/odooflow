# OdooFlow

A Next.js application that wraps Odoo business documents behind a custom UI — Quotations, Invoices, Purchase Orders, Delivery Notes, and Packing Lists — with live PDF generation and branded document output.

## Features

- **Documents** — Manage Quotations, Proforma Invoices, Purchase Orders, Invoices, Delivery Notes, Packing Lists
- **PDF Generation** — Professional, branded PDFs for every document type with customizable colors and company branding
- **Settings** — Configure company name, address, logo, bank details, and PDF color scheme from the UI
- **Optimistic UI** — Instant feedback with automatic rollback on error
- **Odoo-native auth** — Uses your existing Odoo session cookies, no separate login

---

## Quick Setup

### 1. Clone & Install

```bash
git clone <repo-url> odooflow
cd odooflow
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
ODOO_URL=https://your-odoo-instance.com   # or http://localhost:8069 for local dev
ODOO_DB=your_database_name
ODOO_USER=your_username
ODOO_PASSWORD=your_password
```

### 3. Set up Odoo

Run the setup script — it configures your Odoo database for OdooFlow in one step:

```bash
python scripts/setup_odoo.py
```

The script will:
1. Verify the Odoo connection
2. Authenticate with your credentials
3. Create custom bank fields on `res.partner.bank` (for TZS/USD account numbers, branch, sort code)
4. Set your company name, address, phone, email, and VAT number
5. Upload `public/logo.png` as your company logo in Odoo
6. Configure the default PDF color scheme via `ir.config_parameter`
7. Ask whether to install demo data — choose `y` to install `sale`, `purchase`, `account`, and `stock` with sample data

> **Credentials note:** The setup script requires full Odoo login credentials (username + password). API keys are not supported by the XML-RPC endpoint used here.

### 4. Start the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with your Odoo credentials.

---

## Odoo Setup Guide

### Prerequisites

- **Odoo 14+** (tested on Odoo 18)
- **Required apps:** `sale`, `purchase`, `account`, `stock` (standard Odoo apps — install from Odoo Apps)
- **Python 3.9+** (for the setup script)
- Odoo must be accessible from the machine running the setup script

### What the Setup Script Configures

| What | Odoo Model | Notes |
|------|-----------|-------|
| Custom bank fields | `res.partner.bank` | `x_tzs_account`, `x_usd_account`, `x_branch`, `x_sort_code` |
| Company profile | `res.company` (1st record) | name, street, city, zip, phone, email, VAT, logo |
| Bank account | `res.partner.bank` | linked to company partner |
| PDF colors | `ir.config_parameter` | `odooflow.pdf.primary`, `odooflow.pdf.primary_dark`, `odooflow.pdf.accent` |
| Demo data | Odoo apps | `base`, `sale`, `purchase`, `account`, `stock` with sample records |

### Customizable Environment Variables

Override defaults in `.env.local` to pre-fill company details before running the script:

```env
ODOO_URL=https://your-odoo-instance.com
ODOO_DB=your_database_name
ODOO_USER=admin
ODOO_PASSWORD=your_password

# Optional — pre-fill company details (the script will use these)
ODOO_COMPANY_NAME=Your Company Ltd
ODOO_COMPANY_STREET=123 Business Park
ODOO_COMPANY_CITY=Dar es Salaam
ODOO_COMPANY_ZIP=
ODOO_COMPANY_PHONE=+255700000000
ODOO_COMPANY_EMAIL=info@yourcompany.com
ODOO_COMPANY_VAT=TIN: 123-456-789

# Optional — override PDF colors
ODOOFLOW_PDF_PRIMARY=#0A9688
ODOOFLOW_PDF_PRIMARY_DARK=#00796B
ODOOFLOW_PDF_ACCENT=#F57F17
```

### Manual Setup (Without the Script)

If you prefer to set things up manually in Odoo, here are the equivalent steps using curl:

#### 1. Authenticate

```bash
# Replace the placeholders and run:
curl -s -X POST https://your-odoo-instance.com/jsonrpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "call",
    "id": 1,
    "params": {
      "service": "common",
      "method": "authenticate",
      "args": ["your_database", "admin", "your_password", {}]
    }
  }'
# Returns the user id (uid), e.g. 2. Use this uid in all subsequent calls.
```

#### 2. Create Custom Bank Fields

Create these four fields on `res.partner.bank` via **Settings → Technical → Database Structure → Fields/Columns → Create**:

| Field Name | Label | Type |
|-----------|-------|------|
| `x_tzs_account` | TZS Account | Char |
| `x_usd_account` | USD Account | Char |
| `x_branch` | Branch | Char |
| `x_sort_code` | Sort Code | Char |

State must be set to **Custom** (not Base).

#### 3. Set Company Details

Go to **Settings → General Settings → Manage Companies → Edit** your company:
- **Company Name**, **Address**, **Phone**, **Email**, **VAT**
- **Logo** — upload `public/logo.png` from the project root

#### 4. Create a Bank Account

Go to **Settings → Accounting → Bank Accounts → Create**:
- **Bank** — e.g. `CRDB BANK`
- **Account Number** — e.g. `015C001GAEC00`
- **Account Holder** — your company name
- **SWIFT/BIC** — e.g. `CORUTZTZ`
- Fill in the custom fields: TZS Account, USD Account, Branch, Sort Code

#### 5. Set PDF Colors

Go to **Settings → Technical → Parameters → System Parameters → Create**:

| Key | Value |
|----|-------|
| `odooflow.pdf.primary` | `#0A9688` |
| `odooflow.pdf.primary_dark` | `#00796B` |
| `odooflow.pdf.accent` | `#F57F17` |

#### 6. Enable Demo Data

**Option A — Fresh database (recommended):** When creating a new Odoo database, check **"Demonstrative data"**.

**Option B — Existing database:** Go to **Settings → Apps →** search for and install modules: `sale`, `purchase`, `account`, `stock` one by one. Demo data loads automatically when the app is installed on a fresh DB.

---

## Project Structure

```
app/           — Next.js App Router pages and API routes
components/   — UI components, document views, PDF templates
lib/           — Odoo RPC client, PDF styles, utilities
store/         — Zustand stores for auth and document state
types/         — TypeScript definitions for Odoo models
public/        — Static assets (logo, icons)
scripts/       — Utility scripts
  setup_odoo.py   — Odoo first-time setup (Python, zero deps)
  seed-data.ts     — Test data generator (Node.js, requires .env.local)
```

## Available Scripts

```bash
npm run dev    # Start development server
npm run build  # Production build (runs tsc + next build)
npm run lint   # ESLint
```

## License

This project is proprietary and confidential.
