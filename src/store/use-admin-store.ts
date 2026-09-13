import { create } from "zustand";

interface AdminState {
  activeSection: string;
  setActiveSection: (activeSection: string) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  activeSection: "Overview",
  setActiveSection: (activeSection) => set({ activeSection }),
}));
