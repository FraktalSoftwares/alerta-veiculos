import { VehicleTableHeader } from "./VehicleTableHeader";
import { VehicleTableRow } from "./VehicleTableRow";
import { VehicleDisplay } from "@/types/vehicle";
import { Loader2 } from "lucide-react";

interface VehicleTableProps {
  vehicles: VehicleDisplay[];
  onVehicleClick?: (vehicle: VehicleDisplay) => void;
  onEditVehicle?: (vehicle: VehicleDisplay) => void;
  onDeleteVehicle?: (vehicle: VehicleDisplay) => void;
  onBlockVehicle?: (vehicle: VehicleDisplay) => void;
  onShowDetails?: (vehicle: VehicleDisplay) => void;
  isLoading?: boolean;
}

export function VehicleTable({ vehicles, onVehicleClick, onEditVehicle, onDeleteVehicle, onBlockVehicle, onShowDetails, isLoading }: VehicleTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border overflow-hidden bg-card">
        <VehicleTableHeader />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="rounded-lg border border-border overflow-hidden bg-card">
        <VehicleTableHeader />
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Nenhum veículo encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-card">
      <VehicleTableHeader />
      <div className="divide-y divide-border">
        {vehicles.map((vehicle, index) => (
          <VehicleTableRow
            key={`${vehicle.id}-${index}`}
            vehicle={vehicle}
            onClick={onVehicleClick}
            onEdit={onEditVehicle}
            onDelete={onDeleteVehicle}
            onBlock={onBlockVehicle}
            onShowDetails={onShowDetails}
          />
        ))}
      </div>
    </div>
  );
}
