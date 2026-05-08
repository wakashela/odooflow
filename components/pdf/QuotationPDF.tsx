

import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import { pdfStyles, PDF_COLORS } from "@/lib/pdf/styles";
import { getLogoSrc } from "@/lib/pdf/logo";
import type { LineItem } from "@/types/documents";
import { formatCurrency } from "@/lib/utils";

interface QuotationPDFProps {
  documentName: string;
  documentType: string;
  partnerName: string;
  partnerAddress?: string;
  date: string;
  expiryDate?: string;
  lines: LineItem[];
  amountUntaxed: number;
  amountTax: number;
  amountTotal: number;
  trackingNo?: string;
  deliveryTime?: string;
  shipVia?: string;
  notes?: string;
  paymentTerms?: string;
  copyType?: "original" | "duplicate";
}

export function QuotationPDFPage({
  documentName,
  documentType,
  partnerName,
  partnerAddress,
  date,
  expiryDate,
  lines,
  amountUntaxed,
  amountTax,
  amountTotal,
  trackingNo,
  deliveryTime,
  shipVia,
  notes,
  paymentTerms,
  copyType,
}: QuotationPDFProps) {
  const subtotal = lines.reduce((s, l) => s + l.subtotal, 0);
  const discount = lines.reduce((s, l) => s + (l.quantity * l.unitPrice - l.subtotal), 0);
  const logoSrc = getLogoSrc();

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
            <View style={[pdfStyles.companyDetails, pdfStyles.headerLeftChild]}>
              <Text style={pdfStyles.companyName}>JENSEN AUTOMATIONS TECHNOLOGY LIMITED</Text>
              <View style={pdfStyles.companyInfo}>
                <Text style={pdfStyles.companyInfoItem}>TIN: 168-782-179 | VRN: 40-315066-K</Text>
                <Text style={pdfStyles.companyInfoItem}>21493 Dar es salaam, TANZANIA</Text>
                <Text style={pdfStyles.companyInfoItem}>Tel: +255745205050 | info@jensenintl.com</Text>
              </View>
            </View>
          </View>
          <View style={[pdfStyles.docTypeBadge, { backgroundColor: PDF_COLORS.primary }]}>
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
{expiryDate && (
          <Text style={pdfStyles.infoSubValue}>Valid Until: {expiryDate}</Text>
        )}
        {paymentTerms && (
          <Text style={pdfStyles.infoSubValue}>Payment Terms: {paymentTerms}</Text>
        )}
        </View>
        </View>

        {(shipVia || trackingNo || deliveryTime) && (
          <View style={pdfStyles.shippingBar}>
            {shipVia && (
              <View style={pdfStyles.shippingItem}>
                <Text style={pdfStyles.infoLabel}>Ship Via</Text>
                <Text style={[pdfStyles.shippingItemLabel, { fontSize: 9, fontWeight: 600 }]}>{shipVia}</Text>
              </View>
            )}
            {trackingNo && (
              <View style={pdfStyles.shippingItem}>
                <Text style={pdfStyles.infoLabel}>Tracking</Text>
                <Text style={[pdfStyles.shippingItemLabel, { fontSize: 9, fontWeight: 600 }]}>{trackingNo}</Text>
              </View>
            )}
            {deliveryTime && (
              <View style={pdfStyles.shippingItem}>
                <Text style={pdfStyles.infoLabel}>Delivery Time</Text>
                <Text style={[pdfStyles.shippingItemLabel, { fontSize: 9, fontWeight: 600 }]}>{deliveryTime}</Text>
              </View>
            )}
          </View>
        )}

        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableHeader}>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colNum]}>#</Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colDesc]}>Description</Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colPart]}>Part No.</Text>
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
              <Text style={[pdfStyles.tableCell, pdfStyles.colPart]}>{line.partNumber || ""}</Text>
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
              <Text style={pdfStyles.bankItem}><Text style={pdfStyles.bankLabel}>Beneficiary: </Text><Text style={pdfStyles.bankValue}>Jensen Automations Technology Limited</Text></Text>
              <Text style={pdfStyles.bankItem}><Text style={pdfStyles.bankLabel}>TZS Account: </Text><Text style={pdfStyles.bankValue}>015C001GAEC00</Text></Text>
              <Text style={pdfStyles.bankItem}><Text style={pdfStyles.bankLabel}>USD Account: </Text><Text style={pdfStyles.bankValue}>025C001GAEC00</Text></Text>
            </View>
            <View style={pdfStyles.bankCol}>
              <Text style={pdfStyles.bankItem}><Text style={pdfStyles.bankLabel}>Swift: </Text><Text style={pdfStyles.bankValue}>CORUTZTZ</Text></Text>
              <Text style={pdfStyles.bankItem}><Text style={pdfStyles.bankLabel}>Branch: </Text><Text style={pdfStyles.bankValue}>UDSM Branch</Text></Text>
              <Text style={pdfStyles.bankItem}><Text style={pdfStyles.bankLabel}>Sort Code: </Text><Text style={pdfStyles.bankValue}>3386</Text></Text>
            </View>
          </View>
        </View>

        {notes && (
          <View style={{ padding: 16, borderTopWidth: 1, borderColor: PDF_COLORS.border }}>
            <Text style={pdfStyles.infoLabel}>Terms & Conditions</Text>
            <Text style={{ fontSize: 8, marginTop: 4, lineHeight: 1.5 }}>{notes}</Text>
          </View>
        )}

        <View style={pdfStyles.footer}>
          <Text>Jensen Automations Technology Limited | TIN: 168-782-179</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
  );
}

export function QuotationPDF(props: QuotationPDFProps) {
  return (
    <Document>
      <QuotationPDFPage {...props} />
    </Document>
  );
}
