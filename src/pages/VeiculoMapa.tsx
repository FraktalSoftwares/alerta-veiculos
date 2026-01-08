import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Power, Wifi, Lock, Unlock, MoreVertical, History, Share2, Radio } from "lucide-react";
import { useVehicle, useBlockVehicle } from "@/hooks/useVehicles";
import { useVehicleTracking } from "@/hooks/useVehicleTracking";
import { useVehicleConnection } from "@/hooks/useVehicleConnection";
import { Loader2 } from "lucide-react";
import { VehicleBadge } from "@/components/vehicles/VehicleBadge";
import { mapVehicleStatus } from "@/types/vehicle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { VirtualFenceSidebar } from "@/components/vehicles/VirtualFenceSidebar";
import { VirtualFenceMapView } from "@/components/vehicles/map/VirtualFenceMapView";
import { useVirtualFences } from "@/hooks/useVirtualFences";
import { VirtualFenceDisplay } from "@/types/virtualFence";

const statusLabels = {
  rastreando: "RASTREANDO",
  desligado: "DESLIGADO",
  "sem-sinal": "SEM SINAL",
  bloqueado: "BLOQUEADO",
};

const VeiculoMapa = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: vehicle, isLoading: isLoadingVehicle } = useVehicle(id || '');
  const { data: trackingData, isLoading: isLoadingTracking } = useVehicleTracking(id || '');
  const blockVehicle = useBlockVehicle();
  
  // Get equipment data
  const equipment = vehicle?.equipment?.[0];
  const equipmentId = equipment?.id || null;
  const imei = equipment?.imei || null;
  const { data: connectionData } = useVehicleConnection(imei);
  
  // Virtual fences
  const [isFenceSidebarOpen, setIsFenceSidebarOpen] = useState(false);
  const [selectedFenceId, setSelectedFenceId] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const { data: fences } = useVirtualFences(equipmentId || undefined);

  const handleBack = () => {
    navigate("/veiculos");
  };

  const handleBlockVehicle = () => {
    if (!id) return;
    const mappedStatus = mapVehicleStatus(vehicle?.status);
    const isBlocked = mappedStatus === 'bloqueado' || vehicle?.status === 'blocked';
    const shouldBlock = !isBlocked;
    blockVehicle.mutate({ id, block: shouldBlock });
  };

  const handleAction = (action: string) => {
    if (action === "Cerca Virtual") {
      setIsFenceSidebarOpen(true);
    } else {
      toast({
        title: action,
        description: `Funcionalidade "${action}" será implementada em breve.`,
      });
    }
  };

  const handleFenceSelect = (fence: VirtualFenceDisplay) => {
    setSelectedFenceId(fence.id);
    // Pode adicionar lógica para centralizar o mapa na cerca
    toast({
      title: 'Cerca selecionada',
      description: `${fence.name} - ${fence.radius}m de raio`,
    });
  };

  const handleLocationSelect = () => {
    setIsSelectingLocation(true);
    toast({
      title: 'Selecione no mapa',
      description: 'Clique no mapa para definir a localização da cerca',
    });
  };

  const handleMapLocationClick = (lat: number, lng: number) => {
    if (isSelectingLocation) {
      setSelectedLocation({ lat, lng });
      setIsSelectingLocation(false);
      toast({
        title: 'Localização selecionada',
        description: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      });
    }
  };

  const handleShare = async () => {
    if (!id) return;
    
    // Generate public share URL using environment variable or fallback to current origin
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const shareUrl = `${baseUrl}/compartilhar/${id}`;
    
    try {
      // Try to use the Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link copiado!",
          description: "O link foi copiado para a área de transferência.",
        });
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        toast({
          title: "Link copiado!",
          description: "O link foi copiado para a área de transferência.",
        });
      }
    } catch (error) {
      console.error("Erro ao copiar link:", error);
      toast({
        title: "Erro",
        description: "Não foi possível copiar o link. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const isLoading = isLoadingVehicle || isLoadingTracking;

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">Veículo não encontrado</p>
        <Button onClick={handleBack}>Voltar</Button>
      </div>
    );
  }

  // Determine status based on API connection status
  // If blocked, always show blocked status first
  // vehicle.status comes from DB as 'blocked', mapVehicleStatus converts it to 'bloqueado'
  const mappedStatus = mapVehicleStatus(vehicle.status);
  const isBlocked = mappedStatus === 'bloqueado' || vehicle.status === 'blocked';
  const isConnected = connectionData?.conectado === true;
  // If blocked, show blocked status, otherwise use connection status
  const displayStatus = isBlocked ? 'bloqueado' : (isConnected ? 'rastreando' : 'sem-sinal');
  // Use ignition field from tracking data (boolean or number)
  const isPoweredOn = trackingData?.ignition === true || (typeof trackingData?.ignition === 'number' && trackingData.ignition >= 1);
  // Use real connection status from API
  const hasSignal = isConnected;

  // Format last update time
  const lastUpdate = trackingData?.recorded_at 
    ? new Date(trackingData.recorded_at).toLocaleString('pt-BR')
    : 'Sem dados';

  // Get equipment data for iframe
  // Try to get model from product first, then from equipment directly
  const protocolo = equipment?.products?.model || (equipment as any)?.model || '';
  
  // Build iframe URL
  const iframeUrl = imei && protocolo 
    ? `https://fraktalsistemas.com.br:8004/mapa/${encodeURIComponent(imei)}?protocolo=${encodeURIComponent(protocolo)}`
    : null;
  

  return (
    <div className="h-screen w-screen flex flex-col bg-background relative">
      {/* Header overlay */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-background/95 to-transparent">
        <div className="flex items-center justify-between p-4">
          {/* Back button and vehicle info */}
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="icon"
              onClick={handleBack}
              className="h-10 w-10 rounded-full shadow-lg"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="bg-card/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-semibold text-foreground">{vehicle.plate}</h1>
                    {isBlocked && (
                      <div title="Veículo bloqueado">
                        <Lock className="h-4 w-4 text-destructive" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{vehicle.clients?.name || 'Cliente'}</p>
                </div>
                <VehicleBadge variant={displayStatus}>
                  {statusLabels[displayStatus]}
                </VehicleBadge>
              </div>
            </div>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-10 w-10 rounded-full shadow-lg"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover z-50">
              <DropdownMenuItem onClick={handleBlockVehicle} className="cursor-pointer" disabled={blockVehicle.isPending}>
                {isBlocked ? (
                  <>
                    <Unlock className="h-4 w-4 mr-2" />
                    Desbloquear
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Bloquear
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/veiculos/${id}/cercas`)} className="cursor-pointer">
                <Radio className="h-4 w-4 mr-2" />
                Cercas Virtuais
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/veiculos/${id}/historico`)} className="cursor-pointer">
                <History className="h-4 w-4 mr-2" />
                Histórico
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Status bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 flex justify-center">
        <div className="bg-card/95 backdrop-blur-sm rounded-xl p-4 shadow-lg w-fit">
          {/* Location info */}
          {!iframeUrl && (
            <div className="text-center text-xs text-muted-foreground mb-3 pb-3 border-b border-border">
              Equipamento não vinculado ou sem IMEI/Modelo configurado
            </div>
          )}
          {iframeUrl && (
            <div className="text-center text-xs text-muted-foreground mb-3 pb-3 border-b border-border">
              Última atualização: {lastUpdate}
            </div>
          )}
          
          <div className="flex items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-1">
              <div className={`p-2 rounded-full ${isPoweredOn ? 'bg-green-500/20' : 'bg-muted'}`}>
                <Power className={`h-5 w-5 ${isPoweredOn ? 'text-green-500' : 'text-muted-foreground'}`} />
              </div>
              <span className="text-xs text-muted-foreground">{isPoweredOn ? 'Ligado' : 'Desligado'}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className={`p-2 rounded-full ${hasSignal ? 'bg-green-500/20' : 'bg-destructive/20'}`}>
                <Wifi className={`h-5 w-5 ${hasSignal ? 'text-green-500' : 'text-destructive'}`} />
              </div>
              <span className="text-xs text-muted-foreground">{hasSignal ? 'Com sinal' : 'Sem sinal'}</span>
            </div>
            {isBlocked && (
              <div className="flex flex-col items-center gap-1">
                <div className="p-2 rounded-full bg-destructive/20">
                  <Lock className="h-5 w-5 text-destructive" />
                </div>
                <span className="text-xs text-destructive">Bloqueado</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Map - fullscreen */}
      {iframeUrl ? (
        <iframe
          src={iframeUrl}
          className="w-full h-full border-0"
          loading="lazy"
          allowFullScreen
          title="Mapa do Veículo"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <div className="text-center p-4">
            <p className="text-muted-foreground mb-2 font-semibold">Mapa não disponível</p>
            <p className="text-sm text-muted-foreground mb-4">
              {!equipment 
                ? "O veículo precisa ter um equipamento vinculado."
                : !imei 
                  ? "O equipamento precisa ter um IMEI configurado."
                  : "O equipamento precisa ter um modelo/protocolo configurado."}
            </p>
            {equipment && (
              <div className="text-xs text-muted-foreground space-y-1 mt-4">
                <p>Equipamento: {equipment.serial_number || 'N/A'}</p>
                <p>IMEI: {imei || 'Não configurado'}</p>
                <p>Modelo: {protocolo || 'Não configurado'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Virtual Fence Sidebar */}
      {equipmentId && (
        <VirtualFenceSidebar
          equipmentId={equipmentId}
          isOpen={isFenceSidebarOpen}
          onClose={() => {
            setIsFenceSidebarOpen(false);
            setIsSelectingLocation(false);
          }}
          onFenceSelect={handleFenceSelect}
          onLocationSelect={handleLocationSelect}
          selectedLocation={selectedLocation}
        />
      )}
    </div>
  );
};

export default VeiculoMapa;
