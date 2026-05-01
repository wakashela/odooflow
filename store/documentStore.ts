import { create } from "zustand";
import type { DocumentDetail, DocumentType } from "@/types/documents";

interface DocumentState {
  currentDocument: DocumentDetail | null;
  documentType: DocumentType | null;
  setCurrentDocument: (doc: DocumentDetail | null) => void;
  setDocumentType: (type: DocumentType | null) => void;
  reset: () => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  currentDocument: null,
  documentType: null,
  setCurrentDocument: (currentDocument) => set({ currentDocument }),
  setDocumentType: (documentType) => set({ documentType }),
  reset: () => set({ currentDocument: null, documentType: null }),
}));
