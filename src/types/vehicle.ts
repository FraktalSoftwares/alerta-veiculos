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
}

// Extended vehicle type with relationships
export interface VehicleWithDetails extends VehicleRow {
  clients?: {
    id: string;
    name: string;
    phone?: string | null;
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
  };
}
