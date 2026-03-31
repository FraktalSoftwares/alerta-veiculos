import { format } from 'date-fns';
import { VehicleTrackingData } from '@/hooks/useVehicleTracking';
import { getAddress } from '@/utils/geocoding';
import { groupStoppedPoints, HistoryDisplayItem } from '@/utils/groupStoppedPoints';

export interface ReportRow {
  data: string;
  velocidade: string;
  ignicao: string;
  tempoParada: string;
  endereco: string;
}

function formatDuration(ms: number): string {
  if (ms <= 0) return '0s';

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes} min`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} e ${parts[1]}`;
  return `${parts[0]}, ${parts[1]} e ${parts[2]}`;
}

function calculateStopTimeForItem(
  items: HistoryDisplayItem[],
  currentIndex: number
): string {
  const item = items[currentIndex];

  if (item.type === 'stopped-group') {
    if (item.startTime && item.endTime) {
      const ms = new Date(item.endTime).getTime() - new Date(item.startTime).getTime();
      return formatDuration(ms);
    }
    return 'Parado';
  }

  const point = item.data;
  const isMoving = point.ignition && (point.speed ?? 0) > 0;
  if (isMoving) return 'Movimento';

  const currentTime = point.recorded_at ? new Date(point.recorded_at).getTime() : 0;
  if (!currentTime) return '-';

  // Look ahead in display items for the next movement
  for (let i = currentIndex + 1; i < items.length; i++) {
    const next = items[i];
    if (next.type === 'single-point') {
      const nextIsMoving = next.data.ignition && (next.data.speed ?? 0) > 0;
      if (nextIsMoving && next.data.recorded_at) {
        const nextTime = new Date(next.data.recorded_at).getTime();
        return formatDuration(nextTime - currentTime);
      }
    } else {
      // A stopped group follows — use its start time
      if (next.startTime) {
        const nextTime = new Date(next.startTime).getTime();
        return formatDuration(nextTime - currentTime);
      }
    }
  }

  return 'Parado';
}

export function buildReportRows(
  points: VehicleTrackingData[],
  addressMap: Map<string, string>
): ReportRow[] {
  const items = groupStoppedPoints(points);

  return items.map((item, index) => {
    if (item.type === 'stopped-group') {
      const startStr = item.startTime
        ? format(new Date(item.startTime), 'dd/MM/yyyy HH:mm:ss')
        : '?';
      const endStr = item.endTime
        ? format(new Date(item.endTime), 'dd/MM/yyyy HH:mm:ss')
        : '?';
      return {
        data: `Parado de ${startStr} às ${endStr}`,
        velocidade: '0 km/h',
        ignicao: item.ignition ? 'Ligado' : 'Desligado',
        tempoParada: calculateStopTimeForItem(items, index),
        endereco: getAddress(item.latitude, item.longitude, addressMap),
      };
    }

    const point = item.data;
    return {
      data: point.recorded_at
        ? format(new Date(point.recorded_at), 'dd/MM/yyyy HH:mm:ss')
        : '-',
      velocidade: `${Math.round(point.speed ?? 0)} km/h`,
      ignicao: point.ignition ? 'Ligado' : 'Desligado',
      tempoParada: calculateStopTimeForItem(items, index),
      endereco: getAddress(point.latitude, point.longitude, addressMap),
    };
  });
}
