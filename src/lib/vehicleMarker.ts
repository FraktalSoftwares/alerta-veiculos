import carroSuccess from '@/assets/marker_carro_success.png';
import motoSuccess from '@/assets/marker_moto_success.png';
import paradaWarning from '@/assets/marker_parada_warning.png';
import paradaDanger from '@/assets/marker_parada_danger.png';

interface MarkerInput {
  vehicleType?: string | null;
  speed?: number | null;
  ignition?: boolean | null;
  /** Timestamp do último sinal (recorded_at). Base da regra de 8h. */
  recordedAt?: string | Date | null;
}

/** Janela para considerar o sinal "recente" (8 horas). */
export const SIGNAL_WINDOW_MS = 8 * 60 * 60 * 1000;

/**
 * Escolhe o PIN do veículo pela regra de SINAL:
 * - Em movimento (vel > 0) e sinal recente -> carro/moto (verde) = rastreando
 * - Parado com sinal nas últimas 8h        -> parada laranja (amarelo)
 * - Último sinal há mais de 8h             -> parada vermelha = sem sinal
 */
export function vehicleMarkerPin({ vehicleType, speed, recordedAt }: MarkerInput): string {
  const isMoto = (vehicleType || '').toLowerCase().includes('moto');

  const ts = recordedAt ? new Date(recordedAt).getTime() : NaN;
  const stale = Number.isNaN(ts) || Date.now() - ts > SIGNAL_WINDOW_MS;
  if (stale) return paradaDanger; // > 8h sem sinal

  const moving = (speed ?? 0) > 0;
  if (moving) return isMoto ? motoSuccess : carroSuccess; // rastreando
  return paradaWarning; // parado, mas com sinal recente
}

/** Dimensões originais do PIN (px). */
export const PIN_SIZE = { w: 30, h: 45 };
