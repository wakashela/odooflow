# OdooFlow

[![Deploy to Vercel](https://github.com/anomalyco/odooflow/actions/workflows/deploy.yml/badge.svg)](https://github.com/anomalyco/odooflow/actions/workflows/deploy.yml)
[![Test](https://github.com/anomalyco/odooflow/actions/workflows/test.yml/badge.svg)](https://github.com/anomalyco/odooflow/actions/workflows/test.yml)

### Production Deployments
[![ipatechs](https://img.shields.io/website?label=ipatechs&url=https%3A%2Fipatechs.vercel.app)](https://ipatechs.vercel.app)
[![jensen](https://img.shields.io/website?label=jensen&url=https%3A%2Fjensen-odooflow.vercel.app)](https://jensen-odooflow.vercel.app)

---

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

### 3b. Create a New Odoo Database (Optional)

If you need a fresh Odoo database, use the database creator script:

```bash
python scripts/create_database.py --db-name your_db_name --demo --master-password MASTER_PASSWORD --yes
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `--db-name NAME` | Database name to create (required) |
| `--demo` | Include demo data (sale, purchase, account, stock) |
| `--clean` | Create clean instance (no demo data) |
| `--master-password PW` | Odoo master password (required) |
| `--odoo-url URL` | Odoo server URL (defaults to ODOO_URL from env) |
| `--admin-password PW` | Admin user password (default: admin) |
| `--yes`, `-y` | Skip confirmation prompts |
| `--force`, `-f` | Overwrite existing database |
| `--skip-setup` | Skip the post-creation setup prompt |

**Examples:**

```bash
# Create database with demo data
python scripts/create_database.py --db-name jensenintl --demo --master-password 0RBrzdKG --yes

# Create clean database (no demo data)
python scripts/create_database.py --db-name mydb --clean --master-password PASSWORD --yes

# Overwrite existing database
python scripts/create_database.py --db-name jensenintl --demo --master-password 0RBrzdKG --yes --force
```

After creating the database, update your `.env.local` with the new database name and run `setup_odoo.py` to configure it.

### 4. Start the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with your Odoo credentials.

---

## 🚀 CI/CD Multi-Client Deployment

OdooFlow uses GitHub Actions to automatically deploy to multiple Vercel projects when code is pushed to `main`.

### Active Deployments

| Client | Status | URL |
|--------|--------|-----|
| ipatechs | ✅ Active | https://ipatechs-odooflow.vercel.app |
| jensen | ✅ Active | https://jensen-odooflow.vercel.app |

### How It Works

```
Push to main branch
        ↓
GitHub Actions triggers
        ↓
Test job runs (lint + type check)
        ↓
Deploy jobs run in parallel
        ↓
All clients deploy automatically 🎉
```

---

## ➕ Adding a New Client

To onboard a new client (e.g., `acme`) from this template repo:

### Step 1: Create Client Environment File

Create a new `.env` file for the client:

```bash
cp .env.example .env.acme
```

Fill in the client's Odoo credentials and company details:

```env
# .env.acme
ODOO_URL=https://odoo-acme.cloudclusters.net
ODOO_DB=acme_db
ODOO_USER=admin
ODOO_PASSWORD=admin

# Company details
ODOO_COMPANY_NAME=ACME SOLUTIONS LTD
ODOO_COMPANY_TIN=123-456-789
ODOO_COMPANY_VRN=40-123456-K
ODOO_COMPANY_ADDRESS=123 Business Street, Dar es Salaam
ODOO_COMPANY_PHONE=+255700000000
ODOO_COMPANY_EMAIL=info@acme.com
ODOO_COMPANY_WEBSITE=www.acme.com
ODOO_COMPANY_CITY=Dar es Salaam
ODOO_COMPANY_COUNTRY=Tanzania

# Brand colors (hex values)
ODOOFLOW_PDF_PRIMARY=#0A9688
ODOOFLOW_PDF_PRIMARY_DARK=#00796B
ODOOFLOW_PDF_ACCENT=#F57F17
```

> **Naming convention:** Always use lowercase for client names in filenames (`.env.acme`, not `.env.ACME`).

### Step 2: Add GitHub Secrets

Use the `gh` CLI to add secrets for the new client:

```bash
# Set all secrets for the new client (replace with actual values)
gh secret set ACME_ODOO_URL --body "https://odoo-acme.cloudclusters.net" --repo wakashela/odooflow
gh secret set ACME_ODOO_DB --body "acme_db" --repo wakashela/odooflow
gh secret set ACME_ODOO_USER --body "admin" --repo wakashela/odooflow
gh secret set ACME_ODOO_PASSWORD --body "admin" --repo wakashela/odooflow
gh secret set ACME_ODOO_COMPANY_NAME --body "ACME SOLUTIONS LTD" --repo wakashela/odooflow
gh secret set ACME_ODOO_COMPANY_TIN --body "123-456-789" --repo wakashela/odooflow
gh secret set ACME_ODOO_COMPANY_VRN --body "40-123456-K" --repo wakashela/odooflow
gh secret set ACME_ODOO_COMPANY_ADDRESS --body "123 Business Street, Dar es Salaam" --repo wakashela/odooflow
gh secret set ACME_ODOO_COMPANY_PHONE --body "+255700000000" --repo wakashela/odooflow
gh secret set ACME_ODOO_COMPANY_EMAIL --body "info@acme.com" --repo wakashela/odooflow
gh secret set ACME_ODOO_COMPANY_WEBSITE --body "www.acme.com" --repo wakashela/odooflow
gh secret set ACME_ODOO_COMPANY_CITY --body "Dar es Salaam" --repo wakashela/odooflow
gh secret set ACME_ODOO_COMPANY_COUNTRY --body "Tanzania" --repo wakashela/odooflow
gh secret set ACME_ODOOFLOW_PDF_PRIMARY --body "#0A9688" --repo wakashela/odooflow
gh secret set ACME_ODOOFLOW_PDF_PRIMARY_DARK --body "#00796B" --repo wakashela/odooflow
gh secret set ACME_ODOOFLOW_PDF_ACCENT --body "#F57F17" --repo wakashela/odooflow
```

**Or use the bulk setup script:**

```bash
# Create a script from your .env.acme file
source .env.acme
CLIENT="acme"
REPO="wakashela/odooflow"

for var in ODOO_URL ODOO_DB ODOO_USER ODOO_PASSWORD ODOO_COMPANY_NAME ODOO_COMPANY_TIN ODOO_COMPANY_VRN ODOO_COMPANY_ADDRESS ODOO_COMPANY_PHONE ODOO_COMPANY_EMAIL ODOO_COMPANY_WEBSITE ODOO_COMPANY_CITY ODOO_COMPANY_COUNTRY ODOOFLOW_PDF_PRIMARY ODOOFLOW_PDF_PRIMARY_DARK ODOOFLOW_PDF_ACCENT; do
  value="${!var}"
  secret_name="${CLIENT}_${var}"
  echo "Setting $secret_name..."
  echo "$value" | gh secret set "$secret_name" --repo "$REPO"
done
```

### Step 3: Update Deployment Workflow

Edit `.github/workflows/deploy.yml` and add the new client to the matrix:

```yaml
strategy:
  matrix:
    include:
      - client: ipatechs
        project_name: ipatechs-odooflow
      - client: jensen
        project_name: jensen-odooflow
      - client: acme        # ← ADD THIS
        project_name: acme-odooflow  # ← ADD THIS
```

### Step 4: Create Vercel Project

```bash
# Using Vercel CLI (must be logged in)
vercel projects add acme-odooflow

# Or via the Vercel Dashboard:
# 1. Go to https://vercel.com/new
# 2. Import your GitHub repository
# 3. Set project name to: acme-odooflow
# 4. Framework: Next.js
# 5. Deploy (first deploy can be manual)
```

### Step 5: Deploy

Push the workflow changes to trigger deployment for all clients:

```bash
git add .github/workflows/deploy.yml .env.acme
git commit -m "feat: add acme client to CI/CD"
git push origin main
```

The GitHub Action will automatically:
1. Run tests (lint + type check)
2. Deploy to `ipatechs-odooflow.vercel.app`
3. Deploy to `jensen-odooflow.vercel.app`
4. Deploy to `acme-odooflow.vercel.app` 🎉

### Client Checklist

- [ ] Create `.env.{client}` file with all credentials
- [ ] Add all `{CLIENT}_*` secrets to GitHub
- [ ] Add client to deploy matrix in `.github/workflows/deploy.yml`
- [ ] Create Vercel project: `{client}-odooflow`
- [ ] Push changes to trigger deployment
- [ ] Verify deployment at `https://{client}-odooflow.vercel.app`

### Troubleshooting New Clients

**"Project not found" error:**
- Make sure the Vercel project exists with the exact name used in the workflow
- Check that `VERCEL_TOKEN` and `VERCEL_ORG_ID` secrets are set

**Environment variables not working:**
- Verify secret names match exactly: `{CLIENT}_ODOO_URL` (uppercase client name)
- Check the `.env.{client}` file has all required variables

**Deployment succeeds but app shows errors:**
- Verify Odoo credentials are correct
- Check that the Odoo instance is accessible from Vercel's servers
- Review the GitHub Actions logs for specific errors

---

## 🔧 CI/CD Architecture

```
Single GitHub Repository (wakashela/odooflow)
                │
                ├── .github/workflows/test.yml (Lint + Type Check)
                └── .github/workflows/deploy.yml (Matrix Deployment)
                            │
                            ├── Client: ipatechs → ipatechs-odooflow.vercel.app
                            ├── Client: jensen   → jensen-odooflow.vercel.app
                            └── Client: acme     → acme-odooflow.vercel.app
```

### Required GitHub Secrets

| Secret | Description | How to Get |
|--------|-------------|------------|
| `VERCEL_TOKEN` | Vercel API token | https://vercel.com/account/tokens |
| `VERCEL_ORG_ID` | Vercel team/org ID | `vercel teams list` |
| `{CLIENT}_ODOO_URL` | Odoo instance URL | From your Odoo host |
| `{CLIENT}_ODOO_DB` | Database name | From Odoo |
| `{CLIENT}_ODOO_*` | Other credentials | From `.env.{client}` |

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

# Optional — client-specific assets
# Set to match a folder name in public/assets/ (e.g., "jensen" or "ipatechs")
# Assets in that folder (logo.png, logo-icon.ico) will be used automatically
ODOOFLOW_CLIENT=jensen
NEXT_PUBLIC_ODOOFLOW_CLIENT=jensen
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
scripts/         — Utility scripts
  setup_odoo.py     — Odoo first-time setup (Python, zero deps)
  create_database.py — Create new Odoo databases via XML-RPC
  seed-data.ts      — Test data generator (Node.js, requires .env.local)
```

## Available Scripts

```bash
npm run dev    # Start development server
npm run build  # Production build (runs tsc + next build)
npm run lint   # ESLint
```

## License

This project is proprietary and confidential.
