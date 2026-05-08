import { StyleSheet } from "@react-pdf/renderer";

// Design tokens inspired by the Jensen sample PDF
export const C = {
  teal: "#0A9688",
  tealDark: "#00796B",
  tealLight: "#E0F2F1",
  tealMid: "#4DB6AC",
  white: "#FFFFFF",
  black: "#1A1A1A",
  textPrimary: "#212121",
  textSecondary: "#616161",
  textMuted: "#9E9E9E",
  border: "#E0E0E0",
  rowAlt: "#FAFAFA",
  amber: "#F57F17",
} as const;

export const T = {
  xs: 7,
  sm: 8,
  base: 9,
  md: 10,
  lg: 12,
  xl: 16,
} as const;

export const S = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
} as const;

export const PDF_COLORS = {
  primary: C.teal,
  primaryDark: C.tealDark,
  primaryLight: C.tealLight,
  accent: C.amber,
  text: C.textPrimary,
  textMuted: C.textMuted,
  white: C.white,
  rowAlt: C.rowAlt,
  border: C.border,
  totalsBg: C.tealLight,
};

export const pdfStyles = StyleSheet.create({
  // Page
  page: {
    fontFamily: "Helvetica",
    fontSize: T.base,
    color: PDF_COLORS.text,
    paddingTop: S.xl,
    paddingBottom: S.xl + 4,
    paddingHorizontal: S.xl * 2,
    backgroundColor: PDF_COLORS.white,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: S.md,
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.border,
    paddingBottom: S.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginLeft: -S.md,
  },
  headerLeftChild: {
    marginLeft: S.md,
  },
  logo: {
    width: 120,
    height: 42,
    objectFit: "contain",
  },
  companyDetails: {
    flexDirection: "column",
    justifyContent: "space-between",
    height: 42,
  },
  companyName: {
    fontSize: T.lg,
    fontFamily: "Helvetica-Bold",
    color: PDF_COLORS.text,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  companyInfo: {
    fontSize: T.xs,
    color: PDF_COLORS.textMuted,
    flexDirection: "column",
  },
  companyInfoItem: {
    marginBottom: 2,
  },

  // Copy banner (original / duplicate)
  copyBanner: {
    width: "100%",
    paddingVertical: 4,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  copyBannerText: {
    fontSize: T.sm,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    textAlign: "center",
  },

  // Document type badge
  docTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  docTypeLabel: {
    fontSize: T.sm,
    fontFamily: "Helvetica-Bold",
    color: PDF_COLORS.white,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  // Info block
  infoSection: {
    flexDirection: "row",
    paddingVertical: S.md,
    marginRight: -S.lg,
    borderBottomWidth: 0.5,
    borderColor: PDF_COLORS.border,
  },
  infoCol: {
    flex: 1,
    flexDirection: "column",
    marginRight: S.lg,
  },
  infoColItem: {
    marginBottom: 2,
  },
  infoLabel: {
    fontSize: T.xs,
    fontFamily: "Helvetica-Bold",
    color: PDF_COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: T.md,
    fontFamily: "Helvetica-Bold",
    color: PDF_COLORS.text,
  },
  infoSubValue: {
    fontSize: T.sm,
    color: PDF_COLORS.textMuted,
  },

  // Shipping / small info bar
  shippingBar: {
    flexDirection: "row",
    padding: S.md,
    backgroundColor: PDF_COLORS.rowAlt,
    borderBottomWidth: 0.5,
    borderColor: PDF_COLORS.border,
    marginRight: -S.lg,
  },
  shippingItem: {
    flexDirection: "column",
    marginRight: S.lg,
  },
  shippingItemLabel: {
    marginBottom: 2,
  },

  // Table
  table: {
    marginTop: S.md,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: PDF_COLORS.primary,
    color: PDF_COLORS.white,
    fontFamily: "Helvetica-Bold",
    fontSize: T.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableHeaderCell: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    color: PDF_COLORS.white,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: PDF_COLORS.border,
    paddingVertical: 6,
  },
  tableRowAlt: {
    backgroundColor: PDF_COLORS.rowAlt,
  },
  tableCell: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: T.sm,
    color: PDF_COLORS.text,
  },

  // Columns
  colDesc: { width: "32%" },
  colPart: { width: "10%" },
  colActivity: { width: "15%" },
  colDate: { width: "12%" },
  colQty: { width: "8%", textAlign: "right" },
  colPrice: { width: "11%", textAlign: "right" },
  colAmount: { width: "12%", textAlign: "right", fontFamily: "Helvetica-Bold" },
  colNum: { width: "5%", textAlign: "center", color: PDF_COLORS.textMuted },

  // Totals
  totalsSection: {
    flexDirection: "column",
    marginTop: S.md,
    borderTopWidth: 1.5,
    borderTopColor: PDF_COLORS.primary,
    paddingTop: S.sm,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  totalsLabel: {
    width: "40%",
    textAlign: "right",
    fontSize: T.sm,
    color: PDF_COLORS.textMuted,
    paddingRight: 16,
  },
  totalsValue: {
    width: "25%",
    textAlign: "right",
    fontSize: T.sm,
    fontFamily: "Helvetica-Bold",
  },
  totalsTotalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    backgroundColor: PDF_COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 2,
  },
  totalsTotalLabel: {
    width: "40%",
    textAlign: "right",
    fontSize: T.lg,
    fontFamily: "Helvetica-Bold",
    color: PDF_COLORS.white,
    paddingRight: 16,
  },
  totalsTotalValue: {
    width: "25%",
    textAlign: "right",
    fontSize: T.lg,
    fontFamily: "Helvetica-Bold",
    color: PDF_COLORS.white,
  },

  // Bank details / footer block
  bankSection: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: PDF_COLORS.border,
    backgroundColor: PDF_COLORS.white,
    marginTop: S.md,
  },
  bankTitle: {
    fontSize: T.xs,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: PDF_COLORS.textMuted,
    marginBottom: 8,
  },
  bankGrid: {
    flexDirection: "row",
    fontSize: T.xs,
  },
  bankCol: {
    flexDirection: "column",
  },
  bankItem: {
    marginBottom: 3,
  },
  bankLabel: {
    color: PDF_COLORS.textMuted,
    fontSize: T.xs,
  },
  bankValue: {
    fontFamily: "Helvetica-Bold",
    color: PDF_COLORS.text,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: T.xs,
    color: PDF_COLORS.textMuted,
  },
});

