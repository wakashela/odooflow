import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import { buildPdfStyles, buildPdfColors } from "@/lib/pdf/styles";
import { getLogoSrc } from "@/lib/pdf/logo";
import type { LineItem } from "@/types/documents";
import type { CompanySettings, BankDetail, PdfColorSettings } from "@/types/settings";
import { formatCurrency } from "@/lib/utils";

const DEFAULT_BANK = { bank_name: "", acc_holder_name: "", x_tzs_account: "", x_usd_account: "", bank_bic: "", x_branch: "", x_sort_code: "" } as unknown as BankDetail;

function buildCompanyAddress(company: CompanySettings | null | undefined) {
  if (!company) return "";
  return [company.street, company.street2, company.city, company.zip].filter(Boolean).join(", ") || "";
}

function buildCompanyTin(company: CompanySettings | null | undefined) {
  if (!company) return "";
  return company.vat || "";
}

interface InvoicePDFProps {
  documentName: string;
  documentType: string;
  partnerName: string;
  partnerAddress?: string;
  date: string;
  dueDate?: string;
  lines: LineItem[];
  amountUntaxed: number;
  amountTax: number;
  amountTotal: number;
  origin?: string;
  paymentState?: string;
  notes?: string;
  paymentTerms?: string;
  copyType?: "original" | "duplicate";
  company?: CompanySettings | null;
  banks?: BankDetail[];
  pdfColors?: PdfColorSettings;
  showDeliveryTimeInLine?: boolean;
}

