#!/usr/bin/env python3
"""
OdooFlow — Odoo Setup Script
============================
Configures a fresh Odoo database for use with OdooFlow.

Usage:
    python scripts/setup_odoo.py

Requirements:
    - Python 3.9+
    - A running Odoo instance (accessible from this machine)
    - Credentials in .env.local at the project root

What it sets up:
    1. Verifies Odoo connection
    2. Authenticates
    3. Creates custom bank fields on res.partner.bank
    4. Sets company name, address, phone, email, VAT
    5. Uploads logo.png and logo-icon.ico from public/
    6. Configures PDF color scheme via ir.config_parameter
    7. Prompts to install demo data (sale, purchase, account, stock)
"""

import os
import sys
import xmlrpc.client
import base64
import time
import re

# ----------------------------------------------------------------------
# Env loader (no external dependencies)
# ----------------------------------------------------------------------
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
            env[key.strip()] = val.strip()
    return env


def get_project_root() -> str:
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


# ----------------------------------------------------------------------
# RPC helpers
# ----------------------------------------------------------------------
def xmlrpc_call(url: str, service: str, method: str, *args, **kwargs) -> object:
    endpoint = f"{url}/xmlrpc/2/{service}"
    sock = xmlrpc.client.ServerProxy(endpoint, allow_none=True)
    return getattr(sock, method)(*args, **kwargs)


