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
    <div className={`flex flex-col shrink-0 m-2 rounded-xl shadow-xl bg-sidebar backdrop-blur-md border border-border overflow-hidden transition-[width] duration-200 ${collapsed ? "w-14" : "w-56"}`}>
      {/* Tool selector */}
      {!collapsed && (
        <div className="p-3">
          <Select value={currentTool} onValueChange={handleToolChange}>
            <SelectTrigger className="w-full h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="claude-code">Claude Code</SelectItem>
              <SelectItem value="codex">Codex</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {!collapsed && <Separator />}

      {/* Menu items */}
      <nav className="flex-1 p-2 space-y-0.5">
        {menus.map((item) => {
          const isActive = currentPath === item.path || currentPath.startsWith(item.path + "/");
          return (
            <Link
              key={item.key}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              to={item.path as any}
              className={`flex items-center py-2 rounded-md text-sm transition-colors ${collapsed ? "justify-center px-0" : "gap-2.5 px-3"} ${
                isActive
                  ? "bg-primary/15 text-primary font-medium"
                  : "text-muted-foreground hover:bg-primary/8 hover:text-foreground"
              }`}
            >
              <FontAwesomeIcon icon={item.icon} className="w-3.5 h-3.5 shrink-0" />
              {!collapsed && t(item.label)}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* Bottom actions */}
      <div className="p-2 space-y-0.5">
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          to={"/settings" as any}
          className={`flex items-center py-2 rounded-md text-sm transition-colors ${collapsed ? "justify-center px-0" : "gap-2.5 px-3"} ${
            currentPath === "/settings"
              ? "bg-primary/15 text-primary font-medium"
              : "text-muted-foreground hover:bg-primary/8 hover:text-foreground"
          }`}
        >
          <FontAwesomeIcon icon={faCog} className="w-3.5 h-3.5 shrink-0" />
          {!collapsed && t("sidebar.settings")}
        </Link>
        {!collapsed && (
          <button
            onClick={toggleLanguage}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
          >
            {language === "zh" ? "EN" : "中文"}
          </button>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center py-1.5 rounded-md text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
          aria-label={collapsed ? "展开" : "收起"}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            {collapsed ? (
              <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            )}
          </svg>
        </button>
      </div>
    </div>
  );
}
