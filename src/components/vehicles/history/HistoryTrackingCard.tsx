import { VehicleTrackingData } from '@/hooks/useVehicleTracking';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Gauge, Power } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HistoryTrackingCardProps {
  point: VehicleTrackingData;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  isSelected: boolean;
  onClick: () => void;
}

export function HistoryTrackingCard({ 
  point, 
  index, 
  isFirst, 
  isLast, 
  isSelected,
  onClick 
}: HistoryTrackingCardProps) {
  const formattedDate = point.recorded_at 
    ? format(new Date(point.recorded_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })
    : 'Data desconhecida';

  const getIndicatorColor = () => {
    if (isFirst) return 'bg-green-500';
    if (isLast) return 'bg-red-500';
    return 'bg-yellow-500';
  };

  const getIndicatorLabel = () => {
    if (isFirst) return 'Início';
    if (isLast) return 'Fim';
    return null;
  };

  return (
    <div
      className={`p-3 rounded-lg border cursor-pointer transition-all ${
        isSelected 
          ? 'border-primary bg-primary/5 shadow-md' 
          : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50'
      }`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${getIndicatorColor()}`} />
          <span className="text-sm font-medium">Ponto #{index + 1}</span>
          {getIndicatorLabel() && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              isFirst ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'
            }`}>
              {getIndicatorLabel()}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{formattedDate}</span>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1 text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span>Lat: {point.latitude.toFixed(6)}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Navigation className="h-3 w-3" />
          <span>Direção: {point.heading ?? 0}°</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span>Lng: {point.longitude.toFixed(6)}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Gauge className="h-3 w-3" />
          <span>Vel: {point.speed ?? 0} km/h</span>
        </div>
      </div>

      {/* Ignition status */}
      <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs">
          <Power className={`h-3 w-3 ${point.ignition ? 'text-green-500' : 'text-muted-foreground'}`} />
          <span className="text-muted-foreground">
            Ignição: {point.ignition ? 'Ligada' : 'Desligada'}
          </span>
        </div>
        <Button variant="ghost" size="sm" className="h-6 text-xs">
          Ver no mapa
        </Button>
      </div>
    </div>
  );
}
