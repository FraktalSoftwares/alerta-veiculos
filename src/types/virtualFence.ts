import { Database } from '@/integrations/supabase/types';

export type VirtualFenceRow = Database['public']['Tables']['virtual_fences']['Row'];

/**
 * Cerca virtual completa com relacionamentos
 */
export interface VirtualFenceWithDetails extends VirtualFenceRow {
  equipment?: {
    id: string;
    imei: string | null;
    serial_number: string;
    products?: {
      model: string | null;
    } | null;
  };
}

/**
 * Dados para criar/editar uma cerca virtual
 */
export interface VirtualFenceFormData {
  equipment_id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // em metros
  speed_limit?: number | null; // em km/h
  is_primary: boolean;
  notify_on_enter: boolean;
  notify_on_exit: boolean;
}

/**
 * Dados para exibição na UI
 */
export interface VirtualFenceDisplay {
  id: string;
  equipmentId: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  speedLimit: number | null;
  isPrimary: boolean;
  notifyOnEnter: boolean;
  notifyOnExit: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Mapeia dados do banco para exibição
 */
export function mapVirtualFenceToDisplay(fence: VirtualFenceWithDetails): VirtualFenceDisplay {
  return {
    id: fence.id,
    equipmentId: fence.equipment_id,
    name: fence.name,
    latitude: Number(fence.latitude),
    longitude: Number(fence.longitude),
    radius: fence.radius,
    speedLimit: fence.speed_limit,
    isPrimary: fence.is_primary,
    notifyOnEnter: fence.notify_on_enter,
    notifyOnExit: fence.notify_on_exit,
    createdAt: fence.created_at,
    updatedAt: fence.updated_at,
  };
}

