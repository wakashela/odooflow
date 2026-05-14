import type { CompanySettings, BankDetail, PdfColorSettings, PrintSettings } from "@/types/settings";

const ODOO_URL = process.env.ODOO_URL!;

async function odooServerCall<T>(
  sessionId: string,
  model: string,
  method: string,
  args: unknown[] = [],
  kwargs: Record<string, unknown> = {}
): Promise<T> {
  const payload = {
    jsonrpc: "2.0",
    method: "call",
    id: Date.now(),
    params: { model, method, args, kwargs },
  };
  const res = await fetch(`${ODOO_URL}/web/dataset/call_kw`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `session_id=${sessionId}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.data?.message || data.error.message);
  return data.result as T;
}

const COMPANY_FIELDS = [
  "id", "name", "street", "street2", "city", "zip",
  "phone", "email", "website", "vat", "logo",
  "country_id", "partner_id",
];

const BANK_FIELDS = [
  "id", "bank_name", "acc_number", "acc_holder_name", "bank_bic",
  "x_tzs_account", "x_usd_account", "x_branch", "x_sort_code",
];

const PDF_COLOR_KEYS = [
  "odooflow.pdf.primary",
  "odooflow.pdf.primary_dark",
  "odooflow.pdf.accent",
];

const DEFAULT_COLORS: PdfColorSettings = {
  primary: "#0A9688",
  primaryDark: "#00796B",
  accent: "#F57F17",
};

export async function fetchCompanySettingsServer(sessionId: string): Promise<CompanySettings | null> {
  const results = await odooServerCall<Record<string, unknown>[]>(
    sessionId, "res.company", "search_read", [[]], { fields: COMPANY_FIELDS, limit: 1 }
  );
  if (!results.length) return null;
  const r = results[0];
  return {
    id: r.id as number,
    name: (r.name as string) || "",
    street: (r.street as string) || "",
    street2: (r.street2 as string) || "",
    city: (r.city as string) || "",
    zip: (r.zip as string) || "",
    phone: (r.phone as string) || "",
    email: (r.email as string) || "",
    website: (r.website as string) || "",
    vat: (r.vat as string) || "",
    logo: (r.logo as string) || "",
    country_id: r.country_id as [number, string] | false,
    partner_id: (() => {
      const p = r.partner_id;
      if (Array.isArray(p)) return p[0] as number;
      if (typeof p === "number") return p;
      return 0;
    })(),
  };
}

export async function fetchBankDetailsServer(sessionId: string, partnerId: number): Promise<BankDetail[]> {
  const results = await odooServerCall<Record<string, unknown>[]>(
    sessionId, "res.partner.bank", "search_read",
    [[["partner_id", "=", partnerId]]],
    { fields: BANK_FIELDS }
  );
  return results.map((r) => ({
    id: r.id as number,
    bank_name: (r.bank_name as string) || "",
    acc_number: (r.acc_number as string) || "",
    acc_holder_name: (r.acc_holder_name as string) || "",
    bank_bic: (r.bank_bic as string) || "",
    x_tzs_account: (r.x_tzs_account as string) || "",
    x_usd_account: (r.x_usd_account as string) || "",
    x_branch: (r.x_branch as string) || "",
    x_sort_code: (r.x_sort_code as string) || "",
  }));
}

export async function fetchPdfColorsServer(sessionId: string): Promise<PdfColorSettings> {
  try {
    const results = await odooServerCall<{ key: string; value: string }[]>(
      sessionId, "ir.config_parameter", "search_read",
      [[["key", "in", PDF_COLOR_KEYS]]],
      { fields: ["key", "value"] }
    );
    const map: Record<string, string> = {};
    for (const r of results) map[r.key] = r.value;
    return {
      primary: map["odooflow.pdf.primary"] || DEFAULT_COLORS.primary,
      primaryDark: map["odooflow.pdf.primary_dark"] || DEFAULT_COLORS.primaryDark,
      accent: map["odooflow.pdf.accent"] || DEFAULT_COLORS.accent,
    };
  } catch {
    return { ...DEFAULT_COLORS };
  }
}

const PRINT_SETTING_KEYS = [
  "odooflow.print.enable_original_duplicate",
  "odooflow.print.show_delivery_time_in_line",
  "odooflow.print.delivery_time_unit",
];

export async function fetchPrintSettingsServer(sessionId: string): Promise<PrintSettings> {
  try {
    const results = await odooServerCall<{ key: string; value: string }[]>(
      sessionId, "ir.config_parameter", "search_read",
      [[["key", "in", PRINT_SETTING_KEYS]]],
      { fields: ["key", "value"] }
    );
    const map: Record<string, string> = {};
    for (const r of results) map[r.key] = r.value;
    return {
      enableOriginalDuplicate: map["odooflow.print.enable_original_duplicate"] === "true",
      showDeliveryTimeInLine: map["odooflow.print.show_delivery_time_in_line"] === "true",
      deliveryTimeUnit: (map["odooflow.print.delivery_time_unit"] as "days" | "weeks") || "days",
    };
  } catch {
    return { enableOriginalDuplicate: false, showDeliveryTimeInLine: false, deliveryTimeUnit: "days" };
  }
}

export async function fetchPdfSettings(sessionId: string) {
  const company = await fetchCompanySettingsServer(sessionId);
  const banks = company ? await fetchBankDetailsServer(sessionId, company.partner_id) : [];
  const colors = await fetchPdfColorsServer(sessionId);
  const printSettings = await fetchPrintSettingsServer(sessionId);
  return { company, banks, colors, printSettings };
}
