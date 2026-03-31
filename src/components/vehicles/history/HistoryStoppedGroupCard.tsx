import { StoppedGroup } from '@/utils/groupStoppedPoints';
import { MapPin, Power, ParkingSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HistoryStoppedGroupCardProps {
  group: StoppedGroup;
  isSelected: boolean;
  onClick: () => void;
}

export function HistoryStoppedGroupCard({
  group,
  isSelected,
  onClick,
}: HistoryStoppedGroupCardProps) {
  const startFormatted = group.startTime
    ? format(new Date(group.startTime), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })
    : '?';
  const endFormatted = group.endTime
    ? format(new Date(group.endTime), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })
    : '?';

  // Calculate duration
  let duration = '';
  if (group.startTime && group.endTime) {
    const ms = new Date(group.endTime).getTime() - new Date(group.startTime).getTime();
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
      duration = `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
    } else {
      duration = `${minutes}min`;
    }
  }

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
          <ParkingSquare className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
            Parado
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-400">
            {group.pointCount} pontos
          </span>
        </div>
        {duration && (
          <span className="text-xs font-medium text-muted-foreground">
            {duration}
          </span>
        )}
      </div>

      {/* Time range */}
      <div className="text-xs text-muted-foreground mb-2 bg-muted/50 rounded px-2 py-1.5">
        <span>Ficou parado de </span>
        <span className="font-medium text-foreground">{startFormatted}</span>
        <span> às </span>
        <span className="font-medium text-foreground">{endFormatted}</span>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1 text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span>Lat: {group.latitude.toFixed(6)}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span>Lng: {group.longitude.toFixed(6)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs">
          <Power className={`h-3 w-3 ${group.ignition ? 'text-green-500' : 'text-muted-foreground'}`} />
          <span className="text-muted-foreground">
            Ignição: {group.ignition ? 'Ligada' : 'Desligada'}
          </span>
        </div>
        <Button variant="ghost" size="sm" className="h-6 text-xs">
          Ver no mapa
        </Button>
      </div>
    </div>
  );
}
