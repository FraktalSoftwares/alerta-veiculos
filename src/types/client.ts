import { Database } from '@/integrations/supabase/types';

// UI display type (for table)
export interface ClientDisplay {
  id: string;
  type: 'CLIENTE' | 'ASSOCIADO' | 'FRANQUEADO' | 'FROTISTA' | 'MOTORISTA';
  name: string;
  totalVehicles: number;
  trackedVehicles: number;
  noSignal: number;
  offline: number;
  lastUpdate: string;
  status: 'ATIVO' | 'INATIVO' | 'BLOQUEADO';
  // Extended fields for editing
  document_type?: string | null;
  document_number?: string | null;
  phone?: string | null;
  email?: string | null;
  client_type?: string;
}

// Extended client type with relationships
export interface ClientWithDetails {
  id: string;
  owner_id: string;
  parent_client_id: string | null;
  user_id: string | null;
  name: string;
  document_type: string | null;
  document_number: string | null;
  phone: string | null;
  email: string | null;
  birth_date: string | null;
  client_type: 'admin' | 'associacao' | 'franqueado' | 'frotista' | 'motorista';
  status: string | null;
  created_at: string;
  updated_at: string;
  addresses?: any[];
  secondary_contacts?: any[];
  billing_settings?: any;
  vehicles_count?: number;
  tracked_count?: number;
  no_signal_count?: number;
  offline_count?: number;
  vehicles_last_update?: string | null;
}

// Form types
export interface ClientFormData {
  name: string;
  document_type: 'cpf' | 'cnpj';
  document_number: string;
  phone: string;
  email: string;
  birth_date?: string;
  client_type: 'associacao' | 'franqueado' | 'frotista' | 'motorista';
  status: 'active' | 'inactive' | 'blocked';
  parent_client_id?: string;
}

// Utility functions
export function mapClientToDisplay(client: ClientWithDetails): ClientDisplay {
  const typeMap: Record<string, ClientDisplay['type']> = {
    'admin': 'CLIENTE',
    'associacao': 'ASSOCIADO',
    'franqueado': 'FRANQUEADO',
    'frotista': 'FROTISTA',
    'motorista': 'MOTORISTA',
  };

  const statusMap: Record<string, ClientDisplay['status']> = {
    'active': 'ATIVO',
    'inactive': 'INATIVO',
    'blocked': 'BLOQUEADO',
  };

  return {
    id: client.id,
    type: typeMap[client.client_type] || 'CLIENTE',
    name: client.name,
    totalVehicles: client.vehicles_count || 0,
    trackedVehicles: client.tracked_count || 0,
    noSignal: client.no_signal_count || 0,
    offline: client.offline_count || 0,
    lastUpdate: client.vehicles_last_update 
      ? new Date(client.vehicles_last_update).toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : client.updated_at 
      ? new Date(client.updated_at).toLocaleDateString('pt-BR')
      : '-',
    status: statusMap[client.status || 'active'] || 'ATIVO',
    // Extended fields
    document_type: client.document_type,
    document_number: client.document_number,
    phone: client.phone,
    email: client.email,
    client_type: client.client_type,
  };
}
