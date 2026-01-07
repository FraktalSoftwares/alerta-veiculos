import { Database } from '@/integrations/supabase/types';

export type EquipmentRow = Database['public']['Tables']['equipment']['Row'];
export type EquipmentStatus = Database['public']['Enums']['equipment_status'];

// UI display type (for table)
export interface EquipmentDisplay {
  id: string;
  name: string;
  model: string;
  imei: string;
  line: string;
  modality: string;
  status: 'funcionando' | 'manutencao' | 'inativo' | 'defeito' | 'na_loja';
  serialNumber: string;
  chipNumber: string | null;
  chipOperator: string | null;
  vehicleId: string | null;
  dbStatus?: EquipmentStatus | null;
}

// Extended equipment type with relationships
export interface EquipmentWithDetails extends EquipmentRow {
  products?: {
    id: string;
    title: string;
    model: string | null;
  } | null;
  vehicles?: {
    id: string;
    plate: string;
    clients?: {
      id: string;
      name: string;
    };
  } | null;
}

// Form types
export interface EquipmentFormData {
  serial_number: string;
  imei?: string;
  chip_number?: string;
  chip_operator?: string;
  model?: string;
  product_id?: string;
  vehicle_id?: string;
  status?: EquipmentStatus;
}

// Map DB status to UI status
export function mapEquipmentStatus(status: EquipmentStatus | null): EquipmentDisplay['status'] {
  const statusMap: Record<EquipmentStatus, EquipmentDisplay['status']> = {
    'available': 'funcionando',
    'installed': 'funcionando',
    'maintenance': 'manutencao',
    'defective': 'defeito',
    'in_store': 'na_loja',
  };
  return statusMap[status || 'available'] || 'funcionando';
}

// Utility function
export function mapEquipmentToDisplay(equipment: EquipmentWithDetails): EquipmentDisplay {
  // Determine modality based on status
  let modality = 'Disponível';
  if (equipment.vehicle_id) {
    modality = 'Instalado';
  } else if (equipment.status === 'in_store') {
    modality = 'Na Loja';
  }

  return {
    id: equipment.id,
    name: equipment.products?.title || 'Rastreador GPS',
    model: equipment.model || equipment.products?.model || equipment.serial_number,
    imei: equipment.imei || '-',
    line: equipment.chip_operator || '-',
    modality,
    status: mapEquipmentStatus(equipment.status),
    serialNumber: equipment.serial_number,
    chipNumber: equipment.chip_number,
    chipOperator: equipment.chip_operator,
    vehicleId: equipment.vehicle_id,
    dbStatus: equipment.status,
  };
}
