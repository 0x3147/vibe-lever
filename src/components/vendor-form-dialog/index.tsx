import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Vendor, VendorInput, PresetVendor } from "@/types/vendor";

const PRESETS: PresetVendor[] = [
  { name: "智谱 AI", vendor_key: "zhipu", base_url: "https://open.bigmodel.cn/api/paas/v4/", model: "glm-4" },
  { name: "月之暗面", vendor_key: "moonshot", base_url: "https://api.moonshot.cn/v1/", model: "moonshot-v1-8k" },
  { name: "DeepSeek", vendor_key: "deepseek", base_url: "https://api.deepseek.com/v1/", model: "deepseek-chat" },
  { name: "阿里云百炼", vendor_key: "aliyun", base_url: "https://dashscope.aliyuncs.com/compatible-mode/v1/", model: "qwen-plus" },
  { name: "OpenAI", vendor_key: "openai", base_url: "https://api.openai.com/v1/", model: "gpt-4o" },
];

const EMPTY: VendorInput = { name: "", vendor_key: null, base_url: "", token: "", model: null, config_json: null };

interface Props {
  open: boolean;
  editing: Vendor | null;
  onClose: () => void;
  onSubmit: (input: VendorInput) => Promise<void>;
}

export function VendorFormDialog({ open, editing, onClose, onSubmit }: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState<VendorInput>(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({ name: editing.name, vendor_key: editing.vendor_key, base_url: editing.base_url, token: editing.token, model: editing.model, config_json: editing.config_json });
    } else {
      setForm(EMPTY);
    }
  }, [editing, open]);

  const applyPreset = (key: string) => {
    const p = PRESETS.find((p) => p.vendor_key === key);
    if (p) setForm((f) => ({ ...f, name: p.name, vendor_key: p.vendor_key, base_url: p.base_url, model: p.model }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.base_url || !form.token) return;
    setLoading(true);
    try {
      await onSubmit(form);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const set = (k: keyof VendorInput, v: string) => setForm((f) => ({ ...f, [k]: v || null }));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? t("vendors.edit") : t("vendors.add")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {!editing && (
            <div className="space-y-1">
              <Label className="text-xs">{t("vendors.preset")}</Label>
              <Select onValueChange={applyPreset}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder={t("vendors.custom")} />
                </SelectTrigger>
                <SelectContent>
                  {PRESETS.map((p) => (
                    <SelectItem key={p.vendor_key} value={p.vendor_key}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs">{t("common.name")} *</Label>
            <Input className="h-8 text-sm" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t("vendors.baseUrl")} *</Label>
            <Input className="h-8 text-sm" value={form.base_url} onChange={(e) => set("base_url", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t("common.token")} *</Label>
            <Input className="h-8 text-sm" type="password" value={form.token} onChange={(e) => set("token", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t("common.model")}</Label>
            <Input className="h-8 text-sm" value={form.model ?? ""} onChange={(e) => set("model", e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>{t("common.cancel")}</Button>
          <Button size="sm" onClick={handleSubmit} disabled={loading || !form.name || !form.base_url || !form.token}>
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
