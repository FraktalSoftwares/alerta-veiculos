import carroSuccess from '@/assets/marker_carro_success.png';
import motoSuccess from '@/assets/marker_moto_success.png';
import paradaSuccess from '@/assets/marker_parada_success.png';
import paradaWarning from '@/assets/marker_parada_warning.png';
import paradaDanger from '@/assets/marker_parada_danger.png';

interface MarkerInput {
  vehicleType?: string | null;
  speed?: number | null;
  ignition?: boolean | null;
}

/**
 * Escolhe o PIN do veículo pela regra de ignição/status:
 * - Em movimento (vel > 0)      -> carro/moto (verde)
 * - Parado + ignição LIGADA     -> parada laranja (warning)
 * - Parado + ignição DESLIGADA  -> parada verde (success)
 * - Sem sinal (sem dado de ign.) -> parada vermelha (danger)
 */
export function vehicleMarkerPin({ vehicleType, speed, ignition }: MarkerInput): string {
  const isMoto = (vehicleType || '').toLowerCase().includes('moto');
  const moving = (speed ?? 0) > 0;

  if (moving) return isMoto ? motoSuccess : carroSuccess;
  if (ignition == null) return paradaDanger; // sem sinal / sem dado
  if (ignition) return paradaWarning; // parado, ligado
  return paradaSuccess; // parado, desligado
}

/** Dimensões originais do PIN (px). */
export const PIN_SIZE = { w: 30, h: 45 };
