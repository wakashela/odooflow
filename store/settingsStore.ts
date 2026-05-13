import { create } from "zustand";
import type { CompanySettings, BankDetail, PdfColorSettings, PrintSettings } from "@/types/settings";

interface SettingsState {
  company: CompanySettings | null;
  banks: BankDetail[];
  pdfColors: PdfColorSettings;
  printSettings: PrintSettings;
  loading: boolean;
  setCompany: (company: CompanySettings | null) => void;
  setBanks: (banks: BankDetail[]) => void;
  setPdfColors: (colors: PdfColorSettings) => void;
  setPrintSettings: (settings: PrintSettings) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

const DEFAULT_COLORS: PdfColorSettings = {
  primary: "#0A9688",
  primaryDark: "#00796B",
  accent: "#F57F17",
};

const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  enableOriginalDuplicate: false,
  showDeliveryTimeInLine: false,
  deliveryTimeUnit: "days",
};

export const useSettingsStore = create<SettingsState>((set) => ({
  company: null,
  banks: [],
  pdfColors: { ...DEFAULT_COLORS },
  printSettings: { ...DEFAULT_PRINT_SETTINGS },
  loading: true,
  setCompany: (company) => set({ company }),
  setBanks: (banks) => set({ banks }),
  setPdfColors: (pdfColors) => set({ pdfColors }),
  setPrintSettings: (printSettings) => set({ printSettings }),
  setLoading: (loading) => set({ loading }),
  reset: () => set({ company: null, banks: [], pdfColors: { ...DEFAULT_COLORS }, printSettings: { ...DEFAULT_PRINT_SETTINGS }, loading: false }),
}));
