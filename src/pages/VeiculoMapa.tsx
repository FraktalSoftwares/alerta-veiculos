import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Power, Gauge, Wifi, Lock, Unlock, MoreVertical, Navigation, History } from "lucide-react";
import { useVehicle } from "@/hooks/useVehicles";
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
  
  // Get equipment data
  const equipment = vehicle?.equipment?.[0];
  const imei = equipment?.imei || null;
  const { data: connectionData } = useVehicleConnection(imei);

  const handleBack = () => {
    navigate("/veiculos");
  };

  const handleAction = (action: string) => {
    toast({
      title: action,
      description: `Funcionalidade "${action}" será implementada em breve.`,
    });
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
  // If connected via API, show "RASTREANDO", otherwise show "sem-sinal"
  const isConnected = connectionData?.conectado === true;
  const displayStatus = isConnected ? 'rastreando' : 'sem-sinal';
  const isPoweredOn = isConnected;
  // Use real connection status from API
  const hasSignal = isConnected;
  const isBlocked = vehicle.status === 'blocked';
  const speed = trackingData?.speed ?? 0;
  const heading = trackingData?.heading ?? 0;

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
                  <h1 className="font-semibold text-foreground">{vehicle.plate}</h1>
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
              <DropdownMenuItem onClick={() => handleAction("Bloquear veículo")} className="cursor-pointer">
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
              <DropdownMenuItem onClick={() => handleAction("Cerca Virtual")} className="cursor-pointer">
                Cerca Virtual
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/veiculos/${id}/historico`)} className="cursor-pointer">
                <History className="h-4 w-4 mr-2" />
                Histórico
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAction("Compartilhar")} className="cursor-pointer">
                Compartilhar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Status bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
        <div className="bg-card/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
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
          
          <div className="flex items-center justify-around">
            <div className="flex flex-col items-center gap-1">
              <div className={`p-2 rounded-full ${isPoweredOn ? 'bg-green-500/20' : 'bg-muted'}`}>
                <Power className={`h-5 w-5 ${isPoweredOn ? 'text-green-500' : 'text-muted-foreground'}`} />
              </div>
              <span className="text-xs text-muted-foreground">{isPoweredOn ? 'Ligado' : 'Desligado'}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className={`p-2 rounded-full ${speed > 0 ? 'bg-blue-500/20' : 'bg-muted'}`}>
                <Gauge className={`h-5 w-5 ${speed > 0 ? 'text-blue-500' : 'text-muted-foreground'}`} />
              </div>
              <span className="text-xs text-muted-foreground">{speed} km/h</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className={`p-2 rounded-full ${hasSignal ? 'bg-green-500/20' : 'bg-destructive/20'}`}>
                <Wifi className={`h-5 w-5 ${hasSignal ? 'text-green-500' : 'text-destructive'}`} />
              </div>
              <span className="text-xs text-muted-foreground">{hasSignal ? 'Com sinal' : 'Sem sinal'}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="p-2 rounded-full bg-muted" style={{ transform: `rotate(${heading}deg)` }}>
                <Navigation className="h-5 w-5 text-muted-foreground" />
              </div>
              <span className="text-xs text-muted-foreground">{heading}°</span>
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

      {/* Map iframe - fullscreen */}
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
    </div>
  );
};

export default VeiculoMapa;
