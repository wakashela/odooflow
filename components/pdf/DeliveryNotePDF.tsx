import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import { buildPdfStyles, buildPdfColors } from "@/lib/pdf/styles";
import { getLogoSrc } from "@/lib/pdf/logo";
import type { CompanySettings, BankDetail, PdfColorSettings } from "@/types/settings";

const DEFAULT_BANK = { bank_name: "", acc_holder_name: "", x_tzs_account: "", x_usd_account: "", bank_bic: "", x_branch: "", x_sort_code: "" } as unknown as BankDetail;

function buildCompanyAddress(company: CompanySettings | null | undefined) {
  if (!company) return "";
  return [company.street, company.street2, company.city, company.zip].filter(Boolean).join(", ") || "";
}

function buildCompanyTin(company: CompanySettings | null | undefined) {
  if (!company) return "";
  return company.vat || "";
}

interface DeliveryMove {
  id: number;
  productName: string;
  demand: number;
  done: number;
  uom: string;
}

interface DeliveryNotePDFProps {
  documentName: string;
  partnerName: string;
  partnerAddress?: string;
  scheduledDate: string;
  dateDone?: string;
  origin?: string;
  moves: DeliveryMove[];
  copyType?: "original" | "duplicate";
  company?: CompanySettings | null;
  banks?: BankDetail[];
  pdfColors?: PdfColorSettings;
}

export function DeliveryNotePDFPage({
  documentName,
  partnerName,
  partnerAddress,
  scheduledDate,
  dateDone,
  origin,
  moves,
  copyType,
  company,
  pdfColors,
  banks,
}: DeliveryNotePDFProps) {
  const logoSrc = getLogoSrc(company?.logo);

  const companyName = company?.name?.toUpperCase() || "";
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
                <Text>{buildCompanyAddress(company)}</Text>
                <Text>Tel: {company?.phone} {company?.email && `| ${company.email}`}</Text>
              </View>
            </View>
          </View>
          <View style={[pdfStyles.docTypeBadge, { backgroundColor: colors.primaryDark || colors.primary }]}>
            <Text style={pdfStyles.docTypeLabel}>DELIVERY NOTE</Text>
          </View>
        </View>

        <View style={pdfStyles.infoSection}>
          <View style={pdfStyles.infoCol}>
            <Text style={pdfStyles.infoLabel}>Deliver To</Text>
            <Text style={pdfStyles.infoValue}>{partnerName}</Text>
            {partnerAddress && (
              <Text style={pdfStyles.infoSubValue}>{partnerAddress}</Text>
            )}
          </View>
          <View style={pdfStyles.infoCol}>
            <Text style={pdfStyles.infoLabel}>Document Details</Text>
            <Text style={pdfStyles.infoValue}>{documentName}</Text>
            <Text style={pdfStyles.infoSubValue}>Scheduled: {scheduledDate}</Text>
            {dateDone && (
              <Text style={pdfStyles.infoSubValue}>Completed: {dateDone}</Text>
            )}
            {origin && (
              <Text style={pdfStyles.infoSubValue}>Origin: {origin}</Text>
            )}
          </View>
        </View>

        <View style={pdfStyles.table}>
          <View style={[pdfStyles.tableHeader, { backgroundColor: colors.primaryDark || colors.primary }]}>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colNum]}>#</Text>
            <Text style={[pdfStyles.tableHeaderCell, { width: "45%" }]}>Product</Text>
            <Text style={[pdfStyles.tableHeaderCell, { width: "15%", textAlign: "right" }]}>Demand</Text>
            <Text style={[pdfStyles.tableHeaderCell, { width: "15%", textAlign: "right" }]}>Delivered</Text>
            <Text style={[pdfStyles.tableHeaderCell, { width: "15%", textAlign: "right" }]}>UoM</Text>
          </View>
          {moves.map((move, idx) => (
            <View
              key={move.id}
              style={[
                pdfStyles.tableRow,
                ...(idx % 2 === 1 ? [pdfStyles.tableRowAlt] : []),
              ]}
            >
              <Text style={[pdfStyles.tableCell, pdfStyles.colNum]}>{idx + 1}</Text>
              <Text style={[pdfStyles.tableCell, { width: "45%" }]}>{move.productName}</Text>
              <Text style={[pdfStyles.tableCell, { width: "15%", textAlign: "right" }]}>{move.demand}</Text>
              <Text style={[pdfStyles.tableCell, { width: "15%", textAlign: "right", fontFamily: "Helvetica-Bold", fontWeight: 600 }]}>{move.done}</Text>
              <Text style={[pdfStyles.tableCell, { width: "15%", textAlign: "right" }]}>{move.uom}</Text>
            </View>
          ))}
        </View>

        <View style={{ padding: 40, flexDirection: "row", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "column", gap: 4 }}>
            <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: colors.textMuted }}>
              Received By
            </Text>
            <View style={{ borderBottomWidth: 1, borderColor: colors.border, width: 180, marginTop: 30 }} />
            <Text style={{ fontSize: 7, color: colors.textMuted }}>Name / Signature / Date</Text>
          </View>
          <View style={{ flexDirection: "column", gap: 4 }}>
            <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: colors.textMuted }}>
              Delivered By
            </Text>
            <View style={{ borderBottomWidth: 1, borderColor: colors.border, width: 180, marginTop: 30 }} />
            <Text style={{ fontSize: 7, color: colors.textMuted }}>Name / Signature / Date</Text>
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
              {bankData.x_tzs_account && (
                <View style={pdfStyles.bankItem}>
                  <Text style={pdfStyles.bankLabel}>TZS Account:</Text>
                  <Text style={pdfStyles.bankValue}>{bankData.x_tzs_account}</Text>
                </View>
              )}
              {bankData.x_usd_account && (
                <View style={pdfStyles.bankItem}>
                  <Text style={pdfStyles.bankLabel}>USD Account:</Text>
                  <Text style={pdfStyles.bankValue}>{bankData.x_usd_account}</Text>
                </View>
              )}
            </View>
            {bankData.bank_bic && (
              <View style={pdfStyles.bankDivider} />
            )}
            {bankData.bank_bic && (
              <View style={pdfStyles.bankCol}>
                <View style={pdfStyles.bankItem}>
                  <Text style={pdfStyles.bankLabel}>Swift/BIC:</Text>
                  <Text style={pdfStyles.bankValue}>{bankData.bank_bic}</Text>
                </View>
                {bankData.x_branch && (
                  <View style={pdfStyles.bankItem}>
                    <Text style={pdfStyles.bankLabel}>Branch:</Text>
                    <Text style={pdfStyles.bankValue}>{bankData.x_branch}</Text>
                  </View>
                )}
                {bankData.x_sort_code && (
                  <View style={pdfStyles.bankItem}>
                    <Text style={pdfStyles.bankLabel}>Sort Code:</Text>
                    <Text style={pdfStyles.bankValue}>{bankData.x_sort_code}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        <View style={pdfStyles.footer}>
          <Text>{companyName} | {companyTin}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
  );
}

export function DeliveryNotePDF(props: DeliveryNotePDFProps) {
  return (
    <Document>
      <DeliveryNotePDFPage {...props} />
    </Document>
  );
}
