#!/usr/bin/env python3
"""
Odoo Database Creator
=====================
Creates a new Odoo database via XML-RPC.

Usage:
    python scripts/create_database.py

Options:
    --db-name NAME       Database name to create
    --demo               Include demo data
    --clean              Create clean instance (no demo data)
    --master-password PW Odoo master password (or prompt)
    --odoo-url URL       Odoo server URL (default from .env or prompt)
"""

import os
import sys
import xmlrpc.client
import re
import argparse

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


def ask(prompt: str, default: str = "") -> str:
    if default:
        response = input(f"\n{BOLD}{prompt} [{default}]: {RESET}").strip()
        return response if response else default
    else:
        return input(f"\n{BOLD}{prompt}: {RESET}").strip()


def validate_db_name(name: str) -> bool:
    if not re.match(r"^[a-z][a-z0-9_]{0,62}$", name):
        return False
    return True


def list_databases(url: str) -> list:
    try:
        sock = xmlrpc.client.ServerProxy(f"{url}/xmlrpc/2/db", allow_none=True)
        return sock.list()
    except Exception as e:
        warn(f"Could not list databases: {e}")
        return []


def create_database(url: str, master_password: str, db_name: str,
                   demo_data: bool, lang: str = "en_US",
                   admin_login: str = "admin", admin_password: str = "admin") -> bool:
    try:
        sock = xmlrpc.client.ServerProxy(f"{url}/xmlrpc/2/db", allow_none=True)
        result = sock.create_database(
            master_password,
            db_name,
            demo_data,
            lang,
            admin_login,
            admin_password,
            None
        )
        return result
    except xmlrpc.client.Fault as e:
        fail(f"Database creation failed: {e.faultString}")
        return False
    except Exception as e:
        fail(f"Database creation failed: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Create a new Odoo database",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/create_database.py
  python scripts/create_database.py --db-name jensenintl --demo
  python scripts/create_database.py --db-name testdb --clean --master-password secret
        """
    )
    parser.add_argument("--db-name", dest="db_name", help="Database name to create")
    parser.add_argument("--demo", action="store_true", help="Include demo data")
    parser.add_argument("--clean", action="store_true", help="Create clean instance (no demo data)")
    parser.add_argument("--master-password", dest="master_password", help="Odoo master password")
    parser.add_argument("--odoo-url", dest="odoo_url", help="Odoo server URL")
    parser.add_argument("--admin-password", dest="admin_password", default="admin",
                       help="Admin user password (default: admin)")
    parser.add_argument("--yes", "-y", action="store_true",
                       help="Skip confirmation prompts (for non-interactive use)")
    parser.add_argument("--skip-setup", action="store_true",
                       help="Skip the post-creation setup prompt")
    parser.add_argument("--force", "-f", action="store_true",
                       help="Overwrite existing database if it exists")

    args = parser.parse_args()

    root = get_project_root()
    env = {}
    for env_file in [".env", ".env.local", ".env.jensenintl", ".env.ipatechs"]:
        env.update(load_env(os.path.join(root, env_file)))

    print(f"{BOLD}{'=' * 50}{RESET}")
    print(f"{BOLD}Odoo Database Creator{'=' * 50}{RESET}")
    print(f"{BOLD}{'=' * 50}{RESET}")

    # Get Odoo URL
    odoo_url = args.odoo_url or env.get("ODOO_URL", "")
    if not odoo_url:
        odoo_url = ask("Enter Odoo server URL", "https://odoo-211283-0.cloudclusters.net")
    odoo_url = odoo_url.rstrip("/")

    # Show existing databases
    info(f"Connecting to: {odoo_url}")
    existing_dbs = list_databases(odoo_url)
    if existing_dbs:
        print(f"{YELLOW}Existing databases: {', '.join(existing_dbs)}{RESET}")
    else:
        info("No databases found or unable to list")

    # Get master password
    master_password = args.master_password or env.get("ODOO_MASTER_PASSWORD", "")
    if not master_password:
        master_password = ask("Enter Odoo master password")
        if not master_password:
            fail("Master password is required")
            sys.exit(1)

    # Get database name
    db_name = args.db_name
    if not db_name:
        db_name = ask("Enter database name to create")
    if not db_name:
        fail("Database name is required")
        sys.exit(1)

    if not validate_db_name(db_name):
        fail(f"Invalid database name '{db_name}'. Use lowercase letters, numbers, and underscores only. Must start with a letter.")
        sys.exit(1)

    if db_name in existing_dbs:
        if not args.force:
            warn(f"Database '{db_name}' already exists!")
            response = ask("Overwrite? (yes/no)", "no").lower()
            if response != "yes":
                ok("Cancelled")
                sys.exit(0)
        else:
            warn(f"Database '{db_name}' exists --force specified, will attempt overwrite")

    # Get demo data preference
    demo_data = None
    if args.demo:
        demo_data = True
    elif args.clean:
        demo_data = False
    else:
        while demo_data is None:
            response = ask("Include demo data? (yes/no)", "no").lower()
            if response in ("yes", "y"):
                demo_data = True
            elif response in ("no", "n"):
                demo_data = False

    # Get admin password
    admin_password = args.admin_password or ask("Admin password (or press enter for 'admin')", "admin")

    # Summary before creation
    print(f"\n{BOLD}Summary:{RESET}")
    print(f"  Database: {db_name}")
    print(f"  Demo data: {'Yes' if demo_data else 'No'}")
    print(f"  Admin login: admin")
    print(f"  Admin password: {admin_password}")
    print(f"  URL: {odoo_url}")

    confirm = "yes" if args.yes else ask("\nProceed with database creation? (yes/no)", "yes").lower()
    if confirm not in ("yes", "y"):
        ok("Cancelled")
        sys.exit(0)

    # Create database
    step(1, "Creating database")
    success = create_database(
        odoo_url,
        master_password,
        db_name,
        demo_data,
        "en_US",
        "admin",
        admin_password
    )

    if not success:
        fail("Database creation failed")
        sys.exit(1)

    ok(f"Database '{db_name}' created successfully!")

    # Check if database exists now
    new_dbs = list_databases(odoo_url)
    if db_name in new_dbs:
        ok(f"Verified: '{db_name}' is now available")
    else:
        warn(f"Database created but not visible in list (may need a moment)")

    # Ask about setup
    if not args.skip_setup:
        print(f"\n{BOLD}{'=' * 50}{RESET}")
        print("What would you like to do next?")
        print(f"  1. Run setup now (configure the new database)")
        print(f"  2. Setup later (run 'python scripts/setup_odoo.py' manually)")
        print(f"  3. Exit")
        print(f"{BOLD}{'=' * 50}{RESET}")

        choice = ask("Select option (1/2/3)", "2")
    else:
        choice = "2"

    if choice == "1":
        info("Running setup script...")
        print("\nNOTE: The setup script needs .env.local with the correct")
        print("ODOO_DB=jensenintl to configure the new database.")
        print("Make sure to update your .env.local before running setup.\n")

        response = ask("Update .env.local now? (yes/no)", "no").lower()
        if response in ("yes", "y"):
            env_path = os.path.join(root, ".env.local")
            existing_env = load_env(env_path)
            existing_env["ODOO_DB"] = db_name

            with open(env_path, "w") as f:
                for key, value in existing_env.items():
                    f.write(f"{key}={value}\n")

            ok(f"Updated ODOO_DB={db_name} in .env.local")

            run_setup = ask("Run setup script now? (yes/no)", "yes").lower()
            if run_setup in ("yes", "y"):
                sys.exit(os.system(f"cd {root} && python3 scripts/setup_odoo.py"))
        else:
            info("Setup skipped. Run manually:")
            print(f"  python scripts/setup_odoo.py")
            print(f"  (after updating .env.local with ODOO_DB={db_name})")
    else:
        info("Database creation complete!")
        print(f"\nTo configure the new database, run:")
        print(f"  # Update .env.local:")
        print(f"  #   ODOO_DB={db_name}")
        print(f"  # Then run:")
        print(f"  python scripts/setup_odoo.py")


if __name__ == "__main__":
    main()