import { Database } from '@/integrations/supabase/types';

export type VehicleRow = Database['public']['Tables']['vehicles']['Row'];
export type VehicleStatus = Database['public']['Enums']['vehicle_status'];

// UI display type (for table)
export interface VehicleDisplay {
  id: string;
  clientId: string;
  clientName: string;
  type: string;
  imei: string;
  plate: string;
  tracker: string;
  operator: string;
  status: 'rastreando' | 'desligado' | 'sem-sinal' | 'bloqueado';
  brand: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  lastUpdate: string;
  /** Velocidade da última posição (km/h) — regra de status. */
  speed: number | null;
  /** Ignição da última posição. */
  ignition: boolean | null;
  /** Timestamp cru do último sinal (last_update) — regra de 8h. */
  lastSignalAt: string | null;
}

// Extended vehicle type with relationships
export interface VehicleWithDetails extends VehicleRow {
  clients?: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    document_type?: string | null;
    document_number?: string | null;
    addresses?: {
      id: string;
      street?: string | null;
      number?: string | null;
      complement?: string | null;
      neighborhood?: string | null;
      city?: string | null;
      state?: string | null;
      zip_code?: string | null;
      is_primary?: boolean | null;
    }[];
  };
  equipment?: {
    id: string;
    serial_number: string;
    imei: string | null;
    chip_operator: string | null;
    model?: string | null;
    products?: {
      id: string;
      title: string;
      model: string | null;
    } | null;
  }[];
}

// Form types
export interface VehicleFormData {
  client_id: string;
  plate: string;
  vehicle_type?: string | null;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  color?: string | null;
  chassis?: string | null;
  renavam?: string | null;
  status?: 'active' | 'inactive' | 'blocked' | 'maintenance' | 'no_signal';
}

// Map DB status to UI status
export function mapVehicleStatus(status: VehicleStatus | null): VehicleDisplay['status'] {
  const statusMap: Record<VehicleStatus, VehicleDisplay['status']> = {
    'active': 'rastreando',
    'inactive': 'desligado',
    'blocked': 'bloqueado',
    'maintenance': 'desligado',
    'no_signal': 'sem-sinal',
  };
  return statusMap[status || 'active'] || 'rastreando';
}

// Utility function
export function mapVehicleToDisplay(vehicle: VehicleWithDetails): VehicleDisplay {
  const equipment = vehicle.equipment?.[0];

  // last_location é mantido pelo trigger: { lat, lng, speed, ignition, heading }
  const loc = (vehicle.last_location ?? null) as {
    speed?: number | null;
    ignition?: boolean | null;
  } | null;
  const speed = typeof loc?.speed === 'number' ? loc.speed : null;
  const ignition = typeof loc?.ignition === 'boolean' ? loc.ignition : null;

  return {
    id: vehicle.id,
    clientId: vehicle.client_id,
    clientName: vehicle.clients?.name || 'Cliente desconhecido',
    type: vehicle.vehicle_type || 'Veículo',
    imei: equipment?.imei || '-',
    plate: vehicle.plate,
    tracker: equipment?.serial_number || '-',
    operator: equipment?.chip_operator || '-',
    status: mapVehicleStatus(vehicle.status),
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    color: vehicle.color,
    lastUpdate: vehicle.last_update
      ? new Date(vehicle.last_update).toLocaleDateString('pt-BR')
      : '-',
    speed,
    ignition,
    lastSignalAt: vehicle.last_update ?? null,
  };
}
