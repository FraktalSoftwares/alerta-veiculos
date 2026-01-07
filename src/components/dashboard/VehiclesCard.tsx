import { VehicleProgressBar } from "./VehicleProgressBar";
import { useVehicleStats } from "@/hooks/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";

export function VehiclesCard() {
  const { data: stats, isLoading } = useVehicleStats();

  const vehicleStats = [
    { label: "Rastreando", value: stats?.active || 0, color: "green" as const },
    { label: "Desligados", value: stats?.inactive || 0, color: "gray" as const },
    { label: "Sem Sinal", value: stats?.noSignal || 0, color: "yellow" as const },
    { label: "Bloqueados", value: stats?.blocked || 0, color: "red" as const },
    { label: "Manutenção", value: stats?.maintenance || 0, color: "muted" as const },
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="text-lg font-bold font-heading text-foreground text-center mb-4">Veículos</h3>
      
      <div className="bg-muted/50 rounded-lg p-4 mb-6 text-center">
        {isLoading ? (
          <Skeleton className="h-9 w-24 mx-auto mb-1" />
        ) : (
          <p className="text-3xl font-bold text-foreground">
            {(stats?.total || 0).toLocaleString('pt-BR')}
          </p>
        )}
        <p className="text-sm text-muted-foreground">Veículos Totais</p>
      </div>
      
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))
        ) : (
          vehicleStats.map((stat) => (
            <VehicleProgressBar key={stat.label} {...stat} />
          ))
        )}
      </div>
    </div>
  );
}