# ----------------------------------------------------------------------
# Terminal helpers
# ----------------------------------------------------------------------
BLUE = "\033[94m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BOLD = "\033[1m"
RESET = "\033[0m"


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


def summary(results: list) -> None:
    print(f"\n{BOLD}{'='*50}{RESET}")
    print(f"{BOLD}Setup Summary{'=' * 50}{RESET}")
    print(f"{BOLD}{'='*50}{RESET}")
    for label, status, detail in results:
        icon = f"{GREEN}✅{RESET}" if status else f"{RED}❌{RESET}"
        detail_str = f" — {detail}" if detail else ""
        print(f"  {icon}  {label}{detail_str}")


def ask(prompt: str) -> str:
    return input(f"\n{BOLD}{prompt} [y/N]: {RESET}").strip().lower()


def read_file_binary(path: str) -> bytes | None:
    try:
        with open(path, "rb") as f:
            return f.read()
    except OSError:
        return None


# ----------------------------------------------------------------------
# Odoo helpers
# ----------------------------------------------------------------------
def odoo_call(sock_url: str, uid: int, db: str, password: str,
              model: str, method: str, args: list = None, kwargs: dict = None):
    args = args or []
    kwargs = kwargs or {}
    return xmlrpc_call(
        sock_url, "object", "execute_kw",
        db, uid, password, model, method, args, kwargs
    )


def field_exists(sock_url: str, uid: int, db: str, password: str,
                 model: str, field_name: str) -> bool:
    try:
        ids = odoo_call(sock_url, uid, db, password, "ir.model.fields", "search", [
            [["model", "=", model], ["name", "=", field_name]]
        ], {"limit": 1})
        return bool(ids)
    except Exception:
        return False


def get_model_id(sock_url: str, uid: int, db: str, password: str, model_name: str) -> int | None:
    ids = xmlrpc_call(sock_url, "object", "execute_kw",
                      db, uid, password, "ir.model", "search", [
                          [["model", "=", model_name]]
                      ], {"limit": 1})
    return ids[0] if ids else None


def create_field(sock_url: str, uid: int, db: str, password: str,
                 model: str, field_name: str, field_label: str, field_type: str = "char"):
    model_id = get_model_id(sock_url, uid, db, password, model)
    if not model_id:
        raise Exception(f"Model '{model}' not found in ir.model")
    odoo_call(sock_url, uid, db, password, "ir.model.fields", "create", [{
        "model_id": model_id,
        "name": field_name,
        "field_description": field_label,
        "ttype": field_type,
        "state": "manual",
    }])


def upsert_config_param(sock_url: str, uid: int, db: str, password: str,
                        key: str, value: str):
    ids = odoo_call(sock_url, uid, db, password, "ir.config_parameter", "search", [
        [["key", "=", key]]
    ], {"limit": 1})
    if ids:
        odoo_call(sock_url, uid, db, password, "ir.config_parameter", "write", [
            ids, {"key": key, "value": value}
        ])
        info(f"Updated ir.config_parameter: {key}")
    else:
        odoo_call(sock_url, uid, db, password, "ir.config_parameter", "create", [{
            "key": key,
            "value": value,
        }])
        info(f"Created ir.config_parameter: {key}")


def install_module(sock_url: str, uid: int, db: str, password: str, module_name: str, timeout: int = 120) -> bool:
    info(f"Installing module '{module_name}'...")

    # Search for the module
    module_ids = odoo_call(sock_url, uid, db, password, "ir.module.module", "search", [
        [["name", "=", module_name], ["state", "in", ["uninstalled", "to upgrade"]]]
    ], {})
    if not module_ids:
        # Try "to install"
        module_ids = odoo_call(sock_url, uid, db, password, "ir.module.module", "search", [
            [["name", "=", module_name]]
        ], {})
        if not module_ids:
            warn(f"Module '{module_name}' not found in the registry.")
            return False
        [mid] = module_ids
        state = odoo_call(sock_url, uid, db, password, "ir.module.module", "read", [
            [mid], ["state"]
        ])[0]["state"]
        if state == "installed":
            ok(f"Module '{module_name}' is already installed.")
            return True
        warn(f"Module '{module_name}' state is '{state}', cannot install via script.")
        return False

    [module_id] = module_ids

    # Button install triggers async action; we poll the state
    odoo_call(sock_url, uid, db, password, "ir.module.module", "button_immediate_install", [
        [module_id]
    ])

    # Poll until installed or timeout
    deadline = time.time() + timeout
    while time.time() < deadline:
        time.sleep(2)
        state = odoo_call(sock_url, uid, db, password, "ir.module.module", "read", [
            [module_id], ["state"]
        ])[0]["state"]
        if state == "installed":
            ok(f"Module '{module_name}' installed successfully.")
            return True
        if state in ("uninstalled", "to upgrade", "to install"):
            continue
        if state == "broken":
            fail(f"Module '{module_name}' is in a broken state.")
            return False

    fail(f"Module '{module_name}' installation timed out after {timeout}s.")
    return False


# ----------------------------------------------------------------------
# Main setup
# ----------------------------------------------------------------------
def main():
    root = get_project_root()
    env = load_env(os.path.join(root, ".env.local"))

    ODOO_URL = env.get("ODOO_URL", "").rstrip("/")
    ODOO_DB = env.get("ODOO_DB", "")
    ODOO_USER = env.get("ODOO_USER", "")
    ODOO_PASSWORD = env.get("ODOO_PASSWORD", "")

    if not ODOO_URL or not ODOO_DB:
        fail("Missing ODOO_URL or ODOO_DB in .env.local")
        print("\nCopy .env.example to .env.local and fill in your Odoo credentials:")
        print("  cp .env.example .env.local")
        print("  # then edit .env.local with your values")
        sys.exit(1)

    if not ODOO_USER or not ODOO_PASSWORD:
        fail("Missing ODOO_USER or ODOO_PASSWORD in .env.local")
        sys.exit(1)

    print(f"{BOLD}{'=' * 50}{RESET}")
    print(f"{BOLD}OdooFlow - Odoo Setup Script{'=' * 50}{RESET}")
    print(f"{BOLD}{'=' * 50}{RESET}")
    print(f"  URL     : {ODOO_URL}")
    print(f"  Database: {ODOO_DB}")
    print(f"  User    : {ODOO_USER}")
    print(f"  Logo    : {os.path.join(root, 'public', 'logo.png')}")

    results: list = []

    # ------------------------------------------------------------------
    # Step 1 — Verify connection
    # ------------------------------------------------------------------
    step(1, "Verify Odoo connection")
    try:
        version = xmlrpc_call(ODOO_URL, "common", "version")
        ok(f"Connected to Odoo {version.get('server_version', '?')}")
        results.append(("Connection", True, ""))
    except Exception as e:
        fail(f"Cannot connect to Odoo at {ODOO_URL}")
        fail(str(e))
        sys.exit(1)

    # ------------------------------------------------------------------
    # Step 2 — Authenticate
    # ------------------------------------------------------------------
    step(2, "Authenticate")
    try:
        uid = xmlrpc_call(ODOO_URL, "common", "authenticate",
                          ODOO_DB, ODOO_USER, ODOO_PASSWORD, {})
        if not uid:
            fail("Authentication failed — check username and password.")
            sys.exit(1)
        ok(f"Authenticated (uid={uid})")
        results.append(("Authentication", True, f"uid={uid}"))
    except Exception as e:
        fail(f"Authentication error: {e}")
        sys.exit(1)

    # ------------------------------------------------------------------
    # Step 3 — Create custom bank fields
    # ------------------------------------------------------------------
    step(3, "Create custom bank fields on res.partner.bank")
    bank_fields = [
        ("x_tzs_account", "TZS Account"),
        ("x_usd_account", "USD Account"),
        ("x_branch", "Branch"),
        ("x_sort_code", "Sort Code"),
    ]
    fields_ok = True
    for fname, flabel in bank_fields:
        try:
            if field_exists(ODOO_URL, uid, ODOO_DB, ODOO_PASSWORD,
                            "res.partner.bank", fname):
                ok(f"Field '{fname}' already exists — skipping")
            else:
                create_field(ODOO_URL, uid, ODOO_DB, ODOO_PASSWORD,
                             "res.partner.bank", fname, flabel)
                ok(f"Field '{fname}' created")
        except Exception as e:
            warn(f"Could not create '{fname}': {e}")
            fields_ok = False

    results.append(("Custom bank fields", fields_ok, ""))

    # ------------------------------------------------------------------
    # Step 4 — Set company details
    # ------------------------------------------------------------------
    step(4, "Set company details on res.company")

    # Detect company name from .env.local for convenience
    company_name = env.get("ODOO_COMPANY_NAME", "My Company Ltd")
    company_street = env.get("ODOO_COMPANY_STREET", "")
    company_city = env.get("ODOO_COMPANY_CITY", "")
    company_zip = env.get("ODOO_COMPANY_ZIP", "")
    company_phone = env.get("ODOO_COMPANY_PHONE", "")
    company_email = env.get("ODOO_COMPANY_EMAIL", "")
    company_vat = env.get("ODOO_COMPANY_VAT", "")

    company_write = {
        k: v for k, v in {
            "name": company_name,
            "street": company_street,
            "city": company_city,
            "zip": company_zip,
            "phone": company_phone,
            "email": company_email,
            "vat": company_vat,
        }.items() if v
    }

    try:
        company_ids = odoo_call(ODOO_URL, uid, ODOO_DB, ODOO_PASSWORD,
                                "res.company", "search", [[]], {"limit": 1})
        if not company_ids:
            warn("No company record found — skipping company details")
            results.append(("Company details", False, "No res.company record"))
        else:
            [cid] = company_ids
            odoo_call(ODOO_URL, uid, ODOO_DB, ODOO_PASSWORD,
                      "res.company", "write", [cid, company_write])
            ok(f"Company record #{cid} updated: {list(company_write.keys())}")
            results.append(("Company details", True, f"company=#{cid}"))
    except Exception as e:
        fail(f"Could not update company: {e}")
        results.append(("Company details", False, str(e)))

    # ------------------------------------------------------------------
    # Step 5 — Upload logos
    # ------------------------------------------------------------------
    step(5, "Upload logos from public/")

    logo_png_path = os.path.join(root, "public", "logo.png")
    logo_ico_path = os.path.join(root, "public", "logo-icon.ico")

    logo_data = read_file_binary(logo_png_path)
    if not logo_data:
        warn(f"logo.png not found at {logo_png_path} — skipping logo upload")
        results.append(("Logo upload", False, "logo.png not found"))
    else:
        logo_b64 = base64.b64encode(logo_data).decode("ascii")
        try:
            company_ids = odoo_call(ODOO_URL, uid, ODOO_DB, ODOO_PASSWORD,
                                    "res.company", "search", [[]], {"limit": 1})
            if company_ids:
                [cid] = company_ids
                odoo_call(ODOO_URL, uid, ODOO_DB, ODOO_PASSWORD,
                          "res.company", "write", [cid, {"logo": logo_b64}])
                ok("logo.png uploaded to res.company")
                results.append(("Logo upload", True, "logo.png set"))
            else:
                results.append(("Logo upload", False, "No company record"))
        except Exception as e:
            fail(f"Could not upload logo.png: {e}")
            results.append(("Logo upload", False, str(e)))

    # Save logo-icon.ico as an attachment (Odoo stores .ico in attachments)
    ico_data = read_file_binary(logo_ico_path)
    if not ico_data:
        warn(f"logo-icon.ico not found at {logo_ico_path} — skipping icon upload")
    else:
        ico_b64 = base64.b64encode(ico_data).decode("ascii")
        try:
            odoo_call(ODOO_URL, uid, ODOO_DB, ODOO_PASSWORD,
                      "ir.attachment", "create", [{
                          "name": "logo-icon.ico",
                          "type": "binary",
                          "datas": ico_b64,
                          "res_model": "res.company",
                          "res_id": company_ids[0] if company_ids else 0,
                          "public": True,
                      }])
            ok("logo-icon.ico saved as attachment")
        except Exception as e:
            warn(f"Could not save logo-icon.ico: {e}")

    # ------------------------------------------------------------------
    # Step 6 — Set PDF colors
    # ------------------------------------------------------------------
    step(6, "Configure PDF color scheme via ir.config_parameter")

    default_colors = {
        "odooflow.pdf.primary": "#0A9688",
        "odooflow.pdf.primary_dark": "#00796B",
        "odooflow.pdf.accent": "#F57F17",
    }

    # Allow override from .env.local
    for key, default in default_colors.items():
        env_key = key.replace(".", "_").upper()
        value = env.get(env_key, default)
        try:
            upsert_config_param(ODOO_URL, uid, ODOO_DB, ODOO_PASSWORD, key, value)
            ok(f"{key} = {value}")
        except Exception as e:
            warn(f"Could not set {key}: {e}")

    results.append(("PDF color scheme", True, ""))

    # ------------------------------------------------------------------
    # Step 7 — Demo data
    # ------------------------------------------------------------------
    step(7, "Demo data installation")

    response = ask("Install demo data? (sale, purchase, account, stock)")
    if response == "y":
        modules_to_install = ["base", "sale", "purchase", "account", "stock"]
        demo_results = []
        for mod in modules_to_install:
            success = install_module(ODOO_URL, uid, ODOO_DB, ODOO_PASSWORD, mod)
            demo_results.append((mod, success))

        all_ok = all(r[1] for r in demo_results)
        results.append(("Demo data", all_ok,
                        ", ".join(f"{r[0]}={('ok' if r[1] else 'fail')}" for r in demo_results)))
    else:
        ok("Demo data installation skipped")
        results.append(("Demo data", True, "skipped by user"))

    # ------------------------------------------------------------------
    # Done
    # ------------------------------------------------------------------
    summary(results)
    print()
    all_ok = all(r[1] for r in results)
    if all_ok:
        print(f"{GREEN}{BOLD}Odoo is configured! Start OdooFlow with: npm run dev{RESET}")
    else:
        print(f"{YELLOW}{BOLD}Setup completed with some warnings.{RESET}")
        print("Check the output above and resolve any failed steps manually.")


if __name__ == "__main__":
    main()
