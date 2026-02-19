import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { Vendor, VendorInput } from "@/types/vendor";

interface VendorStore {
  vendors: Vendor[];
  loading: boolean;
  fetchVendors: (tool: string) => Promise<void>;
  addVendor: (tool: string, input: VendorInput) => Promise<void>;
  updateVendor: (id: number, input: VendorInput) => Promise<void>;
  deleteVendor: (id: number) => Promise<void>;
  activateVendor: (tool: string, id: number) => Promise<void>;
}

export const useVendorStore = create<VendorStore>()((set) => ({
  vendors: [],
  loading: false,

  fetchVendors: async (tool) => {
    set({ loading: true });
    try {
      const vendors = await invoke<Vendor[]>("get_vendors", { tool });
      set({ vendors });
    } finally {
      set({ loading: false });
    }
  },

  addVendor: async (tool, input) => {
    await invoke("add_vendor", { tool, vendor: input });
    const vendors = await invoke<Vendor[]>("get_vendors", { tool });
    set({ vendors });
  },

  updateVendor: async (id, input) => {
    const vendor = await invoke<Vendor>("update_vendor", { id, vendor: input });
    set((s) => ({ vendors: s.vendors.map((v) => (v.id === id ? vendor : v)) }));
  },

  deleteVendor: async (id) => {
    await invoke("delete_vendor", { id });
    set((s) => ({ vendors: s.vendors.filter((v) => v.id !== id) }));
  },

  activateVendor: async (tool, id) => {
    await invoke("activate_vendor", { tool, id });
    set((s) => ({
      vendors: s.vendors.map((v) => ({ ...v, is_active: v.id === id })),
    }));
  },
}));
