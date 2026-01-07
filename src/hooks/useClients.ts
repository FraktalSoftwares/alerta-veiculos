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
}

export function useClients(options: UseClientsOptions = {}) {
  const { user } = useAuth();
  const { search = '', status, clientType, page = 1, pageSize = 100 } = options;

  return useQuery({
    queryKey: ['clients', { search, status, clientType, page, pageSize, userId: user?.id }],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('clients')
        .select(`*`, { count: 'exact' });

      if (search) {
        query = query.or(`name.ilike.%${search}%,document_number.ilike.%${search}%`);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (clientType) {
        query = query.eq('client_type', clientType as 'admin' | 'associacao' | 'franqueado' | 'frotista' | 'motorista');
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to).order('name', { ascending: true });

      const { data, error, count } = await query;

      if (error) throw error;

      // Buscar estatísticas dos veículos para cada cliente
      const clientIds = (data || []).map(client => client.id);
      
      let vehiclesData: any[] = [];
      
      if (clientIds.length > 0) {
        let vehicleStatsQuery = supabase
          .from('vehicles')
          .select('client_id, status, last_update')
          .in('client_id', clientIds);

        const { data: vehicles, error: vehiclesError } = await vehicleStatsQuery;

        if (vehiclesError) throw vehiclesError;
        vehiclesData = vehicles || [];
      }

      // Agregar estatísticas por cliente
      const statsByClient = new Map<string, {
        total: number;
        tracked: number;
        noSignal: number;
        offline: number;
        lastUpdate: string | null;
      }>();

      (vehiclesData || []).forEach(vehicle => {
        const clientId = vehicle.client_id;
        if (!statsByClient.has(clientId)) {
          statsByClient.set(clientId, {
            total: 0,
            tracked: 0,
            noSignal: 0,
            offline: 0,
            lastUpdate: null,
          });
        }

        const stats = statsByClient.get(clientId)!;
        stats.total++;

        if (vehicle.status === 'active') {
          stats.tracked++;
        } else if (vehicle.status === 'no_signal') {
          stats.noSignal++;
        } else if (vehicle.status === 'inactive' || vehicle.status === 'maintenance') {
          stats.offline++;
        }

        // Atualizar última atualização (mais recente)
        if (vehicle.last_update) {
          if (!stats.lastUpdate || new Date(vehicle.last_update) > new Date(stats.lastUpdate)) {
            stats.lastUpdate = vehicle.last_update;
          }
        }
      });

      // Mapear clientes com suas estatísticas
      const clients: ClientDisplay[] = (data || []).map((client) => {
        const stats = statsByClient.get(client.id) || {
          total: 0,
          tracked: 0,
          noSignal: 0,
          offline: 0,
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

      return {
        clients,
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
