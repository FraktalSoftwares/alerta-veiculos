import { format } from 'date-fns';
import { VehicleTrackingData } from '@/hooks/useVehicleTracking';
import { getAddress } from '@/utils/geocoding';

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

function calculateStopTime(
  points: VehicleTrackingData[],
  currentIndex: number
): string {
  const current = points[currentIndex];
  const isMoving = current.ignition && (current.speed ?? 0) > 0;

  if (isMoving) return 'Movimento';

  const currentTime = current.recorded_at ? new Date(current.recorded_at).getTime() : 0;
  if (!currentTime) return '-';

  for (let i = currentIndex + 1; i < points.length; i++) {
    const next = points[i];
    const nextIsMoving = next.ignition && (next.speed ?? 0) > 0;
    if (nextIsMoving && next.recorded_at) {
      const nextTime = new Date(next.recorded_at).getTime();
      return formatDuration(nextTime - currentTime);
    }
  }

  const lastPoint = points[points.length - 1];
  if (lastPoint.recorded_at && currentIndex < points.length - 1) {
    const lastTime = new Date(lastPoint.recorded_at).getTime();
    return formatDuration(lastTime - currentTime);
  }

  return 'Parado';
}

export function buildReportRows(
  points: VehicleTrackingData[],
  addressMap: Map<string, string>
): ReportRow[] {
  return points.map((point, index) => ({
    data: point.recorded_at
      ? format(new Date(point.recorded_at), 'dd/MM/yyyy HH:mm:ss')
      : '-',
    velocidade: `${Math.round(point.speed ?? 0)} km/h`,
    ignicao: point.ignition ? 'Ligado' : 'Desligado',
    tempoParada: calculateStopTime(points, index),
    endereco: getAddress(point.latitude, point.longitude, addressMap),
  }));
}