export function InvoicePDFPage({
  documentName,
  documentType,
  partnerName,
  partnerAddress,
  date,
  dueDate,
  lines,
  amountUntaxed,
  amountTax,
  amountTotal,
  origin,
  paymentState,
  notes,
  paymentTerms,
  copyType,
  company,
  banks,
  pdfColors,
  showDeliveryTimeInLine = false,
}: InvoicePDFProps) {
  const subtotal = lines.reduce((s, l) => s + l.subtotal, 0);
  const discount = lines.reduce((s, l) => s + (l.quantity * l.unitPrice - l.subtotal), 0);
  const isProforma = documentType.toLowerCase().includes("proforma");
  const logoSrc = getLogoSrc(company?.logo);

  const companyName = company?.name?.toUpperCase() || "";
  const companyAddress = buildCompanyAddress(company);
  const companyTin = buildCompanyTin(company);
  const bankData = banks?.[0] || DEFAULT_BANK;

  const colors = buildPdfColors(pdfColors);
  const pdfStyles = buildPdfStyles(colors);

  return (
    <Page size="A4" style={pdfStyles.page}>
        {copyType && (
          <View style={[pdfStyles.copyBanner, { backgroundColor: copyType === "original" ? "#00796B" : "#9E9E9E" }]}>
            <Text style={[pdfStyles.copyBannerText, { color: "#FFFFFF" }]}>{copyType === "original" ? "ORIGINAL" : "DUPLICATE"}</Text>
          </View>
        )}
        <View style={pdfStyles.header}>
          <View style={pdfStyles.headerLeft}>
            {logoSrc && <Image src={logoSrc} style={pdfStyles.logo} />}
            <View style={pdfStyles.companyDetails}>
              <Text style={pdfStyles.companyName}>{companyName}</Text>
              <View style={pdfStyles.companyInfo}>
                <Text>{companyTin}</Text>
                <Text>{companyAddress}</Text>
                <Text>Tel: {company?.phone} {company?.email && `| ${company.email}`}</Text>
              </View>
            </View>
          </View>
          <View style={[pdfStyles.docTypeBadge, { backgroundColor: colors.primary }]}>
            <Text style={pdfStyles.docTypeLabel}>{documentType.toUpperCase()}</Text>
          </View>
        </View>

        <View style={pdfStyles.infoSection}>
          <View style={pdfStyles.infoCol}>
            <Text style={pdfStyles.infoLabel}>Bill To</Text>
            <Text style={pdfStyles.infoValue}>{partnerName}</Text>
            {partnerAddress && (
              <Text style={pdfStyles.infoAddress}>{partnerAddress}</Text>
            )}
          </View>
          <View style={pdfStyles.infoColRight}>
            <Text style={pdfStyles.infoValue}>{documentName}</Text>
            <Text style={pdfStyles.infoSubValue}>Date: {date}</Text>
            {dueDate && (
              <Text style={pdfStyles.infoSubValue}>Due Date: {dueDate}</Text>
            )}
            {origin && (
              <Text style={pdfStyles.infoSubValue}>Origin: {origin}</Text>
            )}
            {paymentState && !isProforma && (
              <View
                style={[
                  pdfStyles.paymentStatus,
                  {
                    backgroundColor:
                      paymentState === "paid"
                        ? "#E8F5E9"
                        : paymentState === "partial"
                          ? "#FFF3E0"
                          : "#FFEBEE",
                  },
                ]}
              >
                <Text
                  style={[
                    pdfStyles.paymentStatusText,
                    {
                      color:
                        paymentState === "paid"
                          ? "#2E7D32"
                          : paymentState === "partial"
                            ? "#E65100"
                            : "#C62828",
                    },
                  ]}
                >
                  {paymentState === "paid" ? "PAID" : paymentState === "partial" ? "PARTIAL" : "NOT PAID"}
                </Text>
              </View>
            )}
            {paymentTerms && (
              <Text style={pdfStyles.infoSubValue}>Payment Terms: {paymentTerms}</Text>
            )}
          </View>
        </View>

        {isProforma && (
          <View style={[pdfStyles.shippingBar, { backgroundColor: "#FFF8E1" }]}>
            <Text style={{ fontSize: 8, color: "#F59E0B", fontWeight: 700 }}>
              PROFORMA — This document is not a tax invoice. Prices are indicative and subject to change.
            </Text>
          </View>
        )}

        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableHeader}>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colNum]}>S/N</Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colDesc]}>Description</Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colPart]}>Part No.</Text>
            {showDeliveryTimeInLine && (
              <View style={[pdfStyles.tableHeaderCell, pdfStyles.colDelivery]}>
                <Text style={{ textAlign: "center" }}>DELIVERY</Text>
                <Text style={{ textAlign: "center" }}>TIME</Text>
              </View>
            )}
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colQty]}>Qty</Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colPrice]}>Unit price</Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colAmount]}>Amount (TZS)</Text>
          </View>
          {lines.map((line, idx) => (
            <View
              key={line.id}
              style={[
                pdfStyles.tableRow,
                ...(idx % 2 === 1 ? [pdfStyles.tableRowAlt] : []),
              ]}
            >
              <Text style={[pdfStyles.tableCell, pdfStyles.colNum]}>{idx + 1}</Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.colDesc]}>{line.description}</Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.colPart]}>{line.partNumber || ""}</Text>
              {showDeliveryTimeInLine && (
                <Text style={[pdfStyles.tableCell, pdfStyles.colDelivery]}>{line.deliveryTime || ""}</Text>
              )}
              <Text style={[pdfStyles.tableCell, pdfStyles.colQty]}>{line.quantity}</Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.colPrice]}>
                {formatCurrency(line.unitPrice)}
              </Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.colAmount]}>
                {formatCurrency(line.subtotal)}
              </Text>
            </View>
          ))}
        </View>

        <View style={pdfStyles.totalsSection}>
          <View style={pdfStyles.totalsRow}>
            <Text style={pdfStyles.totalsLabel}>Subtotal:</Text>
            <Text style={pdfStyles.totalsValue}>{formatCurrency(subtotal)}</Text>
          </View>
          {discount > 0 && (
            <View style={pdfStyles.totalsRow}>
              <Text style={pdfStyles.totalsLabel}>Discount:</Text>
              <Text style={[pdfStyles.totalsValue, { color: "#DC2626" }]}>
                -{formatCurrency(discount)}
              </Text>
            </View>
          )}
          <View style={pdfStyles.totalsRow}>
            <Text style={pdfStyles.totalsLabel}>Tax (18% VAT):</Text>
            <Text style={pdfStyles.totalsValue}>{formatCurrency(amountTax)}</Text>
          </View>
          <View style={pdfStyles.totalsTotalRow}>
            <Text style={pdfStyles.totalsTotalLabel}>TOTAL TZS:</Text>
            <Text style={pdfStyles.totalsTotalValue}>{formatCurrency(amountTotal)}</Text>
          </View>
        </View>

        <View style={pdfStyles.bankSection}>
          <Text style={pdfStyles.bankTitle}>Bank Details</Text>
          <View style={pdfStyles.bankGrid}>
            <View style={pdfStyles.bankCol}>
              <View style={pdfStyles.bankItem}>
                <Text style={pdfStyles.bankLabel}>Bank:</Text>
                <Text style={pdfStyles.bankValue}>{bankData.bank_name}</Text>
              </View>
              <View style={pdfStyles.bankItem}>
                <Text style={pdfStyles.bankLabel}>Beneficiary:</Text>
                <Text style={pdfStyles.bankValue}>{bankData.acc_holder_name}</Text>
              </View>
              <View style={pdfStyles.bankItem}>
                <Text style={pdfStyles.bankLabel}>TZS Account:</Text>
                <Text style={pdfStyles.bankValue}>{bankData.x_tzs_account}</Text>
              </View>
              <View style={pdfStyles.bankItem}>
                <Text style={pdfStyles.bankLabel}>USD Account:</Text>
                <Text style={pdfStyles.bankValue}>{bankData.x_usd_account}</Text>
              </View>
            </View>
            <View style={pdfStyles.bankDivider} />
            <View style={pdfStyles.bankCol}>
              <View style={pdfStyles.bankItem}>
                <Text style={pdfStyles.bankLabel}>Swift/BIC:</Text>
                <Text style={pdfStyles.bankValue}>{bankData.bank_bic}</Text>
              </View>
              <View style={pdfStyles.bankItem}>
                <Text style={pdfStyles.bankLabel}>Branch:</Text>
                <Text style={pdfStyles.bankValue}>{bankData.x_branch}</Text>
              </View>
              <View style={pdfStyles.bankItem}>
                <Text style={pdfStyles.bankLabel}>Sort Code:</Text>
                <Text style={pdfStyles.bankValue}>{bankData.x_sort_code}</Text>
              </View>
            </View>
          </View>
        </View>

        {notes && (
          <View style={{ padding: 16, borderTopWidth: 1, borderColor: colors.border }}>
            <Text style={pdfStyles.infoLabel}>Notes</Text>
            <Text style={{ fontSize: 8, marginTop: 4, lineHeight: 1.5 }}>{notes.replace(/<\/?p[^>]*>/gi, "").trim()}</Text>
          </View>
        )}

        <View style={pdfStyles.footer}>
          <Text>{companyName} | {companyTin}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
  );
}

export function InvoicePDF(props: InvoicePDFProps) {
  return (
    <Document>
      <InvoicePDFPage {...props} />
    </Document>
  );
}
