import carroSuccess from '@/assets/marker_carro_success.png';
import motoSuccess from '@/assets/marker_moto_success.png';
import paradaSuccess from '@/assets/marker_parada_success.png';
import paradaDanger from '@/assets/marker_parada_danger.png';

interface MarkerInput {
  vehicleType?: string | null;
  speed?: number | null;
  ignition?: boolean | null;
  /** Timestamp do último sinal (recorded_at). Base da regra de 7h. */
  recordedAt?: string | Date | null;
}

/** Janela para considerar o sinal "recente" (7 horas) — usada na lista e no PIN do mapa. */
export const SIGNAL_WINDOW_MS = 7 * 60 * 60 * 1000;

/**
 * Escolhe o PIN do veículo pela regra de SINAL:
 * - Em movimento (vel > 0) e sinal recente -> carro/moto (verde) = rastreando
 * - Parado com sinal recente               -> parada verde (rastreando, parado)
 * - Último sinal há mais de 7h             -> parada vermelha = sem sinal
 */
export function vehicleMarkerPin({ vehicleType, speed, recordedAt }: MarkerInput): string {
  const isMoto = (vehicleType || '').toLowerCase().includes('moto');

  const ts = recordedAt ? new Date(recordedAt).getTime() : NaN;
  const stale = Number.isNaN(ts) || Date.now() - ts > SIGNAL_WINDOW_MS;
  if (stale) return paradaDanger; // > 7h sem sinal

  const moving = (speed ?? 0) > 0;
  if (moving) return isMoto ? motoSuccess : carroSuccess; // rastreando (em movimento)
  return paradaSuccess; // rastreando, mas parado (com sinal recente)
}

/**
 * Status do veículo na LISTA (Gestão de Veículos). 3 categorias = 3 cores do
 * ícone de STATUS; o badge de SITUAÇÃO colapsa em 2 (Rastreando / Desligado).
 * REGRA: só fica DESLIGADO quando passa +7h SEM RECEBER SINAL. Recebendo sinal
 * (<7h), é sempre Rastreando — a ignição só muda a COR do ícone:
 * - 'rastreando' (verde)    -> sinal recente (<7h) e ignição LIGADA    -> SITUAÇÃO: RASTREANDO
 * - 'ocioso'     (amarelo)  -> sinal recente (<7h) e ignição DESLIGADA -> SITUAÇÃO: RASTREANDO
 * - 'sem-sinal'  (vermelho) -> sem sinal há mais de 7h                  -> SITUAÇÃO: DESLIGADO
 * O bloqueio NÃO entra aqui — é sinalizado à parte pelo cadeado na placa.
 */
export type VehicleListStatus = 'rastreando' | 'ocioso' | 'sem-sinal';

export function vehicleListStatus({
  ignition,
  recordedAt,
}: {
  ignition?: boolean | null;
  recordedAt?: string | Date | null;
}): VehicleListStatus {
  const ts = recordedAt ? new Date(recordedAt).getTime() : NaN;
  const stale = Number.isNaN(ts) || Date.now() - ts > SIGNAL_WINDOW_MS;
  if (stale) return 'sem-sinal';
  return ignition ? 'rastreando' : 'ocioso';
}

/** Dimensões originais do PIN (px). */
export const PIN_SIZE = { w: 30, h: 45 };
