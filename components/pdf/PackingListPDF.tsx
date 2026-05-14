import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import { buildPdfStyles, buildPdfColors } from "@/lib/pdf/styles";
import { getLogoSrc } from "@/lib/pdf/logo";
import type { CompanySettings, PdfColorSettings } from "@/types/settings";

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
}: PackingListPDFProps) {
  const logoSrc = getLogoSrc(company?.logo);

  const companyName = company?.name?.toUpperCase() || "";
  const companyTin = buildCompanyTin(company);

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
