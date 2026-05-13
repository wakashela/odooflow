export interface CompanySettings {
  id: number;
  name: string;
  street: string;
  street2: string;
  city: string;
  zip: string;
  phone: string;
  email: string;
  website: string;
  vat: string;
  logo: string; // base64 or false
  country_id: [number, string] | false;
  partner_id: number;
}

export interface BankDetail {
  id: number;
  bank_name: string;
  acc_number: string;
  acc_holder_name: string;
  bank_bic: string;
  // Custom fields for the PDF layout
  x_tzs_account: string;
  x_usd_account: string;
  x_branch: string;
  x_sort_code: string;
}

export interface PdfColorSettings {
  primary: string;
  primaryDark: string;
  accent: string;
}

export interface PrintSettings {
  enableOriginalDuplicate: boolean;
  showDeliveryTimeInLine: boolean;
  deliveryTimeUnit: "days" | "weeks";
}

export interface AppSettings {
  company: CompanySettings | null;
  banks: BankDetail[];
  pdfColors: PdfColorSettings;
  printSettings: PrintSettings;
}
