import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import { McpServerCard } from "@/components/mcp-server-card";
import { McpFormDialog } from "@/components/mcp-form-dialog";
import type { McpServer, McpServerInput } from "@/types/mcp";

export function McpServersPage() {
  const { t } = useTranslation();
  const [servers, setServers] = useState<McpServer[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const refresh = async () => {
    try { setServers(await invoke<McpServer[]>("get_mcp_servers")); }
    catch (e) { console.error(e); }
  };

  useEffect(() => { refresh(); }, []);

  const handleAdd = async (input: McpServerInput) => {
    await invoke("add_mcp_server", { server: input });
    await refresh();
  };

  const handleDelete = async (name: string) => {
    await invoke("delete_mcp_server", { name });
    setServers((s) => s.filter((x) => x.name !== name));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out fill-mode-both">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">{t("mcp.title")}</h2>
        <Button size="sm" onClick={() => setDialogOpen(true)} className="rounded-full px-4 font-medium transition-transform hover:scale-105 active:scale-95">
          <FontAwesomeIcon icon={faPlus} className="mr-2 text-xs" />
          {t("mcp.add")}
        </Button>
      </div>
      {servers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in-95 duration-500 delay-100 fill-mode-both">
          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
            <FontAwesomeIcon icon={faPlus} className="text-muted-foreground/50 text-xl" />
          </div>
          <p className="text-sm text-muted-foreground">{t("mcp.noServers")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {servers.map((s, index) => (
            <div 
              key={s.name}
              className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
              style={{ animationDuration: '500ms', animationDelay: `${75 * index}ms` }}
            >
              <McpServerCard server={s} onDelete={handleDelete} />
            </div>
          ))}
        </div>
      )}
      <McpFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSubmit={handleAdd} />
    </div>
  );
}
