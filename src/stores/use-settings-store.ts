import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { persist } from "zustand/middleware";
import i18n from "@/lib/i18n";
import type { AppSettings } from "@/types/settings";

interface SettingsStore {
  theme: AppSettings["theme"];
  language: AppSettings["language"];
  lastTool: string;
  setTheme: (theme: AppSettings["theme"]) => Promise<void>;
  setLanguage: (language: AppSettings["language"]) => Promise<void>;
  setLastTool: (tool: string) => Promise<void>;
  loadSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: "light",
      language: "zh",
      lastTool: "claude-code",

      loadSettings: async () => {
        try {
          const settings = await invoke<AppSettings>("get_settings");
          set({
            theme: settings.theme as AppSettings["theme"],
            language: settings.language as AppSettings["language"],
            lastTool: settings.last_tool,
          });
          i18n.changeLanguage(settings.language);
          applyTheme(settings.theme);
        } catch (e) {
          console.error("Failed to load settings:", e);
        }
      },

      setTheme: async (theme) => {
        set({ theme });
        applyTheme(theme);
        await invoke("update_setting", { key: "theme", value: theme }).catch(console.error);
      },

      setLanguage: async (language) => {
        set({ language });
        i18n.changeLanguage(language);
        await invoke("update_setting", { key: "language", value: language }).catch(console.error);
      },

      setLastTool: async (tool) => {
        set({ lastTool: tool });
        await invoke("update_setting", { key: "last_tool", value: tool }).catch(console.error);
      },
    }),
    {
      name: "vibe-lever-settings",
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        lastTool: state.lastTool,
      }),
    }
  )
);

function applyTheme(theme: AppSettings["theme"]) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "light") {
    root.classList.remove("dark");
  } else {
    // system
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", prefersDark);
  }
}
