import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { EquipmentWithDetails, EquipmentFormData, mapEquipmentToDisplay, EquipmentDisplay } from '@/types/equipment';
import { toast } from 'sonner';

interface UseEquipmentOptions {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export function useEquipments(options: UseEquipmentOptions = {}) {
  const { user } = useAuth();
  const { search = '', status, page = 1, pageSize = 100 } = options;

  return useQuery({
    queryKey: ['equipment', { search, status, page, pageSize, userId: user?.id }],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('equipment')
        .select(`
          *,
          products(id, title, model),
          vehicles(id, plate, clients(id, name))
        `, { count: 'exact' });

      if (search) {
        query = query.or(`serial_number.ilike.%${search}%,imei.ilike.%${search}%`);
      }

      if (status) {
        query = query.eq('status', status as 'available' | 'installed' | 'maintenance' | 'defective');
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      const equipments: EquipmentDisplay[] = (data || []).map((equipment) =>
        mapEquipmentToDisplay(equipment as EquipmentWithDetails)
      );

      return {
        equipments,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
    enabled: !!user,
  });
}

export function useEquipment(equipmentId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['equipment', equipmentId],
    queryFn: async () => {
      if (!equipmentId) throw new Error('Equipment ID required');

      const { data, error } = await supabase
        .from('equipment')
        .select(`
          *,
          products(id, title, model),
          vehicles(id, plate, clients(id, name))
        `)
        .eq('id', equipmentId)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Equipment not found');

      return data as EquipmentWithDetails;
    },
    enabled: !!user && !!equipmentId,
  });
}

export function useCreateEquipment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (formData: EquipmentFormData) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('equipment')
        .insert({
          owner_id: user.id,
          serial_number: formData.serial_number,
          imei: formData.imei || null,
          chip_number: formData.chip_number || null,
          chip_operator: formData.chip_operator || null,
          model: formData.model || null,
          product_id: formData.product_id || null,
          vehicle_id: formData.vehicle_id || null,
          status: formData.status || 'available',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('Equipamento cadastrado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao cadastrar equipamento: ${error.message}`);
    },
  });
}

export function useUpdateEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EquipmentFormData> }) => {
      const { data: result, error } = await supabase
        .from('equipment')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['equipment', variables.id] });
      toast.success('Equipamento atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar equipamento: ${error.message}`);
    },
  });
}

export function useDeleteEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('equipment').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('Equipamento excluído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir equipamento: ${error.message}`);
    },
  });
}

// Hook para buscar equipamentos disponíveis para vincular a veículos
export function useAvailableEquipments(search: string = '') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['available-equipment', search, user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('equipment')
        .select(`
          id,
          serial_number,
          imei,
          chip_operator,
          products(id, title, model)
        `)
        .eq('status', 'available')
        .is('vehicle_id', null);

      if (search) {
        query = query.or(`serial_number.ilike.%${search}%,imei.ilike.%${search}%`);
      }

      query = query.order('created_at', { ascending: false }).limit(20);

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    },
    enabled: !!user,
  });
}

// Hook para vincular equipamento a veículo
export function useLinkEquipmentToVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ equipmentId, vehicleId }: { equipmentId: string; vehicleId: string }) => {
      const { data, error } = await supabase
        .from('equipment')
        .update({ 
          vehicle_id: vehicleId, 
          status: 'installed' 
        })
        .eq('id', equipmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['available-equipment'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Rastreador vinculado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao vincular rastreador: ${error.message}`);
    },
  });
}

// Hook para desvincular equipamento de veículo
export function useUnlinkEquipmentFromVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (equipmentId: string) => {
      const { data, error } = await supabase
        .from('equipment')
        .update({ 
          vehicle_id: null, 
          status: 'available' 
        })
        .eq('id', equipmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['available-equipment'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle'] });
      toast.success('Rastreador desvinculado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao desvincular rastreador: ${error.message}`);
    },
  });
}

// Hook para buscar equipamentos disponíveis para vincular a produtos na loja
export function useAvailableEquipmentsForStore(search: string = '') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['available-equipment-store', search, user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('equipment')
        .select(`
          id,
          serial_number,
          imei,
          chip_number,
          chip_operator,
          products(id, title, model)
        `)
        .eq('status', 'available')
        .is('vehicle_id', null);

      if (search) {
        query = query.or(`serial_number.ilike.%${search}%,imei.ilike.%${search}%`);
      }

      query = query.order('created_at', { ascending: false }).limit(50);

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    },
    enabled: !!user,
  });
}

// Hook para vincular equipamento a produto na loja (muda status para in_store)
export function useLinkEquipmentToStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ equipmentId, productId }: { equipmentId: string; productId: string }) => {
      const { data, error } = await supabase
        .from('equipment')
        .update({ 
          product_id: productId, 
          status: 'in_store' as const
        })
        .eq('id', equipmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['available-equipment-store'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Rastreador vinculado ao produto na loja!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao vincular rastreador: ${error.message}`);
    },
  });
}
