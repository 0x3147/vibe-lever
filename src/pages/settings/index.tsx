import { useTranslation } from "react-i18next";
import { useSettingsStore } from "@/stores/use-settings-store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function SettingsPage() {
  const { t } = useTranslation();
  const { theme, language, setTheme, setLanguage } = useSettingsStore();

  return (
    <div className="space-y-6 max-w-sm">
      <h2 className="text-base font-semibold">{t("settings.title")}</h2>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">{t("settings.theme")}</Label>
          <Select value={theme} onValueChange={(v) => setTheme(v as typeof theme)}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="light">{t("settings.themeLight")}</SelectItem>
              <SelectItem value="dark">{t("settings.themeDark")}</SelectItem>
              <SelectItem value="system">{t("settings.themeSystem")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">{t("settings.language")}</Label>
          <Select value={language} onValueChange={(v) => setLanguage(v as typeof language)}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="zh">中文</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div className="space-y-1">
        <p className="text-xs font-medium">{t("settings.about")}</p>
        <p className="text-xs text-muted-foreground">{t("settings.version")}: 0.0.1</p>
      </div>
    </div>
  );
}
