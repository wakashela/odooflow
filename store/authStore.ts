import { create } from "zustand";
import type { OdooSessionInfo } from "@/types/odoo";

interface AuthState {
  session: OdooSessionInfo | null;
  loading: boolean;
  setSession: (session: OdooSessionInfo | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  loading: true,
  setSession: (session) => set({ session, loading: false }),
  setLoading: (loading) => set({ loading }),
  reset: () => set({ session: null, loading: false }),
}));
