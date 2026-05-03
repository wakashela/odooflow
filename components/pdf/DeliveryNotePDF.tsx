

import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import { pdfStyles, PDF_COLORS } from "@/lib/pdf/styles";

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
  scheduledDate: string;
  dateDone?: string;
  origin?: string;
  moves: DeliveryMove[];
}

export function DeliveryNotePDF({
  documentName,
  partnerName,
  scheduledDate,
  dateDone,
  origin,
  moves,
}: DeliveryNotePDFProps) {
  const logoPath = `${process.cwd()}/public/logo.png`;

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          <View style={pdfStyles.headerLeft}>
            <Image src={logoPath} style={pdfStyles.logo} />
            <View style={pdfStyles.companyDetails}>
              <Text style={pdfStyles.companyName}>JENSEN AUTOMATIONS TECHNOLOGY LIMITED</Text>
              <View style={pdfStyles.companyInfo}>
                <Text>TIN: 168-782-179 | VRN: 40-315066-K</Text>
                <Text>21493 Dar es salaam, TANZANIA</Text>
                <Text>Tel: +255745205050 | info@jensenintl.com</Text>
              </View>
            </View>
          </View>
          <View style={[pdfStyles.docTypeBadge, { backgroundColor: "#059669" }]}>
            <Text style={pdfStyles.docTypeLabel}>DELIVERY NOTE</Text>
          </View>
        </View>

        <View style={pdfStyles.infoSection}>
          <View style={pdfStyles.infoCol}>
            <Text style={pdfStyles.infoLabel}>Deliver To</Text>
            <Text style={pdfStyles.infoValue}>{partnerName}</Text>
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
          <View style={[pdfStyles.tableHeader, { backgroundColor: "#059669" }]}>
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
            <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: PDF_COLORS.textMuted }}>
              Received By
            </Text>
            <View style={{ borderBottomWidth: 1, borderColor: PDF_COLORS.border, width: 180, marginTop: 30 }} />
            <Text style={{ fontSize: 7, color: PDF_COLORS.textMuted }}>Name / Signature / Date</Text>
          </View>
          <View style={{ flexDirection: "column", gap: 4 }}>
            <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: PDF_COLORS.textMuted }}>
              Delivered By
            </Text>
            <View style={{ borderBottomWidth: 1, borderColor: PDF_COLORS.border, width: 180, marginTop: 30 }} />
            <Text style={{ fontSize: 7, color: PDF_COLORS.textMuted }}>Name / Signature / Date</Text>
          </View>
        </View>

        <View style={pdfStyles.footer}>
          <Text>Jensen Automations Technology Limited | TIN: 168-782-179</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
