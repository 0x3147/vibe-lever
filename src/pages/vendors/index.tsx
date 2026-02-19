import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
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

  const handleEdit = (vendor: Vendor) => {
    setEditing(vendor);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">{t("vendors.title")}</h2>
        <Button size="sm" onClick={handleAdd}>
          <FontAwesomeIcon icon={faPlus} className="mr-1.5 text-xs" />
          {t("vendors.add")}
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : vendors.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("vendors.noVendors")}</p>
      ) : (
        <div className="space-y-2">
          {vendors.map((v) => (
            <VendorCard
              key={v.id}
              vendor={v}
              onEdit={handleEdit}
              onDelete={(id) => deleteVendor(id)}
              onActivate={(id) => activateVendor(tool, id)}
            />
          ))}
        </div>
      )}

      <VendorFormDialog
        open={dialogOpen}
        editing={editing}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
