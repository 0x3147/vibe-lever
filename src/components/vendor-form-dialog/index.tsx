import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Vendor, VendorInput } from "@/types/vendor";
import { PRESETS, CLAUDE_CODE_EXCLUDED } from "./presets";
const EMPTY: VendorInput = { name: "", vendor_key: null, base_url: "", token: "", model: null, config_json: null };

interface Props {
  open: boolean;
  tool: string;
  editing: Vendor | null;
  onClose: () => void;
  onSubmit: (input: VendorInput) => Promise<void>;
}

export function VendorFormDialog({ open, tool, editing, onClose, onSubmit }: Props) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"preset" | "custom">("preset");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedUrl, setSelectedUrl] = useState<string>("");
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [tierModels, setTierModels] = useState<Record<string, string>>({});
  const [token, setToken] = useState("");
  const [custom, setCustom] = useState<VendorInput>(EMPTY);
  const [loading, setLoading] = useState(false);

  const presets = PRESETS.filter(p =>
    p.tools ? p.tools.includes(tool) : tool === "claude-code" && !CLAUDE_CODE_EXCLUDED.includes(p.vendor_key)
  );

  useEffect(() => {
    if (open) {
      if (editing) {
        setCustom({ name: editing.name, vendor_key: editing.vendor_key, base_url: editing.base_url, token: editing.token, model: editing.model, config_json: editing.config_json });
      } else {
        setTab(presets.length > 0 ? "preset" : "custom");
        setSelectedPreset(null);
        setSelectedModel("");
        setSelectedUrl("");
        setSelectedTier(null);
        setTierModels({});
        setToken("");
        setCustom(EMPTY);
      }
    }
  }, [editing, open]);

  const handleSelectPreset = (key: string) => {
    if (selectedPreset === key) {
        setSelectedPreset(null);
        setSelectedModel("");
        setSelectedTier(null);
        setTierModels({});
    } else {
      const p = PRESETS.find(p => p.vendor_key === key)!;
      setSelectedPreset(key);
      if (p.model_groups?.length) {
        const defaultGroup = p.model_groups[1] ?? p.model_groups[0];
        setSelectedTier(defaultGroup.value);
        setSelectedModel(defaultGroup.models[0]);
      } else {
        setSelectedTier(null);
        setSelectedModel(tool === "codex" && p.codex_model ? p.codex_model : p.model);
      }
      setSelectedUrl(tool === "codex" && p.codex_base_url ? p.codex_base_url : p.base_urls ? p.base_urls[0].value : "");
    }
  };

  const handleSubmit = async () => {
    let input: VendorInput;
    if (!editing && tab === "preset") {
      const p = PRESETS.find(p => p.vendor_key === selectedPreset);
      if (!p || !token) return;
      const config_json = p.model_groups
        ? JSON.stringify(Object.fromEntries(p.model_groups.map(g => [
            g.value === "haiku" ? "haikuModel" : g.value === "sonnet" ? "sonnetModel" : "opusModel",
            tierModels[g.value] ?? g.models[0]
          ])))
        : null;
      input = { name: p.name, vendor_key: p.vendor_key, base_url: selectedUrl || p.base_url, token, model: selectedModel || p.model, config_json };
    } else {
      if (!custom.name || !custom.base_url || !custom.token) return;
      input = custom;
    }
    setLoading(true);
    try { await onSubmit(input); onClose(); }
    finally { setLoading(false); }
  };

  const setC = (k: keyof VendorInput, v: string) => setCustom(f => ({ ...f, [k]: v || null }));

  const activePreset = PRESETS.find(p => p.vendor_key === selectedPreset);
  const activePromoUrl = activePreset?.base_urls?.find(u => u.value === selectedUrl)?.promo_url ?? activePreset?.promo_url;
  const isDisabled = loading || (
    !editing && tab === "preset" ? (!selectedPreset || !token) : (!custom.name || !custom.base_url || !custom.token)
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? t("vendors.edit") : t("vendors.add")}</DialogTitle>
        </DialogHeader>

        {!editing && presets.length > 0 && (
          <div className="flex gap-1 p-1 rounded-lg bg-muted/50 border border-border/50">
            {(["preset", "custom"] as const).map(t2 => (
              <button key={t2} type="button" onClick={() => setTab(t2)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${tab === t2 ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {t2 === "preset" ? t("vendors.preset") : t("vendors.custom")}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-4 py-1">
          {!editing && tab === "preset" ? (
            <>
              <div className="grid grid-cols-4 gap-2">
                {presets.map((p) => (
                  <button key={p.vendor_key} type="button" onClick={() => handleSelectPreset(p.vendor_key)}
                    className={`relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all duration-150 ${
                      selectedPreset === p.vendor_key ? "border-primary bg-primary/10 shadow-sm" : "border-border/60 hover:border-primary/50 hover:bg-accent/50"
                    }`}>
                    {p.hot && <span className="absolute -top-1.5 -right-1.5 px-1 py-0.5 text-[8px] font-bold leading-none rounded-full bg-orange-500 text-white">HOT</span>}
                    <img src={tool === "codex" && p.codex_logo ? p.codex_logo : p.logo} alt={p.name} className={`w-7 h-7 object-contain${p.dark_invert ? " dark:invert" : ""}`} />
                    <span className="text-[10px] text-center leading-tight text-muted-foreground">{p.name}</span>
                  </button>
                ))}
              </div>
              {activePreset && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{t("vendors.baseUrl")}</Label>
                    {tool === "codex" && activePreset.codex_base_url ? (
                      <Input className="h-8 text-xs text-muted-foreground bg-muted/30" value={activePreset.codex_base_url} readOnly />
                    ) : activePreset.base_urls ? (
                      <Select value={selectedUrl} onValueChange={setSelectedUrl}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {activePreset.base_urls.map(u => (
                            <SelectItem key={u.value} value={u.value}>
                              <span>{u.label}</span>
                              <span className="ml-2 text-muted-foreground text-[10px]">{u.value}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input className="h-8 text-xs text-muted-foreground bg-muted/30" value={activePreset.base_url} readOnly />
                    )}
                  </div>
                  {activePreset.model_groups ? (
                    <div className="space-y-1">
                      <Label className="text-xs">{t("common.model")}</Label>
                      <div className="flex gap-1">
                        {activePreset.model_groups.map(g => (
                          <button key={g.value} type="button"
                            onClick={() => { const m = tierModels[g.value] ?? g.models[0]; setSelectedTier(g.value); setSelectedModel(m); }}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                              selectedTier === g.value ? "bg-primary/10 border-primary text-primary" : "border-border/60 text-muted-foreground hover:border-primary/50"
                            }`}>
                            {g.label}
                          </button>
                        ))}
                      </div>
                      {selectedTier && (() => {
                        const grp = activePreset.model_groups!.find(g => g.value === selectedTier);
                        return grp && (
                          <Select value={selectedModel} onValueChange={m => { setSelectedModel(m); setTierModels(prev => ({ ...prev, [selectedTier!]: m })); }}>
                            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {grp.models.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        );
                      })()}
                    </div>
                  ) : (() => { const ms = tool === "codex" && activePreset.codex_models ? activePreset.codex_models : activePreset.models; return ms.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs">{t("common.model")}</Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ms.map(m => (
                          <SelectItem key={m} value={m}>{activePreset.modelLabels?.[m] ?? m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  ); })()}
                  <div className="space-y-1">
                    <Label className="text-xs">{t("common.token")} *</Label>
                    <Input className="h-8 text-sm" type="password" value={token} onChange={e => setToken(e.target.value)} autoFocus />
                  </div>
                  {activePreset.promo_links ? (
                    <div className="flex gap-2">
                      {activePreset.promo_links.map(l => (
                        <button key={l.url} type="button" onClick={() => openUrl(l.url)}
                          className="flex-1 flex items-center justify-between px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors group">
                          <span className="text-xs font-medium text-primary">{l.label}</span>
                          <span className="text-primary text-xs group-hover:translate-x-0.5 transition-transform">→</span>
                        </button>
                      ))}
                    </div>
                  ) : activePromoUrl && (
                    <button type="button" onClick={() => openUrl(activePromoUrl)}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors group w-full">
                      <span className="text-xs font-medium text-primary">即刻获取 {activePreset!.name} Coding 特惠套餐 🔥</span>
                      <span className="text-primary text-xs group-hover:translate-x-0.5 transition-transform">→</span>
                    </button>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              <div className="space-y-1">
                <Label className="text-xs">{t("common.name")} *</Label>
                <Input className="h-8 text-sm" value={custom.name} onChange={e => setCustom(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("vendors.baseUrl")} *</Label>
                <Input className="h-8 text-sm" value={custom.base_url} onChange={e => setC("base_url", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("common.token")} *</Label>
                <Input className="h-8 text-sm" type="password" value={custom.token} onChange={e => setC("token", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("common.model")}</Label>
                <Input className="h-8 text-sm" value={custom.model ?? ""} onChange={e => setC("model", e.target.value)} />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>{t("common.cancel")}</Button>
          <Button size="sm" onClick={handleSubmit} disabled={isDisabled}>{t("common.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
