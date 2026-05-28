import Database from "better-sqlite3";
import crypto from "crypto";
import path from "path";

const DB_PATH = process.env.SQLITE_PATH || path.join(process.cwd(), "odooflow.db");

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

async function seed() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sequences (
      name TEXT PRIMARY KEY,
      current_value INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS partners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      street TEXT,
      street2 TEXT,
      city TEXT,
      state_id INTEGER,
      zip TEXT,
      country_id INTEGER,
      vat TEXT,
      x_tin TEXT,
      is_company INTEGER DEFAULT 0,
      customer_rank INTEGER DEFAULT 0,
      supplier_rank INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      default_code TEXT,
      list_price REAL DEFAULT 0,
      standard_price REAL DEFAULT 0,
      type TEXT DEFAULT 'consu',
      sale_ok INTEGER DEFAULT 1,
      purchase_ok INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS sale_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      state TEXT DEFAULT 'draft',
      partner_id INTEGER REFERENCES partners(id),
      date_order TEXT,
      validity_date TEXT,
      amount_untaxed REAL DEFAULT 0,
      amount_tax REAL DEFAULT 0,
      amount_total REAL DEFAULT 0,
      note TEXT,
      client_order_ref TEXT,
      payment_term_id INTEGER
    );
    CREATE TABLE IF NOT EXISTS sale_order_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES sale_orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      name TEXT,
      product_uom_qty REAL DEFAULT 0,
      price_unit REAL DEFAULT 0,
      price_subtotal REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      x_delivery_time TEXT
    );
    CREATE TABLE IF NOT EXISTS account_moves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      move_type TEXT DEFAULT 'out_invoice',
      state TEXT DEFAULT 'draft',
      partner_id INTEGER REFERENCES partners(id),
      invoice_date TEXT,
      invoice_date_due TEXT,
      amount_untaxed REAL DEFAULT 0,
      amount_tax REAL DEFAULT 0,
      amount_total REAL DEFAULT 0,
      payment_state TEXT,
      narration TEXT,
      invoice_origin TEXT,
      invoice_payment_term_id INTEGER
    );
    CREATE TABLE IF NOT EXISTS account_move_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      move_id INTEGER REFERENCES account_moves(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      name TEXT,
      quantity REAL DEFAULT 0,
      price_unit REAL DEFAULT 0,
      price_subtotal REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      x_delivery_time TEXT
    );
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      state TEXT DEFAULT 'draft',
      partner_id INTEGER REFERENCES partners(id),
      date_order TEXT,
      date_planned TEXT,
      amount_untaxed REAL DEFAULT 0,
      amount_tax REAL DEFAULT 0,
      amount_total REAL DEFAULT 0,
      notes TEXT,
      origin TEXT
    );
    CREATE TABLE IF NOT EXISTS purchase_order_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      name TEXT,
      product_qty REAL DEFAULT 0,
      price_unit REAL DEFAULT 0,
      price_subtotal REAL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS stock_pickings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      state TEXT DEFAULT 'draft',
      partner_id INTEGER REFERENCES partners(id),
      scheduled_date TEXT,
      date_done TEXT,
      origin TEXT,
      picking_type_id INTEGER
    );
    CREATE TABLE IF NOT EXISTS stock_moves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      picking_id INTEGER REFERENCES stock_pickings(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      name TEXT,
      product_uom_qty REAL DEFAULT 0,
      quantity_done REAL DEFAULT 0
    );
  `);

  sqlite.exec(`
    INSERT OR IGNORE INTO sequences (name, current_value) VALUES ('sale_order', 0);
    INSERT OR IGNORE INTO sequences (name, current_value) VALUES ('account_move', 0);
    INSERT OR IGNORE INTO sequences (name, current_value) VALUES ('purchase_order', 0);
    INSERT OR IGNORE INTO sequences (name, current_value) VALUES ('stock_picking', 0);
  `);

  const existingUsers = sqlite.prepare("SELECT id FROM users WHERE username = ?").all("admin");
  if (existingUsers.length === 0) {
    sqlite.prepare("INSERT INTO users (username, password_hash, name) VALUES (?, ?, ?)").run(
      "admin", hashPassword("admin"), "Administrator"
    );
  }

  const existingPartners = sqlite.prepare("SELECT id FROM partners LIMIT 1").all();
  if (existingPartners.length === 0) {
    sqlite.prepare("INSERT INTO partners (name, email, phone, street, city, is_company, customer_rank) VALUES (?, ?, ?, ?, ?, 1, 1)").run("Acme Corporation", "info@acme.com", "+255 712 345 678", "123 Main St", "Dar es Salaam");
    sqlite.prepare("INSERT INTO partners (name, email, phone, street, city, is_company, customer_rank) VALUES (?, ?, ?, ?, ?, 1, 1)").run("Tech Solutions Ltd", "sales@techsolutions.com", "+255 713 456 789", "456 Tech Ave", "Arusha");
    sqlite.prepare("INSERT INTO partners (name, email, phone, street, city, is_company, customer_rank) VALUES (?, ?, ?, ?, ?, 1, 1)").run("Global Traders", "info@globaltraders.com", "+255 714 567 890", "789 Trade Blvd", "Mwanza");
  }

  const existingProducts = sqlite.prepare("SELECT id FROM products LIMIT 1").all();
  if (existingProducts.length === 0) {
    sqlite.prepare("INSERT INTO products (name, default_code, list_price, standard_price, type, sale_ok, purchase_ok) VALUES (?, ?, ?, ?, ?, 1, 1)").run("Laptop - Dell XPS 15", "LAP-001", 2500000, 2000000, "consu");
    sqlite.prepare("INSERT INTO products (name, default_code, list_price, standard_price, type, sale_ok, purchase_ok) VALUES (?, ?, ?, ?, ?, 1, 1)").run("Monitor - Samsung 27\"", "MON-001", 450000, 350000, "consu");
    sqlite.prepare("INSERT INTO products (name, default_code, list_price, standard_price, type, sale_ok, purchase_ok) VALUES (?, ?, ?, ?, ?, 1, 1)").run("Keyboard - Logitech MX", "KEY-001", 150000, 100000, "consu");
    sqlite.prepare("INSERT INTO products (name, default_code, list_price, standard_price, type, sale_ok, purchase_ok) VALUES (?, ?, ?, ?, ?, 1, 1)").run("Mouse - Logitech MX Master", "MOU-001", 120000, 80000, "consu");
    sqlite.prepare("INSERT INTO products (name, default_code, list_price, standard_price, type, sale_ok, purchase_ok) VALUES (?, ?, ?, ?, ?, 1, 0)").run("Web Development Service", "SRV-001", 5000000, 0, "service");
  }

  console.log("Seed complete! Created admin user (admin/admin), 3 customers, 5 products");
  console.log(`Database: ${DB_PATH}`);
}

seed().catch(console.error);
