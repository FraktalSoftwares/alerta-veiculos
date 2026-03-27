import { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { VehicleMapSidebar } from "@/components/vehicles/map/VehicleMapSidebar";
import { useVehicles, useVehicle } from "@/hooks/useVehicles";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { List } from "lucide-react";

const VeiculosMapa = () => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("todos");
  const [sheetOpen, setSheetOpen] = useState(false);
  const isMobile = useIsMobile();

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

  const handleShowLocationAndClose = (vehicleId: string) => {
    handleShowLocation(vehicleId);
    setSheetOpen(false);
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
  };

  return (
    <div className="h-[100dvh] sm:h-screen bg-background flex flex-col overflow-hidden">
      <Header />
      
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Sidebar: apenas em desktop */}
        {!isMobile && (
          <VehicleMapSidebar 
            variant="sidebar"
            vehicles={vehiclesData?.vehicles || []}
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
            onShowLocation={handleShowLocation}
            isLoading={isLoading}
            selectedVehicleId={selectedVehicleId}
          />
        )}

        {/* Mapa */}
        <div className="flex-1 min-h-0 flex flex-col relative">
          {iframeUrl ? (
            <iframe
              src={iframeUrl}
              className="w-full h-full min-h-[240px] border-0"
              loading="lazy"
              allowFullScreen
              title="Mapa do Veículo"
            />
          ) : selectedVehicleId ? (
            <div className="w-full flex-1 min-h-[240px] flex items-center justify-center bg-muted/30">
              <div className="text-center text-muted-foreground p-4">
                <p className="text-base sm:text-lg font-semibold mb-2">Mapa não disponível</p>
                <p className="text-sm">
                  O veículo precisa ter um equipamento vinculado com IMEI e modelo configurados
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full flex-1 min-h-[240px] flex items-center justify-center bg-muted/30">
              <div className="text-center text-muted-foreground p-4">
                <p className="text-base sm:text-lg font-semibold mb-2">Selecione um veículo</p>
                <p className="text-sm">
                  {isMobile ? 'Toque no botão abaixo para ver a lista' : 'Clique em "Mostrar localização" para visualizar o mapa'}
                </p>
              </div>
            </div>
          )}

          {/* FAB: Lista de veículos (apenas mobile) */}
          {isMobile && (
            <Button
              size="lg"
              className="fixed z-20 h-12 min-h-[48px] px-4 gap-2 shadow-lg bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] right-[calc(1rem+env(safe-area-inset-right,0px))]"
              onClick={() => setSheetOpen(true)}
            >
              <List className="h-5 w-5" />
              Lista de veículos
            </Button>
          )}
        </div>

        {/* Sheet: lista de veículos no mobile */}
        {isMobile && (
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetContent 
              side="bottom" 
              className="h-[85dvh] max-h-[85dvh] p-0 gap-0 rounded-t-2xl overflow-hidden flex flex-col [&>button]:top-3 [&>button]:right-[max(0.75rem,env(safe-area-inset-right,0px))]"
            >
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mt-2 shrink-0" aria-hidden />
              <div className="flex-1 min-h-0 overflow-hidden">
                <VehicleMapSidebar 
                  variant="sheet"
                  vehicles={vehiclesData?.vehicles || []}
                  activeFilter={activeFilter}
                  onFilterChange={handleFilterChange}
                  onShowLocation={handleShowLocationAndClose}
                  isLoading={isLoading}
                  selectedVehicleId={selectedVehicleId}
                />
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </div>
  );
};

export default VeiculosMapa;
