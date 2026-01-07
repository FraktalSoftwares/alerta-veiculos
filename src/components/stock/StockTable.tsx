import { StockTableHeader } from "./StockTableHeader";
import { StockTableRow } from "./StockTableRow";
import { EquipmentDisplay } from "@/types/equipment";
import { Loader2 } from "lucide-react";

interface StockTableProps {
  equipments: EquipmentDisplay[];
  onEquipmentClick?: (equipment: EquipmentDisplay) => void;
  onEditEquipment?: (equipment: EquipmentDisplay) => void;
  onDeleteEquipment?: (equipment: EquipmentDisplay) => void;
  isLoading?: boolean;
}

export function StockTable({ equipments, onEquipmentClick, onEditEquipment, onDeleteEquipment, isLoading }: StockTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border overflow-hidden bg-card">
        <StockTableHeader />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (equipments.length === 0) {
    return (
      <div className="rounded-lg border border-border overflow-hidden bg-card">
        <StockTableHeader />
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Nenhum equipamento encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-card">
      <StockTableHeader />
      <div className="divide-y divide-border">
        {equipments.map((equipment, index) => (
          <StockTableRow
            key={`${equipment.id}-${index}`}
            equipment={equipment}
            onClick={onEquipmentClick}
            onEdit={onEditEquipment}
            onDelete={onDeleteEquipment}
          />
        ))}
      </div>
    </div>
  );
}
