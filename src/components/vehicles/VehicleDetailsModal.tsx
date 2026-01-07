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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Power,
  Gauge,
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
  Navigation,
  Route,
  Milestone,
  Ban,
  Unlock,
} from "lucide-react";
import { VehicleDisplay } from "@/types/vehicle";
import { RequirePermission } from "@/components/auth/PermissionGate";
import { PERMISSIONS } from "@/hooks/useUserPermissions";

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

  if (!vehicle) return null;

  const isBlocked = vehicle.status === 'bloqueado';

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
              <p className="text-xs text-muted-foreground">{vehicle.lastUpdate}</p>
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
              {/* Status */}
              <div className="flex flex-col items-center gap-1">
                <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center ${
                  vehicle.status === 'rastreando' ? 'border-primary/30' : 'border-destructive/30'
                }`}>
                  <Power className={`h-6 w-6 ${
                    vehicle.status === 'rastreando' ? 'text-primary' : 'text-destructive'
                  }`} />
                </div>
                <span className="text-xs text-muted-foreground capitalize">
                  {vehicle.status === 'rastreando' ? 'Ligado' : 'Desligado'}
                </span>
              </div>

              {/* Speed */}
              <div className="flex flex-col items-center gap-1">
                <div className="w-14 h-14 rounded-full border-4 border-primary/30 flex items-center justify-center">
                  <Gauge className="h-6 w-6 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">0 km/h</span>
              </div>

              {/* GPS Signal */}
              <div className="flex flex-col items-center gap-1">
                <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center ${
                  vehicle.status === 'sem-sinal' ? 'border-amber-400/30' : 'border-primary/30'
                }`}>
                  <WifiOff className={`h-6 w-6 ${
                    vehicle.status === 'sem-sinal' ? 'text-amber-500' : 'text-primary'
                  }`} />
                </div>
                <span className="text-xs text-muted-foreground">
                  {vehicle.status === 'sem-sinal' ? 'Sem sinal' : 'Com sinal'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Última atualização: {vehicle.lastUpdate}</span>
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
            <RequirePermission code={PERMISSIONS.VEHICLES_EDIT}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex-1 gap-2">
                    Mais comandos
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Sirene</DropdownMenuItem>
                  <DropdownMenuItem>Reiniciar rastreador</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                  <div>
                    <p className="text-sm font-medium">Cliente:</p>
                    <p className="text-sm text-muted-foreground">{vehicle.clientName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Car className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Veículo</p>
                    <p className="text-sm text-muted-foreground">
                      {vehicle.brand} {vehicle.model} {vehicle.year ? `(${vehicle.year})` : ''}
                    </p>
                  </div>
                </div>
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
            <Button variant="ghost" size="sm" className="flex flex-col gap-1 h-auto py-2">
              <ShieldAlert className="h-4 w-4" />
              <span className="text-xs">Cerca Virtual</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex flex-col gap-1 h-auto py-2">
              <Share2 className="h-4 w-4" />
              <span className="text-xs">Compartilhar</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex flex-col gap-1 h-auto py-2">
              <History className="h-4 w-4" />
              <span className="text-xs">Histórico</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex flex-col gap-1 h-auto py-2">
              <Navigation className="h-4 w-4" />
              <span className="text-xs">Pontos de Interesse</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex flex-col gap-1 h-auto py-2">
              <Route className="h-4 w-4" />
              <span className="text-xs">Rotas</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex flex-col gap-1 h-auto py-2">
              <Milestone className="h-4 w-4" />
              <span className="text-xs">Hodômetro</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
