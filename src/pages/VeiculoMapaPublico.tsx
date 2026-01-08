import { useParams } from "react-router-dom";
import { Power, Wifi, Lock, Loader2 } from "lucide-react";
import { useVehiclePublic } from "@/hooks/useVehiclePublic";
import { useVehicleTracking } from "@/hooks/useVehicleTracking";
import { useVehicleConnection } from "@/hooks/useVehicleConnection";
import { VehicleBadge } from "@/components/vehicles/VehicleBadge";

const statusLabels = {
  rastreando: "RASTREANDO",
  desligado: "DESLIGADO",
  "sem-sinal": "SEM SINAL",
  bloqueado: "BLOQUEADO",
};

const VeiculoMapaPublico = () => {
  const { id } = useParams<{ id: string }>();
  const { data: vehicle, isLoading: isLoadingVehicle } = useVehiclePublic(id || '');
  const { data: trackingData, isLoading: isLoadingTracking } = useVehicleTracking(id || '');
  
  // Get equipment data
  const equipment = vehicle?.equipment?.[0];
  const imei = equipment?.imei || null;
  const { data: connectionData } = useVehicleConnection(imei);

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
      </div>
    );
  }

  // Determine status based on API connection status
  // If connected via API, show "RASTREANDO", otherwise show "sem-sinal"
  const isConnected = connectionData?.conectado === true;
  const displayStatus = isConnected ? 'rastreando' : 'sem-sinal';
  // Use ignition field from tracking data (0 = desligado, 1 ou maior = ligado)
  const isPoweredOn = trackingData?.ignition === true || trackingData?.ignition === 1;
  // Use real connection status from API
  const hasSignal = isConnected;
  const isBlocked = vehicle.status === 'blocked';

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
      {/* Header overlay - simplified, no actions */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-background/95 to-transparent">
        <div className="flex items-center justify-center p-4">
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

export default VeiculoMapaPublico;

