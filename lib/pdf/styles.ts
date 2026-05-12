import { StyleSheet } from "@react-pdf/renderer";
import type { PdfColorSettings } from "@/types/settings";

// Design tokens inspired by the Jensen sample PDF
export const C = {
  teal: "#0A9688",
  tealDark: "#00796B",
  tealLight: "#E0F2F1",
  tealMid: "#4DB6AC",
  white: "#FFFFFF",
  black: "#000000",
  textPrimary: "#000000",
  textSecondary: "#000000",
  textMuted: "#000000",
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
  black: C.black,
};

export function buildPdfColors(overrides?: Partial<PdfColorSettings>) {
  const primary = overrides?.primary || PDF_COLORS.primary;
  const primaryDark = overrides?.primaryDark || PDF_COLORS.primaryDark;
  return {
    ...PDF_COLORS,
    primary,
    primaryDark,
    primaryLight: lighten(primary, 0.7),
    totalsBg: lighten(primary, 0.85),
  };
}

function lighten(hex: string, amount: number): string {
  const c = hex.replace("#", "");
  const r = Math.min(255, Math.round(parseInt(c.substring(0, 2), 16) + (255 - parseInt(c.substring(0, 2), 16)) * amount));
  const g = Math.min(255, Math.round(parseInt(c.substring(2, 4), 16) + (255 - parseInt(c.substring(2, 4), 16)) * amount));
  const b = Math.min(255, Math.round(parseInt(c.substring(4, 6), 16) + (255 - parseInt(c.substring(4, 6), 16)) * amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function buildPdfStyles(colors?: ReturnType<typeof buildPdfColors>) {
  const c = colors || PDF_COLORS;
  return StyleSheet.create({
    page: {
      fontFamily: "Helvetica",
      fontSize: T.base,
      color: c.text,
      paddingTop: S.xl,
      paddingBottom: S.xl + 4,
      paddingHorizontal: S.xl * 2,
      backgroundColor: c.white,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: S.md,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
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
      color: c.text,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    companyInfo: {
      fontSize: T.xs,
      color: c.textMuted,
      flexDirection: "column",
    },
    companyInfoItem: {
      marginBottom: 2,
    },
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
    docTypeBadge: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 4,
      alignSelf: "flex-start",
    },
    docTypeLabel: {
      fontSize: T.sm,
      fontFamily: "Helvetica-Bold",
      color: c.white,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    infoSection: {
      flexDirection: "row",
      paddingVertical: S.md,
      marginRight: -S.lg,
      borderBottomWidth: 0.5,
      borderColor: c.border,
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
      color: c.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    infoValue: {
      fontSize: T.md,
      fontFamily: "Helvetica-Bold",
      color: c.text,
    },
    infoSubValue: {
      fontSize: T.sm,
      color: c.textMuted,
    },
    shippingBar: {
      flexDirection: "row",
      padding: S.md,
      backgroundColor: c.rowAlt,
      borderBottomWidth: 0.5,
      borderColor: c.border,
      marginRight: -S.lg,
    },
    shippingItem: {
      flexDirection: "column",
      marginRight: S.lg,
    },
    shippingItemLabel: {
      marginBottom: 2,
    },
    table: {
      marginTop: S.md,
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: c.primary,
      color: c.white,
      fontFamily: "Helvetica-Bold",
      fontSize: T.xs,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    tableHeaderCell: {
      paddingVertical: 8,
      paddingHorizontal: 10,
      color: c.white,
      borderRightWidth: 0.5,
      borderRightColor: c.white,
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderColor: c.border,
      paddingVertical: 6,
    },
    tableRowAlt: {
      backgroundColor: c.rowAlt,
    },
    tableCell: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      fontSize: T.sm,
      color: c.text,
      borderRightWidth: 0.5,
      borderRightColor: c.border,
    },
    colDesc: { width: "32%" },
    colPart: { width: "10%" },
    colActivity: { width: "15%" },
    colDate: { width: "12%" },
    colQty: { width: "8%", textAlign: "right" },
    colPrice: { width: "11%", textAlign: "right" },
    colAmount: { width: "12%", textAlign: "right", fontFamily: "Helvetica-Bold" },
    colNum: { width: "5%", textAlign: "center", color: c.textMuted, borderRightWidth: 0.5, borderRightColor: c.border },
    totalsSection: {
      flexDirection: "column",
      marginTop: S.md,
      borderTopWidth: 1.5,
      borderTopColor: c.primary,
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
      color: c.textMuted,
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
      backgroundColor: c.primary,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 2,
    },
    totalsTotalLabel: {
      width: "40%",
      textAlign: "right",
      fontSize: T.lg,
      fontFamily: "Helvetica-Bold",
      color: c.white,
      paddingRight: 16,
    },
    totalsTotalValue: {
      width: "25%",
      textAlign: "right",
      fontSize: T.lg,
      fontFamily: "Helvetica-Bold",
      color: c.white,
    },
    bankSection: {
      padding: 16,
      borderTopWidth: 1.5,
      borderColor: c.border,
      backgroundColor: c.white,
      marginTop: S.md,
    },
    bankTitle: {
      fontSize: T.base,
      fontFamily: "Helvetica-Bold",
      color: c.black,
      marginBottom: 12,
      paddingBottom: 6,
      borderBottomWidth: 0.5,
      borderBottomColor: c.border,
    },
    bankGrid: {
      flexDirection: "row",
      fontSize: T.sm,
    },
    bankCol: {
      flexDirection: "column",
      flex: 1,
    },
    bankItem: {
      marginBottom: 4,
      flexDirection: "row",
      alignItems: "flex-start",
    },
    bankLabel: {
      fontFamily: "Helvetica-Bold",
      color: c.black,
      fontSize: T.sm,
      width: 100,
    },
    bankValue: {
      color: c.black,
      fontSize: T.sm,
      flex: 1,
    },
    bankDivider: {
      width: 1,
      backgroundColor: c.border,
      marginHorizontal: 20,
    },
    footer: {
      position: "absolute",
      bottom: 20,
      left: 20,
      right: 20,
      flexDirection: "row",
      justifyContent: "space-between",
      fontSize: T.xs,
      color: c.textMuted,
    },
  });
}

export const pdfStyles = buildPdfStyles();

