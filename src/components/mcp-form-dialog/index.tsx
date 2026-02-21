import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { McpServerInput } from "@/types/mcp";

const EMPTY: McpServerInput = { name: "", server_type: "stdio", command: null, args: null, url: null, env: null, headers: null };

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: McpServerInput) => Promise<void>;
}

export function McpFormDialog({ open, onClose, onSubmit }: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState<McpServerInput>(EMPTY);
  const [loading, setLoading] = useState(false);

  const handleClose = () => { setForm(EMPTY); onClose(); };

  const handleSubmit = async () => {
    if (!form.name) return;
    setLoading(true);
    try { await onSubmit(form); handleClose(); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("mcp.add")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label className="text-xs">{t("common.name")} *</Label>
            <Input className="h-8 text-sm" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t("mcp.serverType")}</Label>
            <Select value={form.server_type} onValueChange={(v) => setForm((f) => ({ ...f, server_type: v }))}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="stdio">stdio</SelectItem>
                <SelectItem value="http">http</SelectItem>
                <SelectItem value="sse">sse</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.server_type === "stdio" ? (
            <>
              <div className="space-y-1">
                <Label className="text-xs">{t("mcp.command")}</Label>
                <Input className="h-8 text-sm" value={form.command ?? ""} onChange={(e) => setForm((f) => ({ ...f, command: e.target.value || null }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("mcp.args")}</Label>
                <Input className="h-8 text-sm" placeholder="arg1 arg2 ..." onChange={(e) => setForm((f) => ({ ...f, args: e.target.value ? e.target.value.split(" ") : null }))} />
              </div>
            </>
          ) : (
            <div className="space-y-1">
              <Label className="text-xs">URL</Label>
              <Input className="h-8 text-sm" value={form.url ?? ""} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value || null }))} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={handleClose}>{t("common.cancel")}</Button>
          <Button size="sm" onClick={handleSubmit} disabled={loading || !form.name}>{t("common.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
