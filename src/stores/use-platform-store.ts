import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { PlatformInfo } from "@/types/tool";

interface PlatformStore {
  info: PlatformInfo | null;
  loading: boolean;
  loadPlatformInfo: () => Promise<void>;
}

export const usePlatformStore = create<PlatformStore>()((set) => ({
  info: null,
  loading: false,

  loadPlatformInfo: async () => {
    set({ loading: true });
    try {
      const info = await invoke<PlatformInfo>("get_platform_info");
      set({ info });
    } catch (e) {
      console.error("Failed to load platform info:", e);
    } finally {
      set({ loading: false });
    }
  },
}));
