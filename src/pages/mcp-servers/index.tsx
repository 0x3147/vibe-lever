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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">{t("mcp.title")}</h2>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <FontAwesomeIcon icon={faPlus} className="mr-1.5 text-xs" />
          {t("mcp.add")}
        </Button>
      </div>
      {servers.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("mcp.noServers")}</p>
      ) : (
        <div className="space-y-2">
          {servers.map((s) => <McpServerCard key={s.name} server={s} onDelete={handleDelete} />)}
        </div>
      )}
      <McpFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSubmit={handleAdd} />
    </div>
  );
}
