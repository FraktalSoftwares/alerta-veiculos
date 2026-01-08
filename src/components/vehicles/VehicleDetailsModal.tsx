import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Power,
  Wifi,
  WifiOff,
  Clock,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  User,
  Phone,
  Car,
  MapPin,
  ShieldAlert,
  Share2,
  History,
  Ban,
  Unlock,
  Mail,
  ExternalLink,
} from "lucide-react";
import { VehicleDisplay } from "@/types/vehicle";
import { RequirePermission } from "@/components/auth/PermissionGate";
import { PERMISSIONS } from "@/hooks/useUserPermissions";
import { useVehicle } from "@/hooks/useVehicles";
import { useVehicleTracking } from "@/hooks/useVehicleTracking";
import { useVehicleConnection } from "@/hooks/useVehicleConnection";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface VehicleDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: VehicleDisplay | null;
  onShowOnMap?: () => void;
  onBlockVehicle?: () => void;
}

export function VehicleDetailsModal({
  open,
  onOpenChange,
  vehicle,
  onShowOnMap,
  onBlockVehicle,
}: VehicleDetailsModalProps) {
  const [clientInfoOpen, setClientInfoOpen] = useState(true);
  const [vehicleInfoOpen, setVehicleInfoOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Busca o veículo completo para obter IMEI e protocolo
  const { data: vehicleFull } = useVehicle(vehicle?.id);
  const { data: trackingData } = useVehicleTracking(vehicle?.id || '');
  
  // Get equipment data for connection status
  const equipment = vehicleFull?.equipment?.[0];
  const imei = equipment?.imei || vehicle?.imei || null;
  const { data: connectionData } = useVehicleConnection(imei && imei !== '-' ? imei : null);

  const handleViewClientDetails = () => {
    if (vehicleFull?.clients?.id) {
      navigate(`/clientes/${vehicleFull.clients.id}`);
      onOpenChange(false);
    }
  };

  const handleVirtualFence = () => {
    if (!vehicle?.id) return;
    navigate(`/veiculos/${vehicle.id}/cercas`);
    onOpenChange(false);
  };

  const handleShare = async () => {
    if (!vehicle?.id) return;
    
    // Generate public share URL using environment variable or fallback to current origin
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const shareUrl = `${baseUrl}/compartilhar/${vehicle.id}`;
    
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

  const handleHistory = () => {
    if (!vehicle?.id) return;
    navigate(`/veiculos/${vehicle.id}/historico`);
    onOpenChange(false);
  };

  if (!vehicle) return null;

  // Determine status based on API connection status
  const isBlocked = vehicle.status === 'bloqueado';
  const isConnected = connectionData?.conectado === true;
  // Use ignition field from tracking data (boolean or number)
  const isPoweredOn = trackingData?.ignition === true || (typeof trackingData?.ignition === 'number' && trackingData.ignition >= 1);
  // Use real connection status from API
  const hasSignal = isConnected;
  
  // Format last update time from tracking data
  const lastUpdate = trackingData?.recorded_at 
    ? new Date(trackingData.recorded_at).toLocaleString('pt-BR')
    : vehicle.lastUpdate || 'Sem dados';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] p-0 gap-0 max-h-[90vh] overflow-auto">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="text-lg font-semibold">Mais Detalhes</DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Vehicle Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-foreground">{vehicle.plate}</p>
              <p className="text-sm text-muted-foreground">{vehicle.imei}</p>
              <p className="text-xs text-muted-foreground">{lastUpdate}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onShowOnMap}
              className="gap-1.5"
            >
              Mostrar no Mapa
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Status Indicators */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-6">
              {/* Status - Ligado/Desligado baseado em ignition */}
              <div className="flex flex-col items-center gap-1">
                <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center ${
                  isPoweredOn ? 'border-primary/30' : 'border-destructive/30'
                }`}>
                  <Power className={`h-6 w-6 ${
                    isPoweredOn ? 'text-primary' : 'text-destructive'
                  }`} />
                </div>
                <span className="text-xs text-muted-foreground capitalize">
                  {isPoweredOn ? 'Ligado' : 'Desligado'}
                </span>
              </div>

              {/* GPS Signal - baseado em connection status */}
              <div className="flex flex-col items-center gap-1">
                <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center ${
                  hasSignal ? 'border-primary/30' : 'border-amber-400/30'
                }`}>
                  {hasSignal ? (
                    <Wifi className="h-6 w-6 text-primary" />
                  ) : (
                    <WifiOff className="h-6 w-6 text-amber-500" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {hasSignal ? 'Com sinal' : 'Sem sinal'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Última atualização: {lastUpdate}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <RequirePermission code={PERMISSIONS.VEHICLES_BLOCK}>
              <Button
                variant={isBlocked ? "default" : "destructive"}
                onClick={onBlockVehicle}
                className="flex-1 gap-2"
              >
                {isBlocked ? (
                  <>
                    <Unlock className="h-4 w-4" />
                    Desbloquear veículo
                  </>
                ) : (
                  <>
                    <Ban className="h-4 w-4" />
                    Bloquear veículo
                  </>
                )}
              </Button>
            </RequirePermission>
          </div>

          {/* Client Information */}
          <Collapsible open={clientInfoOpen} onOpenChange={setClientInfoOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
              <span className="text-sm font-medium">Informações do Cliente</span>
              {clientInfoOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="p-4 border border-border rounded-lg space-y-3">
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Nome:</p>
                    <p className="text-sm text-muted-foreground">
                      {vehicleFull?.clients?.name || vehicle.clientName || 'Não informado'}
                    </p>
                  </div>
                </div>
                {vehicleFull?.clients?.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Telefone:</p>
                      <p className="text-sm text-muted-foreground">{vehicleFull.clients.phone}</p>
                    </div>
                  </div>
                )}
                {vehicleFull?.clients?.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">E-mail:</p>
                      <p className="text-sm text-muted-foreground">{vehicleFull.clients.email}</p>
                    </div>
                  </div>
                )}
                {vehicleFull?.clients?.document_number && (
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {vehicleFull.clients.document_type === 'cpf' ? 'CPF' : 
                         vehicleFull.clients.document_type === 'cnpj' ? 'CNPJ' : 
                         'Documento'}:
                      </p>
                      <p className="text-sm text-muted-foreground">{vehicleFull.clients.document_number}</p>
                    </div>
                  </div>
                )}
                {vehicleFull?.clients?.addresses && vehicleFull.clients.addresses.length > 0 && (() => {
                  const primaryAddress = vehicleFull.clients.addresses.find(addr => addr.is_primary) || vehicleFull.clients.addresses[0];
                  return (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Endereço:</p>
                        <p className="text-sm text-muted-foreground">
                          {primaryAddress.street && `${primaryAddress.street}${primaryAddress.number ? `, ${primaryAddress.number}` : ''}`}
                          {primaryAddress.complement && ` - ${primaryAddress.complement}`}
                          {primaryAddress.neighborhood && `, ${primaryAddress.neighborhood}`}
                          {primaryAddress.city && primaryAddress.state && `, ${primaryAddress.city} - ${primaryAddress.state}`}
                          {primaryAddress.zip_code && ` (${primaryAddress.zip_code})`}
                        </p>
                      </div>
                    </div>
                  );
                })()}
                <div className="flex items-start gap-3">
                  <Car className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Veículo:</p>
                    <p className="text-sm text-muted-foreground">
                      {vehicle.brand} {vehicle.model} {vehicle.year ? `(${vehicle.year})` : ''}
                    </p>
                  </div>
                </div>
                {vehicleFull?.clients?.id && (
                  <div className="pt-2 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleViewClientDetails}
                      className="w-full gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Ver detalhes completos do cliente
                    </Button>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Vehicle Information */}
          <Collapsible open={vehicleInfoOpen} onOpenChange={setVehicleInfoOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
              <span className="text-sm font-medium">Informações do Veículo</span>
              {vehicleInfoOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="p-4 border border-border rounded-lg space-y-3">
                <div className="flex items-start gap-3">
                  <Car className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Placa:</p>
                    <p className="text-sm text-muted-foreground">{vehicle.plate}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Car className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Tipo:</p>
                    <p className="text-sm text-muted-foreground">{vehicle.type}</p>
                  </div>
                </div>
                {vehicle.color && (
                  <div className="flex items-start gap-3">
                    <Car className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Cor:</p>
                      <p className="text-sm text-muted-foreground">{vehicle.color}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Car className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Rastreador:</p>
                    <p className="text-sm text-muted-foreground">{vehicle.tracker}</p>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-border p-4">
          <div className="grid grid-cols-3 gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex flex-col gap-1 h-auto py-2"
              onClick={handleVirtualFence}
            >
              <ShieldAlert className="h-4 w-4" />
              <span className="text-xs">Cerca Virtual</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex flex-col gap-1 h-auto py-2"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
              <span className="text-xs">Compartilhar</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex flex-col gap-1 h-auto py-2"
              onClick={handleHistory}
            >
              <History className="h-4 w-4" />
              <span className="text-xs">Histórico</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
