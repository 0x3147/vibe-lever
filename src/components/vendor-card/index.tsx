import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Vendor } from "@/types/vendor";

interface Props {
  vendor: Vendor;
  onEdit: (vendor: Vendor) => void;
  onDelete: (id: number) => void;
  onActivate: (id: number) => void;
}

export function VendorCard({ vendor, onEdit, onDelete, onActivate }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between p-4 rounded-xl glass-card-hover group">
      <div className="flex items-center gap-4 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 mb-1">
            <span className="text-sm font-semibold truncate tracking-tight">{vendor.name}</span>
            {vendor.is_active && (
              <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 bg-primary/20 text-primary hover:bg-primary/30 border-none shrink-0 rounded-sm">
                {t("common.active")}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground/80 truncate font-mono">{vendor.base_url}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 ml-4 opacity-70 group-hover:opacity-100 transition-opacity">
        <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg" disabled={vendor.is_active} onClick={() => onActivate(vendor.id)}>
          {vendor.is_active ? t("common.active") : t("common.activate")}
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-accent hover:text-foreground transition-colors" onClick={() => onEdit(vendor)}>
          <FontAwesomeIcon icon={faPen} className="text-xs" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" onClick={() => onDelete(vendor.id)}>
          <FontAwesomeIcon icon={faTrash} className="text-xs" />
        </Button>
      </div>
    </div>
  );
}
