import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";

export function ClaudeMdPage() {
  const { t } = useTranslation();
  const [content, setContent] = useState("");
  const [saved, setSaved] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    invoke<string | null>("get_claude_md", { path: null })
      .then((v) => setContent(v ?? ""))
      .catch(console.error);
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await invoke("save_claude_md", { path: null, content });
      setSaved(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">{t("docs.title")}</h2>
          <p className="text-xs text-muted-foreground">{t("docs.globalFile")}</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="text-xs text-muted-foreground">{t("docs.saved")}</span>}
          <Button size="sm" onClick={handleSave} disabled={loading || saved}>
            {t("docs.save")}
          </Button>
        </div>
      </div>
      <textarea
        className="flex-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-1 focus:ring-ring min-h-[400px]"
        value={content}
        onChange={(e) => { setContent(e.target.value); setSaved(false); }}
        placeholder={t("docs.notFound")}
      />
    </div>
  );
}
