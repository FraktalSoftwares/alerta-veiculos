import { VehicleBadge } from "@/components/vehicles/VehicleBadge";
import { useClientVehicles } from "@/hooks/useVehicles";
import { Loader2 } from "lucide-react";

interface VeiculosTabProps {
  clientId: string;
}

const statusLabels = {
  rastreando: "RASTREANDO",
  desligado: "DESLIGADO",
  "sem-sinal": "SEM SINAL",
  bloqueado: "BLOQUEADO",
};

export function VeiculosTab({ clientId }: VeiculosTabProps) {
  const { data: vehicles, isLoading } = useClientVehicles(clientId);

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border p-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-12 flex items-center justify-center">
        <p className="text-muted-foreground">Nenhum veículo cadastrado para este cliente</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-table-header">
            <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">#</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Placa</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Tipo</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Marca</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Modelo</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Ano</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Cor</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Última Atualização</th>
            <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Status</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((vehicle, index) => (
            <tr 
              key={vehicle.id}
              className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <td className="px-4 py-4 text-sm text-foreground">{index + 1}</td>
              <td className="px-4 py-4 text-sm text-foreground font-medium">{vehicle.plate}</td>
              <td className="px-4 py-4 text-sm text-foreground">{vehicle.type}</td>
              <td className="px-4 py-4 text-sm text-foreground">{vehicle.brand || '-'}</td>
              <td className="px-4 py-4 text-sm text-foreground">{vehicle.model || '-'}</td>
              <td className="px-4 py-4 text-sm text-foreground">{vehicle.year || '-'}</td>
              <td className="px-4 py-4 text-sm text-foreground">{vehicle.color || '-'}</td>
              <td className="px-4 py-4 text-sm text-foreground">{vehicle.lastUpdate}</td>
              <td className="px-4 py-4 text-right">
                <VehicleBadge variant={vehicle.status}>
                  {statusLabels[vehicle.status]}
                </VehicleBadge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
