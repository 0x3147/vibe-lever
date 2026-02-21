import { create } from "zustand";
import type { ToolId } from "@/types/tool";

interface ToolStore {
  currentTool: ToolId;
  setCurrentTool: (tool: ToolId) => void;
}

export const useToolStore = create<ToolStore>()((set) => ({
  currentTool: "claude-code",
  setCurrentTool: (tool) => set({ currentTool: tool }),
}));
