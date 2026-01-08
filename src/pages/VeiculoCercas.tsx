import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { useVehicle } from "@/hooks/useVehicles";
import { useVehicleTracking } from "@/hooks/useVehicleTracking";
import { VirtualFenceList } from "@/components/vehicles/VirtualFenceList";
import { VirtualFenceModal } from "@/components/vehicles/VirtualFenceModal";
import { VirtualFenceMapView } from "@/components/vehicles/map/VirtualFenceMapView";
import { useVirtualFences } from "@/hooks/useVirtualFences";
import { VirtualFenceDisplay } from "@/types/virtualFence";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function VeiculoCercas() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: vehicle, isLoading } = useVehicle(id || '');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFenceId, setEditingFenceId] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [activeTab, setActiveTab] = useState("list");
  const [selectedFenceId, setSelectedFenceId] = useState<string | null>(null);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);

  const equipment = vehicle?.equipment?.[0];
  const equipmentId = equipment?.id || null;
  
  const { data: trackingData } = useVehicleTracking(id || '');
  const { data: fences } = useVirtualFences(equipmentId || undefined);

  const handleBack = () => {
    navigate(`/veiculos/${id}/mapa`);
  };

  const handleCreate = () => {
    setEditingFenceId(null);
    setSelectedLocation(null);
    setIsModalOpen(true);
  };

  const handleFenceSelect = (fence: VirtualFenceDisplay) => {
    setSelectedFenceId(fence.id);
    setActiveTab("map");
    toast({
      title: 'Cerca selecionada',
      description: `${fence.name} - ${fence.radius}m de raio`,
    });
  };

  const handleLocationSelect = () => {
    setIsSelectingLocation(true);
    setActiveTab("map");
    toast({
      title: 'Selecione no mapa',
      description: 'Clique no mapa para definir a localização da cerca',
    });
  };

  const handleMapLocationClick = (lat: number, lng: number) => {
    if (isSelectingLocation) {
      setSelectedLocation({ lat, lng });
      setIsSelectingLocation(false);
      setIsModalOpen(true);
      toast({
        title: 'Localização selecionada',
        description: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      });
    }
  };

  // Get center coordinates for map
  const mapCenter = trackingData 
    ? { lat: trackingData.latitude, lng: trackingData.longitude }
    : fences && fences.length > 0
    ? { lat: fences[0].latitude, lng: fences[0].longitude }
    : { lat: -23.5505, lng: -46.6333 };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!vehicle || !equipmentId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-destructive mb-4">Veículo não encontrado ou sem equipamento</p>
            <Button onClick={() => navigate('/veiculos')}>Voltar para Veículos</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      
      <main className="px-[50px] py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">Cercas Virtuais</h1>
              <p className="text-sm text-muted-foreground">
                {vehicle.plate} - {vehicle.clients?.name || 'Cliente'}
              </p>
            </div>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Cerca
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="list">Lista</TabsTrigger>
            <TabsTrigger value="map">Mapa</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <div className="bg-card rounded-lg border border-border p-6">
              <VirtualFenceList
                equipmentId={equipmentId}
                onFenceSelect={handleFenceSelect}
              />
            </div>
          </TabsContent>

          <TabsContent value="map" className="space-y-4">
            <div className="bg-card rounded-lg border border-border overflow-hidden" style={{ height: '600px' }}>
              <VirtualFenceMapView
                latitude={mapCenter.lat}
                longitude={mapCenter.lng}
                fences={fences || []}
                selectedFenceId={selectedFenceId}
                isSelectingLocation={isSelectingLocation}
                onLocationClick={handleMapLocationClick}
              />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {equipmentId && (
        <VirtualFenceModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          equipmentId={equipmentId}
          fenceId={editingFenceId}
          onLocationSelect={handleLocationSelect}
          initialLocation={selectedLocation}
        />
      )}
    </div>
  );
}
