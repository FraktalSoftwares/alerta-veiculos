import { MapPin, Info, User, Phone, Car, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VehicleMapCardProps {
  plate: string;
  imei: string;
  clientName: string;
  phone: string;
  vehicleType: string;
  carrier: string;
  system: string;
  tracker: string;
  status: "rastreando" | "desligado" | "bloqueado";
  lastUpdate: string;
  onShowLocation: () => void;
  onMoreInfo: () => void;
  isSelected?: boolean;
}

export function VehicleMapCard({
  plate,
  imei,
  clientName,
  phone,
  vehicleType,
  carrier,
  system,
  tracker,
  status,
  lastUpdate,
  onShowLocation,
  onMoreInfo,
  isSelected = false,
}: VehicleMapCardProps) {
  const getStatusStyles = () => {
    switch (status) {
      case "rastreando":
        return "bg-green-500";
      case "desligado":
        return "bg-destructive";
      case "bloqueado":
        return "bg-amber-500";
      default:
        return "bg-muted-foreground";
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case "rastreando":
        return "Rastreando";
      case "desligado":
        return "Desligado";
      case "bloqueado":
        return "Bloqueado";
      default:
        return status;
    }
  };

  return (
    <div className={`border rounded-xl bg-card p-3 sm:p-4 transition-all ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3 pb-2 border-b border-border">
        <span className="text-sm font-medium text-foreground truncate">{plate}</span>
        <span className="text-xs text-muted-foreground truncate shrink-0">{imei}</span>
      </div>

      {/* Content */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {/* Left + Right columns: empilha no mobile */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-1 min-w-0">
          <div className="flex-1 space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
              <User className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{clientName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{phone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
              <Car className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{vehicleType}</span>
            </div>
          </div>
          <div className="flex-1 space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
              <Star className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{carrier} - {system}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
              <Star className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{tracker}</span>
            </div>
          </div>
        </div>

        {/* Location button */}
        <div className="flex items-center justify-center shrink-0">
          <button
            onClick={onShowLocation}
            className="flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <MapPin className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">Mostrar localização</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mt-2 sm:mt-3 pt-2 border-t border-border">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`w-2 h-2 rounded-full shrink-0 ${getStatusStyles()}`} />
          <span className="text-xs text-muted-foreground">{getStatusLabel()}</span>
          <span className="text-xs text-muted-foreground">{lastUpdate}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onMoreInfo}
          className="text-xs gap-1.5 min-h-[44px] sm:min-h-0 sm:h-7 min-w-0 w-full sm:w-auto"
        >
          <Info className="h-3.5 w-3.5 shrink-0" />
          Mais Informações
        </Button>
      </div>
    </div>
  );
}
