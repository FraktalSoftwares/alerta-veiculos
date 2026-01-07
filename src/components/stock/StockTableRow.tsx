import { StockBadge } from "./StockBadge";
import { EquipmentDisplay } from "@/types/equipment";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { RequirePermission } from "@/components/auth/PermissionGate";
import { PERMISSIONS } from "@/hooks/useUserPermissions";

interface StockTableRowProps {
  equipment: EquipmentDisplay;
  onClick?: (equipment: EquipmentDisplay) => void;
  onEdit?: (equipment: EquipmentDisplay) => void;
  onDelete?: (equipment: EquipmentDisplay) => void;
}

const statusLabels = {
  funcionando: "FUNCIONANDO",
  manutencao: "MANUTENÇÃO",
  inativo: "INATIVO",
  defeito: "DEFEITO",
  na_loja: "NA LOJA",
};

export function StockTableRow({ equipment, onClick, onEdit, onDelete }: StockTableRowProps) {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(equipment);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(equipment);
  };

  return (
    <div
      onClick={() => onClick?.(equipment)}
      className="grid grid-cols-[1fr_120px_160px_100px_120px_140px_100px] gap-4 px-6 py-5 text-sm border-b border-border hover:bg-table-row-hover cursor-pointer transition-colors"
    >
      <div className="text-foreground font-medium truncate">{equipment.name}</div>
      <div className="text-muted-foreground">{equipment.model}</div>
      <div className="text-foreground">{equipment.imei}</div>
      <div className="text-foreground">{equipment.line}</div>
      <div className="text-foreground">{equipment.modality}</div>
      <div>
        <StockBadge variant={equipment.status}>
          {statusLabels[equipment.status]}
        </StockBadge>
      </div>
      <div className="flex items-center justify-end gap-1">
        <RequirePermission code={PERMISSIONS.STOCK_EDIT}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleEdit}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </RequirePermission>
        <RequirePermission code={PERMISSIONS.STOCK_DELETE}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </RequirePermission>
      </div>
    </div>
  );
}

// Re-export for backwards compatibility
export type { EquipmentDisplay as Equipment };
