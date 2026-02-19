import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrash, faBolt } from "@fortawesome/free-solid-svg-icons";
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
    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/20 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{vendor.name}</span>
            {vendor.is_active && (
              <Badge variant="default" className="text-xs shrink-0">{t("common.active")}</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{vendor.base_url}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 ml-2">
        {!vendor.is_active && (
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onActivate(vendor.id)}>
            <FontAwesomeIcon icon={faBolt} className="text-xs" />
          </Button>
        )}
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onEdit(vendor)}>
          <FontAwesomeIcon icon={faPen} className="text-xs" />
        </Button>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => onDelete(vendor.id)}>
          <FontAwesomeIcon icon={faTrash} className="text-xs" />
        </Button>
      </div>
    </div>
  );
}
