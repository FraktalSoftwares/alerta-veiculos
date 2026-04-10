import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ClientWithDetails, ClientFormData, mapClientToDisplay, ClientDisplay } from '@/types/client';
import { toast } from 'sonner';

interface UseClientsOptions {
  search?: string;
  status?: string;
  clientType?: string;
  page?: number;
  pageSize?: number;
  dateFrom?: string;
  dateTo?: string;
  parentClientId?: string;
}

export function useClients(options: UseClientsOptions = {}) {
  const { user, profile } = useAuth();
  const { search = '', status, clientType, page = 1, pageSize = 100, dateFrom, dateTo, parentClientId } = options;

  return useQuery({
    queryKey: ['clients', { search, status, clientType, page, pageSize, dateFrom, dateTo, parentClientId, userId: user?.id, userType: profile?.user_type }],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('clients')
        .select(`*`, { count: 'exact' });

      // Exclude the logged-in user's own client record
      query = query.or(`user_id.is.null,user_id.neq.${user.id}`);

      if (search) {
        query = query.or(`name.ilike.%${search}%,id::text.ilike.${search}%`);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (clientType) {
        query = query.eq('client_type', clientType as 'admin' | 'associacao' | 'associado' | 'franquia' | 'franqueado' | 'frotista' | 'motorista');
      }

      // Admin vê apenas clientes de nível superior (sem parent) na listagem principal
      if (!parentClientId && !clientType && profile?.user_type === 'admin') {
        query = query.is('parent_client_id', null);
      }

      if (parentClientId) {
        query = query.eq('parent_client_id', parentClientId);
      }

      // Filter by last update date range
      if (dateFrom) {
        query = query.gte('updated_at', `${dateFrom}T00:00:00`);
      }
      if (dateTo) {
        query = query.lte('updated_at', `${dateTo}T23:59:59`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to).order('name', { ascending: true });

      const { data, error, count } = await query;

      if (error) throw error;

      // Buscar estatísticas dos veículos para cada cliente
      const clientIds = (data || []).map(client => client.id);

      // Identificar clientes-pai (associação, franquia, frotista) para agregar veículos dos sub-clientes
      const PARENT_TYPES = ['admin', 'associacao', 'franquia', 'frotista'];
      const parentClientIds = (data || [])
        .filter(c => PARENT_TYPES.includes(c.client_type))
        .map(c => c.id);

      // Buscar sub-clientes dos clientes-pai
      const subClientToParent = new Map<string, string>();
      if (parentClientIds.length > 0) {
        const { data: subClients, error: subError } = await supabase
          .from('clients')
          .select('id, parent_client_id')
          .in('parent_client_id', parentClientIds);

        if (subError) throw subError;

        (subClients || []).forEach(sc => {
          if (sc.parent_client_id) {
            subClientToParent.set(sc.id, sc.parent_client_id);
          }
        });
      }

      // IDs de todos os clientes cujos veículos precisamos buscar
      const allClientIds = [...new Set([...clientIds, ...subClientToParent.keys()])];

      let vehiclesData: any[] = [];

      if (allClientIds.length > 0) {
        let vehicleStatsQuery = supabase
          .from('vehicles')
          .select('client_id, status, last_update, equipment(imei)')
          .in('client_id', allClientIds);

        const { data: vehicles, error: vehiclesError } = await vehicleStatsQuery;

        if (vehiclesError) throw vehiclesError;
        vehiclesData = vehicles || [];
      }

      // Agregar estatísticas por cliente e coletar IMEIs
      const statsByClient = new Map<string, {
        total: number;
        tracked: number;
        noSignal: number;
        offline: number;
        blocked: number;
        lastUpdate: string | null;
      }>();

      const imeisByClient = new Map<string, string[]>();

      const addVehicleToStats = (targetClientId: string, vehicle: any) => {
        if (!statsByClient.has(targetClientId)) {
          statsByClient.set(targetClientId, {
            total: 0,
            tracked: 0,
            noSignal: 0,
            offline: 0,
            blocked: 0,
            lastUpdate: null,
          });
        }
        if (!imeisByClient.has(targetClientId)) {
          imeisByClient.set(targetClientId, []);
        }

        const stats = statsByClient.get(targetClientId)!;
        stats.total++;

        if (vehicle.status === 'active') {
          stats.tracked++;
        } else if (vehicle.status === 'no_signal') {
          stats.noSignal++;
        } else if (vehicle.status === 'inactive' || vehicle.status === 'maintenance') {
          stats.offline++;
        } else if (vehicle.status === 'blocked') {
          stats.blocked++;
        }

        const equipment = vehicle.equipment;
        if (Array.isArray(equipment)) {
          equipment.forEach((eq: any) => {
            if (eq.imei) {
              imeisByClient.get(targetClientId)!.push(eq.imei);
            }
          });
        }

        if (vehicle.last_update) {
          if (!stats.lastUpdate || new Date(vehicle.last_update) > new Date(stats.lastUpdate)) {
            stats.lastUpdate = vehicle.last_update;
          }
        }
      };

      (vehiclesData || []).forEach(vehicle => {
        const vehicleClientId = vehicle.client_id;

        // Se o veículo pertence a um cliente que está na lista, agregar diretamente
        if (clientIds.includes(vehicleClientId)) {
          addVehicleToStats(vehicleClientId, vehicle);
        }

        // Se o veículo pertence a um sub-cliente, agregar também no cliente-pai
        const parentId = subClientToParent.get(vehicleClientId);
        if (parentId) {
          addVehicleToStats(parentId, vehicle);
        }
      });

      // Mapear clientes com suas estatísticas
      const clients: ClientDisplay[] = (data || []).map((client) => {
        const stats = statsByClient.get(client.id) || {
          total: 0,
          tracked: 0,
          noSignal: 0,
          offline: 0,
          blocked: 0,
          lastUpdate: null,
        };

        return mapClientToDisplay({
          ...client as ClientWithDetails,
          vehicles_count: stats.total,
          tracked_count: stats.tracked,
          no_signal_count: stats.noSignal,
          offline_count: stats.offline,
          vehicles_last_update: stats.lastUpdate,
        });
      });

      // Construir mapa de IMEIs por cliente
      const clientImeis: Record<string, string[]> = {};
      imeisByClient.forEach((imeis, clientId) => {
        clientImeis[clientId] = imeis;
      });

      return {
        clients,
        clientImeis,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
    enabled: !!user,
  });
}

export function useClient(clientId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      if (!clientId) throw new Error('Client ID required');

      const { data, error } = await supabase
        .from('clients')
        .select(`*, addresses(*), secondary_contacts(*), billing_settings(*)`)
        .eq('id', clientId)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Client not found');

      return data as ClientWithDetails;
    },
    enabled: !!user && !!clientId,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (formData: ClientFormData) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('clients')
        .insert({
          owner_id: user.id,
          name: formData.name,
          document_type: formData.document_type,
          document_number: formData.document_number,
          phone: formData.phone,
          email: formData.email,
          birth_date: formData.birth_date || null,
          client_type: formData.client_type,
          status: formData.status,
          parent_client_id: formData.parent_client_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar cliente: ${error.message}`);
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ClientFormData> }) => {
      const { data: result, error } = await supabase
        .from('clients')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', variables.id] });
      toast.success('Cliente atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar cliente: ${error.message}`);
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente excluído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir cliente: ${error.message}`);
    },
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, data }: { clientId: string; data: any }) => {
      const { data: result, error } = await supabase
        .from('addresses')
        .insert({ client_id: clientId, ...data })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client', variables.clientId] });
      toast.success('Endereço salvo!');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, clientId, data }: { id: string; clientId: string; data: any }) => {
      const { data: result, error } = await supabase.from('addresses').update(data).eq('id', id).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client', variables.clientId] });
      toast.success('Endereço atualizado!');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useCreateSecondaryContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, data }: { clientId: string; data: any }) => {
      const { data: result, error } = await supabase.from('secondary_contacts').insert({ client_id: clientId, ...data }).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client', variables.clientId] });
      toast.success('Contato salvo!');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpsertBillingSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, data }: { clientId: string; data: any }) => {
      const { data: result, error } = await supabase.from('billing_settings').upsert({ client_id: clientId, ...data }, { onConflict: 'client_id' }).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client', variables.clientId] });
      toast.success('Configurações salvas!');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
