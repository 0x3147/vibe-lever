import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Vendor, VendorInput, PresetVendor } from "@/types/vendor";

import zhipuLogo from "@/assets/images/zai.svg";
import moonshotLogo from "@/assets/images/moonshot.svg";
import deepseekLogo from "@/assets/images/deepseek-color.svg";
import qwenLogo from "@/assets/images/qwen-color.svg";
import openaiLogo from "@/assets/images/openai-logo.svg";
import doubaoLogo from "@/assets/images/doubao-color.svg";
import minimaxLogo from "@/assets/images/minimax-color.svg";
import geminiLogo from "@/assets/images/gemini-color.svg";
import volcengineLogo from "@/assets/images/volcengine-color.svg";

const PRESETS: (PresetVendor & { logo: string; models: string[]; modelLabels?: Record<string, string>; base_urls?: { label: string; value: string }[] })[] = [
  { name: "GLM",       vendor_key: "zhipu",      base_url: "https://open.bigmodel.cn/api/anthropic",                   model: "glm-5",               logo: zhipuLogo,      models: ["glm-5", "glm-4.7"], base_urls: [{ label: "国内站", value: "https://open.bigmodel.cn/api/anthropic" }, { label: "国际站", value: "https://api.z.ai/api/anthropic" }] },
  { name: "KIMI",      vendor_key: "moonshot",   base_url: "https://api.moonshot.cn/v1/",                              model: "moonshot-v1-8k",       logo: moonshotLogo,   models: ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"] },
  { name: "DeepSeek",  vendor_key: "deepseek",   base_url: "https://api.deepseek.com/v1/",                             model: "deepseek-chat",        logo: deepseekLogo,   models: ["deepseek-chat", "deepseek-reasoner"] },
  { name: "阿里云百炼", vendor_key: "aliyun",     base_url: "https://dashscope.aliyuncs.com/compatible-mode/v1/",       model: "qwen-plus",            logo: qwenLogo,       models: ["qwen-plus", "qwen-max", "qwen-turbo", "qwen-long"] },
  { name: "OpenAI",    vendor_key: "openai",     base_url: "https://api.openai.com/v1/",                               model: "gpt-4o",               logo: openaiLogo,     models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "o1", "o3-mini"] },
  { name: "豆包",      vendor_key: "doubao",     base_url: "https://ark.cn-beijing.volces.com/api/v3/chat/completions", model: "doubao-seed-2-0-pro-260215", logo: doubaoLogo, models: ["doubao-seed-2-0-pro-260215", "doubao-seed-2-0-lite-260215", "doubao-seed-2-0-mini-260215", "doubao-seed-code-preview-latest"], modelLabels: { "doubao-seed-2-0-pro-260215": "Doubao-Seed-2.0-pro", "doubao-seed-2-0-lite-260215": "Doubao-Seed-2.0-lite", "doubao-seed-2-0-mini-260215": "Doubao-Seed-2.0-mini", "doubao-seed-code-preview-latest": "Doubao-Seed-2.0-Code" } },
  { name: "MiniMax",   vendor_key: "minimax",    base_url: "https://api.minimaxi.com/v1/",                             model: "MiniMax-M2",           logo: minimaxLogo,    models: ["MiniMax-M2", "MiniMax-Text-01"] },
  { name: "Gemini",    vendor_key: "gemini",     base_url: "https://generativelanguage.googleapis.com/v1beta/openai/", model: "gemini-2.0-flash",     logo: geminiLogo,     models: ["gemini-2.0-flash", "gemini-2.0-pro", "gemini-1.5-pro", "gemini-1.5-flash"] },
  { name: "火山方舟",  vendor_key: "volcengine", base_url: "https://ark.cn-beijing.volces.com/api/coding",             model: "doubao-seed-2.0-code", logo: volcengineLogo, models: ["doubao-seed-2.0-code", "doubao-seed-code", "glm-4.7", "deepseek-v3.2", "kimi-k2-thinking", "kimi-k2.5"] },
];

const CLAUDE_CODE_EXCLUDED = ["openai", "gemini"];
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
  const [token, setToken] = useState("");
  const [custom, setCustom] = useState<VendorInput>(EMPTY);
  const [loading, setLoading] = useState(false);

  const presets = tool === "claude-code"
    ? PRESETS.filter(p => !CLAUDE_CODE_EXCLUDED.includes(p.vendor_key))
    : PRESETS;

  useEffect(() => {
    if (open) {
      if (editing) {
        setCustom({ name: editing.name, vendor_key: editing.vendor_key, base_url: editing.base_url, token: editing.token, model: editing.model, config_json: editing.config_json });
      } else {
        setTab("preset");
        setSelectedPreset(null);
        setSelectedModel("");
        setSelectedUrl("");
        setToken("");
        setCustom(EMPTY);
      }
    }
  }, [editing, open]);

  const handleSelectPreset = (key: string) => {
    if (selectedPreset === key) {
      setSelectedPreset(null);
      setSelectedModel("");
    } else {
      const p = PRESETS.find(p => p.vendor_key === key)!;
      setSelectedPreset(key);
      setSelectedModel(p.model);
      setSelectedUrl(p.base_urls ? p.base_urls[0].value : "");
    }
  };

  const handleSubmit = async () => {
    let input: VendorInput;
    if (!editing && tab === "preset") {
      const p = PRESETS.find(p => p.vendor_key === selectedPreset);
      if (!p || !token) return;
      input = { name: p.name, vendor_key: p.vendor_key, base_url: selectedUrl || p.base_url, token, model: selectedModel || p.model, config_json: null };
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
  const isDisabled = loading || (
    !editing && tab === "preset" ? (!selectedPreset || !token) : (!custom.name || !custom.base_url || !custom.token)
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? t("vendors.edit") : t("vendors.add")}</DialogTitle>
        </DialogHeader>

        {!editing && (
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
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all duration-150 ${
                      selectedPreset === p.vendor_key ? "border-primary bg-primary/10 shadow-sm" : "border-border/60 hover:border-primary/50 hover:bg-accent/50"
                    }`}>
                    <img src={p.logo} alt={p.name} className="w-7 h-7 object-contain" />
                    <span className="text-[10px] text-center leading-tight text-muted-foreground">{p.name}</span>
                  </button>
                ))}
              </div>
              {activePreset && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{t("vendors.baseUrl")}</Label>
                    {activePreset.base_urls ? (
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
                  <div className="space-y-1">
                    <Label className="text-xs">{t("common.model")}</Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {activePreset.models.map(m => (
                          <SelectItem key={m} value={m}>{activePreset.modelLabels?.[m] ?? m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("common.token")} *</Label>
                    <Input className="h-8 text-sm" type="password" value={token} onChange={e => setToken(e.target.value)} autoFocus />
                  </div>
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
