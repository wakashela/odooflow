import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import { pdfStyles, PDF_COLORS } from "@/lib/pdf/styles";
import { getLogoSrc } from "@/lib/pdf/logo";
import type { LineItem } from "@/types/documents";
import { formatCurrency } from "@/lib/utils";

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
}

export function InvoicePDF({
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
}: InvoicePDFProps) {
  const subtotal = lines.reduce((s, l) => s + l.subtotal, 0);
  const discount = lines.reduce((s, l) => s + (l.quantity * l.unitPrice - l.subtotal), 0);
  const isProforma = documentType.toLowerCase().includes("proforma");
  const logoSrc = getLogoSrc();

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          <View style={pdfStyles.headerLeft}>
            {logoSrc && <Image src={logoSrc} style={pdfStyles.logo} />}
            <View style={pdfStyles.companyDetails}>
              <Text style={pdfStyles.companyName}>JENSEN AUTOMATIONS TECHNOLOGY LIMITED</Text>
              <View style={pdfStyles.companyInfo}>
                <Text>TIN: 168-782-179 | VRN: 40-315066-K</Text>
                <Text>21493 Dar es salaam, TANZANIA</Text>
                <Text>Tel: +255745205050 | info@jensenintl.com</Text>
              </View>
            </View>
          </View>
          <View style={pdfStyles.docTypeBadge}>
            <Text style={pdfStyles.docTypeLabel}>{documentType.toUpperCase()}</Text>
          </View>
        </View>

        <View style={pdfStyles.infoSection}>
          <View style={pdfStyles.infoCol}>
            <Text style={pdfStyles.infoLabel}>Bill To</Text>
            <Text style={pdfStyles.infoValue}>{partnerName}</Text>
            {partnerAddress && (
              <Text style={pdfStyles.infoSubValue}>{partnerAddress}</Text>
            )}
          </View>
          <View style={pdfStyles.infoCol}>
            <Text style={pdfStyles.infoLabel}>Document Details</Text>
            <Text style={pdfStyles.infoValue}>{documentName}</Text>
            <Text style={pdfStyles.infoSubValue}>Date: {date}</Text>
            {dueDate && (
              <Text style={pdfStyles.infoSubValue}>Due Date: {dueDate}</Text>
            )}
            {origin && (
              <Text style={pdfStyles.infoSubValue}>Origin: {origin}</Text>
            )}
            {paymentState && !isProforma && (
              <Text style={pdfStyles.infoSubValue}>Payment: {paymentState}</Text>
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
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colNum]}>#</Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colDesc]}>Description</Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colQty]}>Qty</Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colPrice]}>Rate</Text>
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
              <Text><Text style={pdfStyles.bankLabel}>Bank: </Text><Text style={pdfStyles.bankValue}>CRDB BANK</Text></Text>
              <Text><Text style={pdfStyles.bankLabel}>Beneficiary: </Text><Text style={pdfStyles.bankValue}>Jensen Automations Technology Limited</Text></Text>
              <Text><Text style={pdfStyles.bankLabel}>TZS Account: </Text><Text style={pdfStyles.bankValue}>015C001GAEC00</Text></Text>
              <Text><Text style={pdfStyles.bankLabel}>USD Account: </Text><Text style={pdfStyles.bankValue}>025C001GAEC00</Text></Text>
            </View>
            <View style={pdfStyles.bankCol}>
              <Text><Text style={pdfStyles.bankLabel}>Swift: </Text><Text style={pdfStyles.bankValue}>CORUTZTZ</Text></Text>
              <Text><Text style={pdfStyles.bankLabel}>Branch: </Text><Text style={pdfStyles.bankValue}>UDSM Branch</Text></Text>
              <Text><Text style={pdfStyles.bankLabel}>Sort Code: </Text><Text style={pdfStyles.bankValue}>3386</Text></Text>
            </View>
          </View>
        </View>

        {notes && (
          <View style={{ padding: 16, borderTopWidth: 1, borderColor: PDF_COLORS.border }}>
            <Text style={pdfStyles.infoLabel}>Notes</Text>
            <Text style={{ fontSize: 8, marginTop: 4, lineHeight: 1.5 }}>{notes}</Text>
          </View>
        )}

        <View style={pdfStyles.footer}>
          <Text>Jensen Automations Technology Limited | TIN: 168-782-179</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
