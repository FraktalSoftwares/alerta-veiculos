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
  status: "semSinal" | "rastreado" | "bloqueado" | "desligado";
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
      case "semSinal":
        return "bg-amber-500";
      case "rastreado":
        return "bg-green-500";
      case "bloqueado":
        return "bg-destructive";
      case "desligado":
        return "bg-muted-foreground";
      default:
        return "bg-muted-foreground";
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case "semSinal":
        return "Sem Sinal";
      case "rastreado":
        return "Rastreado";
      case "bloqueado":
        return "Bloqueado";
      case "desligado":
        return "Desligado";
      default:
        return status;
    }
  };

  return (
    <div className={`border rounded-lg bg-card p-4 transition-all ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
        <span className="text-sm font-medium text-foreground">{plate}</span>
        <span className="text-xs text-muted-foreground">{imei}</span>
      </div>

      {/* Content */}
      <div className="flex gap-4">
        {/* Left column */}
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            <span>{clientName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-3.5 w-3.5" />
            <span>{phone}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Car className="h-3.5 w-3.5" />
            <span>{vehicleType}</span>
          </div>
        </div>

        {/* Right column */}
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Star className="h-3.5 w-3.5" />
            <span>{carrier} - {system}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Star className="h-3.5 w-3.5" />
            <span>{tracker}</span>
          </div>
        </div>

        {/* Location button */}
        <div className="flex flex-col items-center justify-center">
          <button
            onClick={onShowLocation}
            className="flex flex-col items-center gap-1 text-primary hover:text-primary/80 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xs">Mostrar localização</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${getStatusStyles()}`} />
          <span className="text-xs text-muted-foreground">{getStatusLabel()}</span>
          <span className="text-xs text-muted-foreground">{lastUpdate}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onMoreInfo}
          className="text-xs gap-1.5 h-7"
        >
          <Info className="h-3.5 w-3.5" />
          Mais Informações
        </Button>
      </div>
    </div>
  );
}
