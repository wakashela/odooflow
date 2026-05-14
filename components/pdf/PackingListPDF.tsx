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

interface PackingListPDFProps {
  documentName: string;
  partnerName: string;
  partnerAddress?: string;
  scheduledDate: string;
  dateDone?: string;
  origin?: string;
  moves: DeliveryMove[];
  packages?: number;
  weight?: string;
  copyType?: "original" | "duplicate";
  company?: CompanySettings | null;
  banks?: BankDetail[];
  pdfColors?: PdfColorSettings;
}

export function PackingListPDFPage({
  documentName,
  partnerName,
  partnerAddress,
  scheduledDate,
  dateDone,
  origin,
  moves,
  packages,
  weight,
  copyType,
  company,
  pdfColors,
  banks,
}: PackingListPDFProps) {
  const logoSrc = getLogoSrc(company?.logo);

  const companyName = company?.name?.toUpperCase() || "";
  const companyTin = buildCompanyTin(company);
  const bankData = banks?.[0] || DEFAULT_BANK;

  const colors = buildPdfColors(pdfColors);
  const pdfStyles = buildPdfStyles(colors);

  return (
    <Page size="A4" style={pdfStyles.page}>
        {copyType && (
          <View
            style={[
              pdfStyles.copyBanner,
              {
                backgroundColor:
                  copyType === "original" ? "#00796B" : "#9E9E9E",
              },
            ]}
          >
            <Text style={[pdfStyles.copyBannerText, { color: "#FFFFFF" }]}>
              {copyType === "original" ? "ORIGINAL" : "DUPLICATE"}
            </Text>
          </View>
        )}

        <View style={pdfStyles.header}>
          <View style={pdfStyles.headerLeft}>
            {logoSrc && <Image src={logoSrc} style={pdfStyles.logo} />}
            <View style={pdfStyles.companyDetails}>
              <Text style={pdfStyles.companyName}>
                {companyName}
              </Text>
              <View style={pdfStyles.companyInfo}>
                <Text>{companyTin}</Text>
                <Text>{buildCompanyAddress(company)}</Text>
                <Text>Tel: {company?.phone} {company?.email && `| ${company.email}`}</Text>
              </View>
            </View>
          </View>
          <View style={[pdfStyles.docTypeBadge, { backgroundColor: colors.accent }]}>
            <Text style={pdfStyles.docTypeLabel}>PACKING LIST</Text>
          </View>
        </View>

        <View style={pdfStyles.infoSection}>
          <View style={pdfStyles.infoCol}>
            <Text style={pdfStyles.infoLabel}>Deliver To</Text>
            <Text style={pdfStyles.infoValue}>{partnerName}</Text>
            {partnerAddress && (
              <Text style={pdfStyles.infoAddress}>{partnerAddress}</Text>
            )}
          </View>
          <View style={pdfStyles.infoColRight}>
            <Text style={pdfStyles.infoValue}>{documentName}</Text>
            <Text style={pdfStyles.infoSubValue}>
              Scheduled: {scheduledDate}
            </Text>
            {dateDone && (
              <Text style={pdfStyles.infoSubValue}>
                Completed: {dateDone}
              </Text>
            )}
            {origin && (
              <Text style={pdfStyles.infoSubValue}>Origin: {origin}</Text>
            )}
          </View>
        </View>

        <View style={pdfStyles.table}>
          <View style={[pdfStyles.tableHeader, { backgroundColor: colors.accent }]}>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colNum]}>
              #
            </Text>
            <Text style={[pdfStyles.tableHeaderCell, { width: "45%" }]}>
              Product
            </Text>
            <Text
              style={[
                pdfStyles.tableHeaderCell,
                { width: "15%", textAlign: "right" },
              ]}
            >
              Ordered
            </Text>
            <Text
              style={[
                pdfStyles.tableHeaderCell,
                { width: "15%", textAlign: "right" },
              ]}
            >
              Shipped
            </Text>
            <Text
              style={[
                pdfStyles.tableHeaderCell,
                { width: "15%", textAlign: "right" },
              ]}
            >
              UoM
            </Text>
          </View>

          {moves.map((move, idx) => (
            <View
              key={move.id}
              style={[
                pdfStyles.tableRow,
                ...(idx % 2 === 1 ? [pdfStyles.tableRowAlt] : []),
              ]}
            >
              <Text style={[pdfStyles.tableCell, pdfStyles.colNum]}>
                {idx + 1}
              </Text>
              <Text style={[pdfStyles.tableCell, { width: "45%" }]}>
                {move.productName}
              </Text>
              <Text
                style={[
                  pdfStyles.tableCell,
                  { width: "15%", textAlign: "right" },
                ]}
              >
                {move.demand}
              </Text>
              <Text
                style={[
                  pdfStyles.tableCell,
                  {
                    width: "15%",
                    textAlign: "right",
                    fontFamily: "Helvetica-Bold",
                  },
                ]}
              >
                {move.done}
              </Text>
              <Text
                style={[
                  pdfStyles.tableCell,
                  { width: "15%", textAlign: "right" },
                ]}
              >
                {move.uom}
              </Text>
            </View>
          ))}
        </View>

        <View
          style={{
            padding: 16,
            borderTopWidth: 1,
            borderColor: colors.border,
            marginTop: 8,
          }}
        >
          <Text
            style={{
              fontSize: 8,
              fontFamily: "Helvetica-Bold",
              textTransform: "uppercase",
              letterSpacing: 0.6,
              color: colors.textMuted,
              marginBottom: 8,
            }}
          >
            Package Summary
          </Text>
          <View style={{ flexDirection: "row", fontSize: 8 }}>
            <View style={{ flexDirection: "column", marginRight: 32 }}>
              <Text style={pdfStyles.bankLabel}>Total Packages</Text>
              <Text style={pdfStyles.bankValue}>
                {packages || moves.length}
              </Text>
            </View>
            {weight && (
              <View style={{ flexDirection: "column" }}>
                <Text style={pdfStyles.bankLabel}>Total Weight</Text>
                <Text style={pdfStyles.bankValue}>{weight}</Text>
              </View>
            )}
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
              <>
                <View style={pdfStyles.bankDivider} />
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
              </>
            )}
          </View>
        </View>

        <View style={pdfStyles.footer}>
          <Text>{companyName} | {companyTin}</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
  );
}

export function PackingListPDF(props: PackingListPDFProps) {
  return (
    <Document>
      <PackingListPDFPage {...props} />
    </Document>
  );
}
