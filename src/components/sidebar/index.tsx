import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStore,
  faWrench,
  faServer,
  faFileAlt,
  faCog,
} from "@fortawesome/free-solid-svg-icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToolStore } from "@/stores/use-tool-store";
import { useSettingsStore } from "@/stores/use-settings-store";
import type { ToolId } from "@/types/tool";

interface MenuItem {
  key: string;
  label: string;
  icon: typeof faStore;
  path: string;
}

const TOOL_MENUS: Record<ToolId, MenuItem[]> = {
  "claude-code": [
    { key: "vendors", label: "sidebar.vendors", icon: faStore, path: "/claude-code/vendors" },
    { key: "tools", label: "sidebar.tools", icon: faWrench, path: "/claude-code/tools" },
    { key: "mcp", label: "sidebar.mcp", icon: faServer, path: "/claude-code/mcp" },
    { key: "docs", label: "sidebar.docs", icon: faFileAlt, path: "/claude-code/docs" },
  ],
  codex: [
    { key: "vendors", label: "sidebar.vendors", icon: faStore, path: "/codex/vendors" },
    { key: "tools", label: "sidebar.tools", icon: faWrench, path: "/codex/tools" },
  ],
};

export function Sidebar() {
  const { t } = useTranslation();
  const { currentTool, setCurrentTool } = useToolStore();
  const { setLanguage, language } = useSettingsStore();
  const routerState = useRouterState();
  const navigate = useNavigate();
  const currentPath = routerState.location.pathname;
  const [collapsed, setCollapsed] = useState(false);

  const menus = TOOL_MENUS[currentTool];

  const handleToolChange = (tool: string) => {
    const id = tool as ToolId;
    setCurrentTool(id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    navigate({ to: TOOL_MENUS[id][0].path as any });
  };

  const toggleLanguage = () => {
    setLanguage(language === "zh" ? "en" : "zh");
  };

  return (
    <div className={`flex flex-col shrink-0 m-3 rounded-2xl shadow-sm bg-sidebar/80 backdrop-blur-xl border border-border/60 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${collapsed ? "w-16" : "w-64"}`}>
      {/* Tool selector */}
      <div className={`p-4 transition-all duration-300 ${collapsed ? "opacity-0 h-0 p-0 overflow-hidden" : "opacity-100"}`}>
        <Select value={currentTool} onValueChange={handleToolChange}>
          <SelectTrigger className="w-full h-9 text-sm shadow-none focus:ring-0 focus:ring-offset-0 border-border/50 bg-background/50 hover:bg-background/80 transition-colors">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="shadow-lg border-border/50 backdrop-blur-xl bg-popover/90">
            <SelectItem value="claude-code" className="cursor-pointer">Claude Code</SelectItem>
            <SelectItem value="codex" className="cursor-pointer">Codex</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!collapsed && <Separator className="opacity-50 mx-4 w-auto" />}

      {/* Menu items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto no-scrollbar">
        {menus.map((item) => {
          const isActive = currentPath === item.path || currentPath.startsWith(item.path + "/");
          return (
            <Link
              key={item.key}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              to={item.path as any}
              className={`flex items-center py-2.5 rounded-xl text-sm transition-all duration-200 cursor-pointer ${collapsed ? "justify-center px-0 h-10 w-10 mx-auto" : "gap-3 px-3"} ${
                isActive
                  ? "bg-primary/5 text-foreground font-medium shadow-[inset_2px_0_0_0_var(--color-primary)] dark:shadow-[inset_2px_0_0_0_#FAFAFA] bg-gradient-to-r from-primary/10 to-transparent"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`}
            >
              <FontAwesomeIcon icon={item.icon} className={`shrink-0 transition-transform duration-200 ${isActive ? "scale-110" : ""} ${collapsed ? "w-4 h-4" : "w-4 h-4"}`} />
              {!collapsed && <span className="truncate">{t(item.label)}</span>}
            </Link>
          );
        })}
      </nav>

      <Separator className="opacity-50 mx-2 w-auto" />

      {/* Bottom actions */}
      <div className="p-3 space-y-1">
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          to={"/settings" as any}
          className={`group flex items-center py-2.5 rounded-xl text-sm transition-all duration-200 cursor-pointer ${collapsed ? "justify-center px-0 h-10 w-10 mx-auto" : "gap-3 px-3"} ${
            currentPath === "/settings"
              ? "bg-primary/5 text-foreground font-medium shadow-[inset_2px_0_0_0_var(--color-primary)] bg-gradient-to-r from-primary/10 to-transparent"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
          }`}
        >
          <FontAwesomeIcon icon={faCog} className={`shrink-0 transition-transform duration-300 group-hover:rotate-45 ${currentPath === "/settings" ? "scale-110" : ""} ${collapsed ? "w-4 h-4" : "w-4 h-4"}`} />
          {!collapsed && <span>{t("sidebar.settings")}</span>}
        </Link>
        
        {!collapsed && (
          <button
            onClick={toggleLanguage}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-all duration-200 cursor-pointer"
          >
            <span className="flex items-center justify-center w-4 h-4 rounded-sm bg-muted/50 border border-border/50">
              {language === "zh" ? "文" : "A"}
            </span>
            {language === "zh" ? "English" : "简体中文"}
          </button>
        )}
        
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`w-full flex items-center justify-center py-2.5 rounded-xl text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-all duration-200 cursor-pointer ${collapsed ? "h-10 w-10 mx-auto" : "mt-2"}`}
          aria-label={collapsed ? "展开" : "收起"}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}>
            <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

