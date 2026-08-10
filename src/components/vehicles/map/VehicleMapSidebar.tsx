import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VehicleMapFilters } from "./VehicleMapFilters";
import { VehicleMapCard } from "./VehicleMapCard";
import { VehicleDisplay } from "@/types/vehicle";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMultipleVehicleBlockStatuses } from "@/hooks/useVehicleBlockStatus";
import { vehicleListStatus } from "@/lib/vehicleMarker";

interface VehicleMapSidebarProps {
  vehicles: VehicleDisplay[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onShowLocation: (vehicleId: string) => void;
  isLoading?: boolean;
  selectedVehicleId?: string | null;
  variant?: "sidebar" | "sheet";
}

export function VehicleMapSidebar({ 
  vehicles, 
  activeFilter, 
  onFilterChange, 
  onShowLocation,
  isLoading,
  selectedVehicleId,
  variant = "sidebar",
}: VehicleMapSidebarProps) {
  const navigate = useNavigate();

  // Get all IMEIs from vehicles
  const imeis = useMemo(() => {
    return vehicles
      .map(v => v.imei && v.imei !== '-' ? v.imei : null)
      .filter((imei): imei is string => !!imei);
  }, [vehicles]);

  // Status de bloqueio AUTORITATIVO (mesma fonte da lista: vehicles.blocked via API).
  const { data: blockedMap } = useMultipleVehicleBlockStatuses(imeis);

  // Classificação única, alinhada à lista de veículos:
  //  bloqueado > rastreando (sinal < 7h) > desligado (sem sinal +7h).
  const classify = (v: VehicleDisplay): 'rastreando' | 'desligado' | 'bloqueado' => {
    const imei = v.imei && v.imei !== '-' ? v.imei : null;
    if (imei && blockedMap?.[imei] === true) return 'bloqueado';
    return vehicleListStatus({ ignition: v.ignition, recordedAt: v.lastSignalAt }) === 'sem-sinal'
      ? 'desligado'
      : 'rastreando';
  };

  const filterCounts = useMemo(() => {
    const counts = { todos: vehicles.length, rastreando: 0, desligado: 0, bloqueado: 0 };
    vehicles.forEach((v) => { counts[classify(v)]++; });
    return counts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicles, blockedMap]);

  const filteredVehicles = useMemo(() => {
    if (activeFilter === 'todos') return vehicles;
    return vehicles.filter((v) => classify(v) === activeFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicles, activeFilter, blockedMap]);

  const handleMoreInfo = (vehicleId: string) => {
    navigate(`/veiculos/${vehicleId}/mapa`);
  };

  const mapStatus = (vehicle: VehicleDisplay) => classify(vehicle);

  return (
    <div 
      className={
        variant === "sheet"
          ? "w-full bg-background flex flex-col h-full"
          : "w-[320px] md:w-[400px] lg:w-[480px] bg-background border-r border-border flex flex-col h-full shrink-0"
      }
    >
      <VehicleMapFilters
        activeFilter={activeFilter}
        onFilterChange={onFilterChange}
        filterCounts={filterCounts}
      />
      <ScrollArea className="flex-1 min-h-0 [&>[data-radix-scroll-area-viewport]>div]:!block [&>[data-radix-scroll-area-viewport]>div]:!w-full">
        <div className={`p-3 sm:p-4 space-y-3 ${variant === "sheet" ? "pb-[max(1rem,env(safe-area-inset-bottom,0px))]" : ""}`}>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum veículo encontrado</p>
            </div>
          ) : (
            filteredVehicles.map((vehicle) => (
              <VehicleMapCard
                key={vehicle.id}
                plate={vehicle.plate}
                imei={vehicle.imei}
                clientName={vehicle.clientName}
                phone={'-'} // Phone will be added when we have it in VehicleDisplay
                vehicleType={vehicle.type}
                carrier={vehicle.operator}
                system={vehicle.operator}
                tracker={vehicle.tracker}
                status={mapStatus(vehicle)}
                lastUpdate={vehicle.lastUpdate}
                onShowLocation={() => onShowLocation(vehicle.id)}
                onMoreInfo={() => handleMoreInfo(vehicle.id)}
                isSelected={selectedVehicleId === vehicle.id}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
