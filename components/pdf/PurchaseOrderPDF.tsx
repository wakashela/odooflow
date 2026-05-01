"use client";

import { Document, Page, Text, View } from "@react-pdf/renderer";
import { pdfStyles, PDF_COLORS } from "@/lib/pdf/styles";
import type { LineItem } from "@/types/documents";
import { formatCurrency } from "@/lib/utils";

interface PurchaseOrderPDFProps {
  documentName: string;
  partnerName: string;
  date: string;
  plannedDate?: string;
  origin?: string;
  lines: LineItem[];
  amountUntaxed: number;
  amountTax: number;
  amountTotal: number;
  notes?: string;
}

export function PurchaseOrderPDF({
  documentName,
  partnerName,
  date,
  plannedDate,
  origin,
  lines,
  amountUntaxed,
  amountTax,
  amountTotal,
  notes,
}: PurchaseOrderPDFProps) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          <View style={pdfStyles.headerLeft}>
            <Text style={pdfStyles.companyName}>JENSEN INTERNATIONAL LIMITED</Text>
            <View style={pdfStyles.companyInfo}>
              <Text>TIN: 123-456-789 | VRN: 00-000-000</Text>
              <Text>Dar es Salaam, Tanzania</Text>
              <Text>Tel: +255 22 270 0000 | info@jensenintl.co.tz</Text>
            </View>
          </View>
          <View style={[pdfStyles.docTypeBadge, { backgroundColor: "#D4A017" }]}>
            <Text style={pdfStyles.docTypeLabel}>PURCHASE ORDER</Text>
          </View>
        </View>

        <View style={pdfStyles.infoSection}>
          <View style={pdfStyles.infoCol}>
            <Text style={pdfStyles.infoLabel}>Vendor</Text>
            <Text style={pdfStyles.infoValue}>{partnerName}</Text>
          </View>
          <View style={pdfStyles.infoCol}>
            <Text style={pdfStyles.infoLabel}>Document Details</Text>
            <Text style={pdfStyles.infoValue}>{documentName}</Text>
            <Text style={pdfStyles.infoSubValue}>Date: {date}</Text>
            {plannedDate && (
              <Text style={pdfStyles.infoSubValue}>Planned Date: {plannedDate}</Text>
            )}
            {origin && (
              <Text style={pdfStyles.infoSubValue}>Origin: {origin}</Text>
            )}
          </View>
        </View>

        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableHeader}>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colNum]}>#</Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colDesc]}>Description</Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colQty]}>Qty</Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colPrice]}>Unit Price</Text>
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
            <Text style={pdfStyles.totalsValue}>{formatCurrency(amountUntaxed)}</Text>
          </View>
          <View style={pdfStyles.totalsRow}>
            <Text style={pdfStyles.totalsLabel}>Tax:</Text>
            <Text style={pdfStyles.totalsValue}>{formatCurrency(amountTax)}</Text>
          </View>
          <View style={pdfStyles.totalsTotalRow}>
            <Text style={pdfStyles.totalsTotalLabel}>TOTAL TZS:</Text>
            <Text style={pdfStyles.totalsTotalValue}>{formatCurrency(amountTotal)}</Text>
          </View>
        </View>

        {notes && (
          <View style={{ padding: 16, borderTopWidth: 1, borderColor: PDF_COLORS.border }}>
            <Text style={pdfStyles.infoLabel}>Notes</Text>
            <Text style={{ fontSize: 8, marginTop: 4, lineHeight: 1.5 }}>{notes}</Text>
          </View>
        )}

        <View style={pdfStyles.footer}>
          <Text>Jensen International Limited | TIN: 123-456-789</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
