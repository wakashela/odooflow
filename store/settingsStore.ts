import { create } from "zustand";
import type { CompanySettings, BankDetail, PdfColorSettings } from "@/types/settings";

interface SettingsState {
  company: CompanySettings | null;
  banks: BankDetail[];
  pdfColors: PdfColorSettings;
  loading: boolean;
  setCompany: (company: CompanySettings | null) => void;
  setBanks: (banks: BankDetail[]) => void;
  setPdfColors: (colors: PdfColorSettings) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

const DEFAULT_COLORS: PdfColorSettings = {
  primary: "#0A9688",
  primaryDark: "#00796B",
  accent: "#F57F17",
};

export const useSettingsStore = create<SettingsState>((set) => ({
  company: null,
  banks: [],
  pdfColors: { ...DEFAULT_COLORS },
  loading: true,
  setCompany: (company) => set({ company }),
  setBanks: (banks) => set({ banks }),
  setPdfColors: (pdfColors) => set({ pdfColors }),
  setLoading: (loading) => set({ loading }),
  reset: () => set({ company: null, banks: [], pdfColors: { ...DEFAULT_COLORS }, loading: false }),
}));
