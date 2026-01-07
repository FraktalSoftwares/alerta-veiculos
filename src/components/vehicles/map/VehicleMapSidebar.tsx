import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VehicleMapFilters } from "./VehicleMapFilters";
import { VehicleMapCard } from "./VehicleMapCard";
import { VehicleDisplay } from "@/types/vehicle";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMultipleVehicleConnections } from "@/hooks/useVehicleConnection";

interface VehicleMapSidebarProps {
  vehicles: VehicleDisplay[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onShowLocation: (vehicleId: string) => void;
  isLoading?: boolean;
  selectedVehicleId?: string | null;
}

export function VehicleMapSidebar({ 
  vehicles, 
  activeFilter, 
  onFilterChange, 
  onShowLocation,
  isLoading,
  selectedVehicleId
}: VehicleMapSidebarProps) {
  const navigate = useNavigate();

  // Get all IMEIs from vehicles
  const imeis = useMemo(() => {
    return vehicles
      .map(v => v.imei && v.imei !== '-' ? v.imei : null)
      .filter((imei): imei is string => !!imei);
  }, [vehicles]);

  // Check connection status for all vehicles
  const { data: connectionsData } = useMultipleVehicleConnections(imeis);

  // Calculate filter counts based on real connection status
  const filterCounts = useMemo(() => {
    const total = vehicles.length;
    let rastreados = 0;
    let semSinal = 0;
    let bloqueados = 0;
    let desligados = 0;

    vehicles.forEach(vehicle => {
      const imei = vehicle.imei && vehicle.imei !== '-' ? vehicle.imei : null;
      const isConnected = imei ? connectionsData?.[imei] === true : false;
      
      // Determine status based on API connection
      if (vehicle.status === 'bloqueado') {
        bloqueados++;
      } else if (isConnected) {
        rastreados++;
      } else {
        semSinal++;
      }
    });

    return {
      todos: total,
      rastreados,
      semSinal,
      bloqueados,
      desligados,
    };
  }, [vehicles, connectionsData]);

  // Filter vehicles based on active filter and real connection status
  const filteredVehicles = useMemo(() => {
    let filtered = vehicles;

    if (activeFilter !== 'todos') {
      switch (activeFilter) {
        case 'rastreados':
          filtered = vehicles.filter(v => {
            const imei = v.imei && v.imei !== '-' ? v.imei : null;
            return imei ? connectionsData?.[imei] === true : false;
          });
          break;
        case 'semSinal':
          filtered = vehicles.filter(v => {
            const imei = v.imei && v.imei !== '-' ? v.imei : null;
            const isConnected = imei ? connectionsData?.[imei] === true : false;
            return !isConnected && v.status !== 'bloqueado';
          });
          break;
        case 'bloqueados':
          filtered = vehicles.filter(v => v.status === 'bloqueado');
          break;
        case 'desligados':
          filtered = vehicles.filter(v => v.status === 'desligado');
          break;
      }
    }

    return filtered;
  }, [vehicles, activeFilter, connectionsData]);

  const handleMoreInfo = (vehicleId: string) => {
    navigate(`/veiculos/${vehicleId}/mapa`);
  };

  // Map VehicleDisplay status to VehicleMapCard status based on real connection
  const mapStatus = (vehicle: VehicleDisplay): "semSinal" | "rastreado" | "bloqueado" | "desligado" => {
    // If blocked, always show blocked
    if (vehicle.status === 'bloqueado') {
      return 'bloqueado';
    }
    
    // Check real connection status
    const imei = vehicle.imei && vehicle.imei !== '-' ? vehicle.imei : null;
    const isConnected = imei ? connectionsData?.[imei] === true : false;
    
    if (isConnected) {
      return 'rastreado';
    } else {
      return 'semSinal';
    }
  };

  return (
    <div className="w-[580px] bg-background border-r border-border flex flex-col h-full">
      <VehicleMapFilters
        activeFilter={activeFilter}
        onFilterChange={onFilterChange}
        filterCounts={filterCounts}
      />
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
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
