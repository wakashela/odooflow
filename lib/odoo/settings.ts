import { odooCall } from "./client";
import type { CompanySettings, BankDetail, PdfColorSettings } from "@/types/settings";

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

export async function fetchCompanySettings(): Promise<CompanySettings | null> {
  const results = await odooCall<Record<string, unknown>[]>("res.company", "search_read", [[]], {
    fields: COMPANY_FIELDS,
    limit: 1,
  });
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

export async function writeCompanySettings(
  companyId: number,
  fields: Partial<Omit<CompanySettings, "id" | "country_id" | "partner_id">> & { country_id?: number }
): Promise<boolean> {
  return odooCall<boolean>("res.company", "write", [[companyId], fields], {});
}

export async function writeCompanyLogo(
  companyId: number,
  logoBase64: string | false
): Promise<boolean> {
  return odooCall<boolean>("res.company", "write", [[companyId], { logo: logoBase64 }], {});
}

export async function fetchBankDetails(companyPartnerId: number): Promise<BankDetail[]> {
  const results = await odooCall<Record<string, unknown>[]>("res.partner.bank", "search_read", [[["partner_id", "=", companyPartnerId]]], {
    fields: BANK_FIELDS,
  });
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

export async function createBankDetail(
  partnerId: number,
  fields: Omit<BankDetail, "id">
): Promise<number> {
  return odooCall<number>("res.partner.bank", "create", [{ ...fields, partner_id: partnerId }], {});
}

export async function writeBankDetail(
  bankId: number,
  fields: Partial<Omit<BankDetail, "id">>
): Promise<boolean> {
  return odooCall<boolean>("res.partner.bank", "write", [[bankId], fields], {});
}

export async function deleteBankDetail(bankId: number): Promise<boolean> {
  return odooCall<boolean>("res.partner.bank", "unlink", [[bankId]], {});
}

export async function fetchPdfColors(): Promise<PdfColorSettings> {
  try {
    const results = await odooCall<{ key: string; value: string }[]>("ir.config_parameter", "search_read", [[["key", "in", PDF_COLOR_KEYS]]], {
      fields: ["key", "value"],
    });
    const map: Record<string, string> = {};
    for (const r of results) {
      map[r.key] = r.value;
    }
    return {
      primary: map["odooflow.pdf.primary"] || DEFAULT_COLORS.primary,
      primaryDark: map["odooflow.pdf.primary_dark"] || DEFAULT_COLORS.primaryDark,
      accent: map["odooflow.pdf.accent"] || DEFAULT_COLORS.accent,
    };
  } catch {
    return { ...DEFAULT_COLORS };
  }
}

export async function writePdfColors(colors: PdfColorSettings): Promise<void> {
  const entries: [string, string][] = [
    ["odooflow.pdf.primary", colors.primary],
    ["odooflow.pdf.primary_dark", colors.primaryDark],
    ["odooflow.pdf.accent", colors.accent],
  ];

  for (const [key, value] of entries) {
    const existing = await odooCall<number[]>("ir.config_parameter", "search", [[["key", "=", key]]], {});
    if (existing.length > 0) {
      await odooCall<boolean>("ir.config_parameter", "write", [[existing[0]], { value }], {});
    } else {
      await odooCall<number>("ir.config_parameter", "create", [{ key, value }], {});
    }
  }
}

export async function fetchAllSettings(): Promise<{
  company: CompanySettings | null;
  banks: BankDetail[];
  pdfColors: PdfColorSettings;
}> {
  const company = await fetchCompanySettings();
  const banks = company ? await fetchBankDetails(company.partner_id) : [];
  const pdfColors = await fetchPdfColors();
  return { company, banks, pdfColors };
}
