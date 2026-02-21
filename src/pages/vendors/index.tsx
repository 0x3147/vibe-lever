import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VendorCard } from "@/components/vendor-card";
import { VendorFormDialog } from "@/components/vendor-form-dialog";
import { useVendorStore } from "@/stores/use-vendor-store";
import type { Vendor, VendorInput } from "@/types/vendor";
import type { ToolId } from "@/types/tool";

interface Props {
  tool: ToolId;
}

export function VendorsPage({ tool }: Props) {
  const { t } = useTranslation();
  const { vendors, loading, fetchVendors, addVendor, updateVendor, deleteVendor, activateVendor } = useVendorStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [pendingActivateId, setPendingActivateId] = useState<number | null>(null);

  useEffect(() => {
    fetchVendors(tool);
  }, [tool]);

  const handleSubmit = async (input: VendorInput) => {
    if (editing) {
      await updateVendor(editing.id, input);
    } else {
      await addVendor(tool, input);
    }
  };

  const handleActivate = async (id: number) => {
    const running = await invoke<boolean>("check_tool_running", { tool });
    if (running) {
      setPendingActivateId(id);
    } else {
      await activateVendor(tool, id);
    }
  };

  const handleConfirmKill = async () => {
    if (pendingActivateId === null) return;
    await invoke("kill_tool_process", { tool });
    await activateVendor(tool, pendingActivateId);
    setPendingActivateId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out fill-mode-both">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">{t("vendors.title")}</h2>
        <Button size="sm" onClick={() => { setEditing(null); setDialogOpen(true); }} className="rounded-full px-4 font-medium transition-transform hover:scale-105 active:scale-95">
          <FontAwesomeIcon icon={faPlus} className="mr-2 text-xs" />
          {t("vendors.add")}
        </Button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-muted/50 rounded-xl"></div>
          <div className="h-20 bg-muted/50 rounded-xl w-4/5"></div>
        </div>
      ) : vendors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in-95 duration-500 delay-100 fill-mode-both">
          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
            <FontAwesomeIcon icon={faPlus} className="text-muted-foreground/50 text-xl" />
          </div>
          <p className="text-sm text-muted-foreground">{t("vendors.noVendors")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vendors.map((v, index) => (
            <div
              key={v.id}
              className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
              style={{ animationDuration: '500ms', animationDelay: `${75 * index}ms` }}
            >
              <VendorCard
                vendor={v}
                onEdit={(vendor) => { setEditing(vendor); setDialogOpen(true); }}
                onDelete={(id) => deleteVendor(id)}
                onActivate={handleActivate}
              />
            </div>
          ))}
        </div>
      )}

      <VendorFormDialog
        open={dialogOpen}
        tool={tool}
        editing={editing}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />

      <Dialog open={pendingActivateId !== null} onOpenChange={(o) => !o && setPendingActivateId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("common.confirm")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t("vendors.processRunning")}</p>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPendingActivateId(null)}>{t("common.cancel")}</Button>
            <Button size="sm" onClick={handleConfirmKill}>{t("common.confirm")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
