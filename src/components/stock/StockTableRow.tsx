import { StockBadge } from "./StockBadge";
import { EquipmentDisplay } from "@/types/equipment";
import { Button } from "@/components/ui/button";
import { Info, MapPin, Pencil, Trash2 } from "lucide-react";
import { RequirePermission } from "@/components/auth/PermissionGate";
import { PERMISSIONS } from "@/hooks/useUserPermissions";
import { useAuth } from "@/contexts/AuthContext";

interface StockTableRowProps {
  equipment: EquipmentDisplay;
  onClick?: (equipment: EquipmentDisplay) => void;
  onEdit?: (equipment: EquipmentDisplay) => void;
  onDelete?: (equipment: EquipmentDisplay) => void;
  onViewMap?: (equipment: EquipmentDisplay) => void;
  onViewDetails?: (equipment: EquipmentDisplay) => void;
}

const statusLabels = {
  funcionando: "FUNCIONANDO",
  manutencao: "MANUTENÇÃO",
  inativo: "INATIVO",
  defeito: "DEFEITO",
  na_loja: "NA LOJA",
};

export function StockTableRow({ equipment, onClick, onEdit, onDelete, onViewMap, onViewDetails }: StockTableRowProps) {
  const { profile } = useAuth();
  const isAdmin = profile?.user_type === 'admin';
  const hasLocation = !!equipment.imei && equipment.imei !== '-';

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(equipment);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(equipment);
  };

  const handleViewMap = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewMap?.(equipment);
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewDetails?.(equipment);
  };

  return (
    <div
      onClick={() => onClick?.(equipment)}
      className={`grid ${isAdmin ? 'grid-cols-[1fr_150px_120px_160px_100px_120px_140px_180px]' : 'grid-cols-[1fr_120px_160px_100px_120px_140px_180px]'} gap-4 px-6 py-5 text-sm border-b border-border hover:bg-table-row-hover cursor-pointer transition-colors`}
    >
      <div className="text-foreground font-medium truncate">{equipment.name}</div>
      {isAdmin && (
        <div className="truncate">
          {equipment.ownerName && equipment.ownerName !== profile?.full_name ? (
            <>
              <div className="text-foreground text-sm truncate">{equipment.ownerName}</div>
              <div className="text-muted-foreground text-xs truncate">{equipment.ownerEmail || ''}</div>
            </>
          ) : (
            <div className="text-muted-foreground text-sm">Sem vínculo</div>
          )}
        </div>
      )}
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
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={handleViewDetails}
          title="Ver detalhes completos"
        >
          <Info className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-40"
          onClick={handleViewMap}
          disabled={!hasLocation}
          title={hasLocation ? "Ver localização no mapa" : "IMEI não configurado"}
        >
          <MapPin className="h-4 w-4" />
        </Button>
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
