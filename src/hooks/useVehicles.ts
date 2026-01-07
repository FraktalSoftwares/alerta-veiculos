import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { VehicleWithDetails, VehicleFormData, mapVehicleToDisplay, VehicleDisplay } from '@/types/vehicle';
import { toast } from 'sonner';

interface UseVehiclesOptions {
  search?: string;
  status?: string;
  clientId?: string;
  page?: number;
  pageSize?: number;
}

export function useVehicles(options: UseVehiclesOptions = {}) {
  const { user } = useAuth();
  const { search = '', status, clientId, page = 1, pageSize = 100 } = options;

  return useQuery({
    queryKey: ['vehicles', { search, status, clientId, page, pageSize, userId: user?.id }],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('vehicles')
        .select(`
          *,
          clients!inner(id, name, phone),
          equipment(id, serial_number, imei, chip_operator)
        `, { count: 'exact' });

      if (search) {
        query = query.or(`plate.ilike.%${search}%,clients.name.ilike.%${search}%`);
      }

      if (status) {
        query = query.eq('status', status as 'active' | 'inactive' | 'blocked' | 'maintenance' | 'no_signal');
      }

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to).order('plate', { ascending: true });

      const { data, error, count } = await query;

      if (error) throw error;

      const vehicles: VehicleDisplay[] = (data || []).map((vehicle) =>
        mapVehicleToDisplay(vehicle as VehicleWithDetails)
      );

      return {
        vehicles,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
    enabled: !!user,
  });
}

export function useVehicle(vehicleId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: async () => {
      if (!vehicleId) throw new Error('Vehicle ID required');

      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          clients(id, name),
          equipment(id, serial_number, imei, chip_operator, model, products(id, title, model))
        `)
        .eq('id', vehicleId)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Vehicle not found');

      return data as VehicleWithDetails;
    },
    enabled: !!user && !!vehicleId,
  });
}

export function useClientVehicles(clientId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['client-vehicles', clientId],
    queryFn: async () => {
      if (!clientId) throw new Error('Client ID required');

      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          clients(id, name),
          equipment(id, serial_number, imei, chip_operator)
        `)
        .eq('client_id', clientId)
        .order('plate', { ascending: true });

      if (error) throw error;

      return (data || []).map((vehicle) =>
        mapVehicleToDisplay(vehicle as VehicleWithDetails)
      );
    },
    enabled: !!user && !!clientId,
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: VehicleFormData) => {
      const { data, error } = await supabase
        .from('vehicles')
        .insert({
          client_id: formData.client_id,
          plate: formData.plate,
          vehicle_type: formData.vehicle_type || null,
          brand: formData.brand || null,
          model: formData.model || null,
          year: formData.year || null,
          color: formData.color || null,
          chassis: formData.chassis || null,
          renavam: formData.renavam || null,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['client-vehicles'] });
      toast.success('Veículo cadastrado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao cadastrar veículo: ${error.message}`);
    },
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<VehicleFormData> }) => {
      const { data: result, error } = await supabase
        .from('vehicles')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['client-vehicles'] });
      toast.success('Veículo atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar veículo: ${error.message}`);
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('vehicles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['client-vehicles'] });
      toast.success('Veículo excluído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir veículo: ${error.message}`);
    },
  });
}

export function useBlockVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, block }: { id: string; block: boolean }) => {
      const { data, error } = await supabase
        .from('vehicles')
        .update({ status: block ? 'blocked' : 'active' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', variables.id] });
      toast.success(variables.block ? 'Veículo bloqueado!' : 'Veículo desbloqueado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
}
