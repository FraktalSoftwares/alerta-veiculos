import { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { VehicleMapSidebar } from "@/components/vehicles/map/VehicleMapSidebar";
import { useVehicles, useVehicle } from "@/hooks/useVehicles";
import { VehicleDisplay } from "@/types/vehicle";

const VeiculosMapa = () => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("todos");

  // Get all vehicles without pagination for the map
  const { data: vehiclesData, isLoading } = useVehicles({
    pageSize: 1000, // Get all vehicles
  });

  // Get selected vehicle details for map
  const { data: selectedVehicle } = useVehicle(selectedVehicleId || undefined);

  // Build iframe URL from selected vehicle
  const iframeUrl = useMemo(() => {
    if (!selectedVehicle) return null;
    
    const equipment = selectedVehicle.equipment?.[0];
    const imei = equipment?.imei || null;
    const protocolo = equipment?.products?.model || (equipment as any)?.model || '';
    
    if (!imei || !protocolo) return null;
    
    return `https://fraktalsistemas.com.br:8004/mapa/${encodeURIComponent(imei)}?protocolo=${encodeURIComponent(protocolo)}`;
  }, [selectedVehicle]);

  const handleShowLocation = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    // Don't reset selection when filter changes, keep showing the selected vehicle
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <VehicleMapSidebar 
          vehicles={vehiclesData?.vehicles || []}
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          onShowLocation={handleShowLocation}
          isLoading={isLoading}
          selectedVehicleId={selectedVehicleId}
        />
        <div className="flex-1">
          {iframeUrl ? (
            <iframe
              src={iframeUrl}
              className="w-full h-full border-0"
              loading="lazy"
              allowFullScreen
              title="Mapa do Veículo"
            />
          ) : selectedVehicleId ? (
            <div className="w-full h-full flex items-center justify-center bg-muted/30">
              <div className="text-center text-muted-foreground p-4">
                <p className="text-lg font-semibold mb-2">Mapa não disponível</p>
                <p className="text-sm">
                  O veículo precisa ter um equipamento vinculado com IMEI e modelo configurados
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted/30">
              <div className="text-center text-muted-foreground">
                <p className="text-lg font-semibold mb-2">Selecione um veículo</p>
                <p className="text-sm">Clique em "Mostrar localização" para visualizar o mapa</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VeiculosMapa;
