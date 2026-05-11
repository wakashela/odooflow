import { NextRequest, NextResponse } from "next/server";
import { renderToStream, Document } from "@react-pdf/renderer";
import { QuotationPDFPage } from "@/components/pdf/QuotationPDF";
import type { PdfColorSettings, CompanySettings, BankDetail } from "@/types/settings";

interface PreviewBody {
  colors: PdfColorSettings;
  company: Partial<CompanySettings>;
  bank?: Partial<BankDetail>;
}

function buildPreviewDoc(body: PreviewBody) {
  const { colors, company, bank } = body;

  const companyData: CompanySettings = {
    id: 0,
    name: company.name || "JENSEN AUTOMATIONS TECHNOLOGY LIMITED",
    street: company.street || "21493",
    street2: company.street2 || "",
    city: company.city || "Dar es Salaam",
    zip: company.zip || "",
    phone: company.phone || "+255745205050",
    email: company.email || "info@jensenintl.com",
    website: "",
    vat: company.vat || "168-782-179",
    logo: company.logo || "",
    country_id: false,
    partner_id: 0,
  };

  const bankData: BankDetail | undefined = bank ? {
    id: 0,
    bank_name: bank.bank_name || "CRDB BANK",
    acc_number: bank.acc_number || "",
    acc_holder_name: bank.acc_holder_name || "Jensen Automations Technology Limited",
    bank_bic: bank.bank_bic || "CORUTZTZ",
    x_tzs_account: bank.x_tzs_account || "015C001GAEC00",
    x_usd_account: bank.x_usd_account || "025C001GAEC00",
    x_branch: bank.x_branch || "UDSM Branch",
    x_sort_code: bank.x_sort_code || "3386",
  } : undefined;

  const sampleLines = [
    { id: 1, description: "Industrial Automation Controller", partNumber: "AC-500", quantity: 2, unitPrice: 2500000, discount: 0, subtotal: 5000000 },
    { id: 2, description: "Servo Motor Assembly", partNumber: "SM-200", quantity: 5, unitPrice: 800000, discount: 10, subtotal: 3600000 },
    { id: 3, description: "PLC Communication Module", partNumber: "CM-100", quantity: 3, unitPrice: 1200000, discount: 0, subtotal: 3600000 },
  ];

  const subtotal = sampleLines.reduce((s, l) => s + l.subtotal, 0);
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + tax;

  return (
    <Document>
      <QuotationPDFPage
        documentName="SO/2026/0001"
        documentType="Quotation"
        partnerName="Sample Customer Ltd"
        partnerAddress="123 Business Park, Dar es Salaam"
        date="01/05/2026"
        lines={sampleLines}
        amountUntaxed={subtotal}
        amountTax={tax}
        amountTotal={total}
        copyType="original"
        company={companyData}
        banks={bankData ? [bankData] : []}
        pdfColors={colors}
      />
    </Document>
  );
}

export async function POST(req: NextRequest) {
  let body: PreviewBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const doc = buildPreviewDoc(body);
    const stream = await renderToStream(doc);
    const chunks: Buffer[] = [];
    for await (const chunk of stream as AsyncIterable<Buffer>) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Preview PDF failed:", err);
    return NextResponse.json(
      { error: `Preview failed: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
