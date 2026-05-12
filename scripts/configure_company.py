#!/usr/bin/env python3
"""
Configure Company & Bank Details for OdooFlow
==============================================
Reads company details from .env.jensenintl and populates Odoo.

Usage:
    python scripts/configure_company.py
"""

import os
import sys
import xmlrpc.client

BLUE = "\033[94m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BOLD = "\033[1m"
RESET = "\033[0m"


def load_env(path: str) -> dict:
    env = {}
    if not os.path.exists(path):
        return env
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, val = line.partition("=")
            val = val.strip().strip('"').strip("'")
            env[key.strip()] = val
    return env


def get_project_root() -> str:
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def info(msg: str) -> None:
    print(f"{BLUE}[INFO]{RESET}  {msg}")


def ok(msg: str) -> None:
    print(f"{GREEN}[OK]{RESET}   {msg}")


def warn(msg: str) -> None:
    print(f"{YELLOW}[WARN]{RESET} {msg}")


def fail(msg: str) -> None:
    print(f"{RED}[FAIL]{RESET} {msg}")


def step(num: int, title: str) -> None:
    print(f"\n{BOLD}Step {num}: {title}{RESET}")


def main():
    root = get_project_root()
    env = load_env(os.path.join(root, ".env.jensenintl"))

    ODOO_URL = env.get("ODOO_URL", "").rstrip("/")
    ODOO_DB = env.get("ODOO_DB", "")
    ODOO_USER = env.get("ODOO_USER", "")
    ODOO_PASSWORD = env.get("ODOO_PASSWORD", "")

    if not all([ODOO_URL, ODOO_DB, ODOO_USER, ODOO_PASSWORD]):
        fail("Missing required Odoo credentials in .env.jensenintl")
        sys.exit(1)

    print(f"{BOLD}{'=' * 50}{RESET}")
    print(f"{BOLD}OdooFlow - Configure Company & Bank Details{'=' * 50}{RESET}")
    print(f"{BOLD}{'=' * 50}{RESET}")
    info(f"URL: {ODOO_URL}")
    info(f"Database: {ODOO_DB}")

    # Connect
    common = xmlrpc.client.ServerProxy(f"{ODOO_URL}/xmlrpc/2/common", allow_none=True)
    uid = common.authenticate(ODOO_DB, ODOO_USER, ODOO_PASSWORD, {})
    if not uid:
        fail("Authentication failed")
        sys.exit(1)
    ok(f"Authenticated (uid={uid})")

    models = xmlrpc.client.ServerProxy(f"{ODOO_URL}/xmlrpc/2/object", allow_none=True)

    def call(model, method, args, kwargs=None):
        return models.execute_kw(ODOO_DB, uid, ODOO_PASSWORD, model, method, args, kwargs or {})

    # Get company details from env
    company_name = env.get("ODOO_COMPANY_NAME", "")
    company_tin = env.get("ODOO_COMPANY_TIN", "")
    company_vrn = env.get("ODOO_COMPANY_VRN", "")
    company_address = env.get("ODOO_COMPANY_ADDRESS", "")
    company_phone = env.get("ODOO_COMPANY_PHONE", "")
    company_email = env.get("ODOO_COMPANY_EMAIL", "")
    company_website = env.get("ODOO_COMPANY_WEBSITE", "")
    company_city = env.get("ODOO_COMPANY_CITY", "")
    company_country = env.get("ODOO_COMPANY_COUNTRY", "Tanzania")

    # Bank details from user input
    bank_name = "CRDB BANK"
    bank_bic = "CORUTZTZ"
    acc_holder_name = company_name
    acc_number = "015C001GAEC00"
    x_tzs_account = "015C001GAEC00"
    x_usd_account = "025C001GAEC00"
    x_branch = "UDSM Branch"
    x_sort_code = "3386"

    step(1, "Find company record")
    company_ids = call("res.company", "search", [[]], {"limit": 1})
    if not company_ids:
        fail("No company found")
        sys.exit(1)
    company_id = company_ids[0]
    ok(f"Found company (id={company_id})")

    # Get current company data
    company_data = call("res.company", "read", [company_id], {})[0]
    old_name = company_data.get("name", "")
    info(f"Current name: {old_name}")

    step(2, "Update company details")

    # Parse address - extract street and city
    address_parts = company_address.split(",")
    street = address_parts[0].strip() if address_parts else ""
    city = company_city

    # Find Tanzania country
    country_ids = call("res.country", "search", [[["name", "ilike", "Tanzania"]]], {"limit": 1})
    country_id = country_ids[0] if country_ids else None

    company_vals = {
        "name": company_name,
        "street": street,
        "city": city,
        "phone": company_phone,
        "email": company_email,
        "website": company_website,
        "vat": company_vrn,
    }
    if country_id:
        company_vals["country_id"] = country_id

    call("res.company", "write", [company_id, company_vals])
    ok("Company details updated")

    step(3, "Find company partner")
    partner_id = company_data.get("partner_id", [None, None])[0]
    if not partner_id:
        # Get partner linked to company
        partner_ids = call("res.partner", "search", [[["company_id", "=", company_id]]], {"limit": 1})
        partner_id = partner_ids[0] if partner_ids else None

    if not partner_id:
        fail("No partner found for company")
        sys.exit(1)
    ok(f"Found company partner (id={partner_id})")

    step(4, "Update partner with TIN")
    partner_vals = {
        "name": company_name,
        "vat": company_tin,
        "street": street,
        "city": city,
        "phone": company_phone,
        "email": company_email,
        "is_company": True,
    }
    if country_id:
        partner_vals["country_id"] = country_id

    call("res.partner", "write", [partner_id, partner_vals])
    ok("Partner details updated")

    # Create custom x_tin field if it doesn't exist
    step(5, "Ensure custom TIN field exists")
    try:
        field_ids = call("ir.model.fields", "search", [
            [["model", "=", "res.partner"], ["name", "=", "x_tin"]]
        ], {"limit": 1})
        if not field_ids:
            model_ids = call("ir.model", "search", [[["model", "=", "res.partner"]]], {"limit": 1})
            if model_ids:
                call("ir.model.fields", "create", [{
                    "model_id": model_ids[0],
                    "name": "x_tin",
                    "field_description": "TIN",
                    "ttype": "char",
                    "state": "manual",
                }])
                ok("Created x_tin field on res.partner")
            else:
                warn("Could not find res.partner model")
        else:
            ok("x_tin field already exists")
    except Exception as e:
        warn(f"Could not create x_tin field: {e}")

    # Update partner with x_tin
    try:
        call("res.partner", "write", [partner_id, {"x_tin": company_tin}])
        ok("TIN set on partner")
    except Exception as e:
        warn(f"Could not set x_tin: {e}")

    step(6, "Create bank account")
    # Check if bank account exists
    existing_banks = call("res.partner.bank", "search", [[["partner_id", "=", partner_id]]], {})
    if existing_banks:
        warn(f"Bank account already exists (id={existing_banks[0]}), updating...")
        call("res.partner.bank", "write", [existing_banks[0], {
            "bank_name": bank_name,
            "acc_holder_name": acc_holder_name,
            "acc_number": acc_number,
            "bank_bic": bank_bic,
            "x_tzs_account": x_tzs_account,
            "x_usd_account": x_usd_account,
            "x_branch": x_branch,
            "x_sort_code": x_sort_code,
        }])
        ok("Bank account updated")
    else:
        bank_id = call("res.partner.bank", "create", [{
            "partner_id": partner_id,
            "bank_name": bank_name,
            "acc_holder_name": acc_holder_name,
            "acc_number": acc_number,
            "bank_bic": bank_bic,
            "x_tzs_account": x_tzs_account,
            "x_usd_account": x_usd_account,
            "x_branch": x_branch,
            "x_sort_code": x_sort_code,
        }])
        ok(f"Bank account created (id={bank_id})")

    step(7, "Verify configuration")
    company_updated = call("res.company", "read", [company_id], {})[0]
    print(f"  Company Name: {company_updated.get('name')}")
    print(f"  Phone: {company_updated.get('phone')}")
    print(f"  Email: {company_updated.get('email')}")
    print(f"  VAT: {company_updated.get('vat')}")

    banks = call("res.partner.bank", "search_read", [[["partner_id", "=", partner_id]]], {})
    if banks:
        print(f"  Bank: {banks[0].get('bank_name')}")
        print(f"  Account: {banks[0].get('acc_number')}")
        print(f"  TZS Account: {banks[0].get('x_tzs_account')}")
        print(f"  USD Account: {banks[0].get('x_usd_account')}")

    print(f"\n{GREEN}{BOLD}Company & Bank configuration complete!{RESET}")
    print(f"\nCompany details from .env.jensenintl have been applied to Odoo.")


if __name__ == "__main__":
    main()