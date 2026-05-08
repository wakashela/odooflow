import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import { pdfStyles, PDF_COLORS } from "@/lib/pdf/styles";
import { getLogoSrc } from "@/lib/pdf/logo";

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
}: PackingListPDFProps) {
  const logoSrc = getLogoSrc();

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
                JENSEN AUTOMATIONS TECHNOLOGY LIMITED
              </Text>
              <View style={pdfStyles.companyInfo}>
                <Text>TIN: 168-782-179 | VRN: 40-315066-K</Text>
                <Text>21493 Dar es salaam, TANZANIA</Text>
                <Text>Tel: +255745205050 | info@jensenintl.com</Text>
              </View>
            </View>
          </View>
          <View style={[pdfStyles.docTypeBadge, { backgroundColor: "#6D28D9" }]}>
            <Text style={pdfStyles.docTypeLabel}>PACKING LIST</Text>
          </View>
        </View>

        <View style={pdfStyles.infoSection}>
          <View style={pdfStyles.infoCol}>
            <Text style={pdfStyles.infoLabel}>Ship To</Text>
            <Text style={pdfStyles.infoValue}>{partnerName}</Text>
            {partnerAddress && (
              <Text style={pdfStyles.infoSubValue}>{partnerAddress}</Text>
            )}
          </View>
          <View style={pdfStyles.infoCol}>
            <Text style={pdfStyles.infoLabel}>Document Details</Text>
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
          <View style={[pdfStyles.tableHeader, { backgroundColor: "#6D28D9" }]}>
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
            borderColor: PDF_COLORS.border,
            marginTop: 8,
          }}
        >
          <Text
            style={{
              fontSize: 8,
              fontFamily: "Helvetica-Bold",
              textTransform: "uppercase",
              letterSpacing: 0.6,
              color: PDF_COLORS.textMuted,
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
          <Text>Jensen Automations Technology Limited | TIN: 168-782-179</Text>
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
