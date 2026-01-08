import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { VirtualFenceWithDetails, VirtualFenceFormData, mapVirtualFenceToDisplay, VirtualFenceDisplay } from '@/types/virtualFence';
import { trackingApiClient } from '@/integrations/tracking-api/client';
import { useEquipment } from '@/hooks/useEquipment';

/**
 * Hook para listar cercas virtuais de um equipamento
 */
export function useVirtualFences(equipmentId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['virtual-fences', equipmentId],
    queryFn: async (): Promise<VirtualFenceDisplay[]> => {
      if (!equipmentId) return [];

      const { data, error } = await supabase
        .from('virtual_fences')
        .select(`
          *,
          equipment(id, imei, serial_number, products(model))
        `)
        .eq('equipment_id', equipmentId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((fence) =>
        mapVirtualFenceToDisplay(fence as VirtualFenceWithDetails)
      );
    },
    enabled: !!user && !!equipmentId,
  });
}

/**
 * Hook para obter uma cerca virtual específica
 */
export function useVirtualFence(fenceId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['virtual-fence', fenceId],
    queryFn: async (): Promise<VirtualFenceDisplay | null> => {
      if (!fenceId) return null;

      const { data, error } = await supabase
        .from('virtual_fences')
        .select(`
          *,
          equipment(id, imei, serial_number, products(model))
        `)
        .eq('id', fenceId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return mapVirtualFenceToDisplay(data as VirtualFenceWithDetails);
    },
    enabled: !!user && !!fenceId,
  });
}

/**
 * Hook para criar uma cerca virtual
 */
export function useCreateVirtualFence() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: VirtualFenceFormData) => {
      // Busca dados do equipamento para obter IMEI e protocolo
      const { data: equipment, error: equipmentError } = await supabase
        .from('equipment')
        .select(`
          id,
          imei,
          model,
          products(model)
        `)
        .eq('id', data.equipment_id)
        .maybeSingle();

      if (equipmentError) throw equipmentError;
      
      const imei = equipment?.imei || null;
      const protocolo = equipment?.products?.model || (equipment as any)?.model || undefined;

      // Cria no banco de dados
      const { data: fence, error } = await supabase
        .from('virtual_fences')
        .insert({
          equipment_id: data.equipment_id,
          name: data.name,
          latitude: data.latitude,
          longitude: data.longitude,
          radius: data.radius,
          speed_limit: data.speed_limit || null,
          is_primary: data.is_primary,
          notify_on_enter: data.notify_on_enter,
          notify_on_exit: data.notify_on_exit,
        })
        .select()
        .single();

      if (error) throw error;

      // Se tiver IMEI, sincroniza com a API
      if (imei) {
        try {
          await trackingApiClient.createVirtualFence(imei, protocolo, {
            name: data.name,
            latitude: data.latitude,
            longitude: data.longitude,
            radius: data.radius,
            speed_limit: data.speed_limit || null,
            notify_on_enter: data.notify_on_enter,
            notify_on_exit: data.notify_on_exit,
          });
        } catch (apiError) {
          console.error('Erro ao sincronizar cerca com API:', apiError);
          // Não falha a criação se a API falhar, apenas loga o erro
        }
      }

      return fence;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['virtual-fences', variables.equipment_id] });
      toast({
        title: 'Sucesso',
        description: 'Cerca virtual criada com sucesso!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: `Erro ao criar cerca virtual: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook para atualizar uma cerca virtual
 */
export function useUpdateVirtualFence() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<VirtualFenceFormData> }) => {
      // Busca a cerca atual para obter equipment_id
      const { data: currentFence, error: fetchError } = await supabase
        .from('virtual_fences')
        .select('equipment_id')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Busca dados do equipamento
      const { data: equipment, error: equipmentError } = await supabase
        .from('equipment')
        .select(`
          id,
          imei,
          model,
          products(model)
        `)
        .eq('id', currentFence.equipment_id)
        .maybeSingle();

      if (equipmentError) throw equipmentError;

      const imei = equipment?.imei || null;
      const protocolo = equipment?.products?.model || (equipment as any)?.model || undefined;

      // Atualiza no banco de dados
      const { data: fence, error } = await supabase
        .from('virtual_fences')
        .update({
          name: data.name,
          latitude: data.latitude,
          longitude: data.longitude,
          radius: data.radius,
          speed_limit: data.speed_limit ?? null,
          is_primary: data.is_primary,
          notify_on_enter: data.notify_on_enter,
          notify_on_exit: data.notify_on_exit,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Se tiver IMEI, sincroniza com a API
      if (imei && data) {
        try {
          await trackingApiClient.updateVirtualFence(imei, protocolo, id, {
            name: data.name,
            latitude: data.latitude,
            longitude: data.longitude,
            radius: data.radius,
            speed_limit: data.speed_limit ?? null,
            notify_on_enter: data.notify_on_enter,
            notify_on_exit: data.notify_on_exit,
          });
        } catch (apiError) {
          console.error('Erro ao sincronizar cerca com API:', apiError);
          // Não falha a atualização se a API falhar, apenas loga o erro
        }
      }

      return fence;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['virtual-fences'] });
      queryClient.invalidateQueries({ queryKey: ['virtual-fence', data.id] });
      toast({
        title: 'Sucesso',
        description: 'Cerca virtual atualizada com sucesso!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: `Erro ao atualizar cerca virtual: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook para deletar uma cerca virtual
 */
export function useDeleteVirtualFence() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, equipmentId }: { id: string; equipmentId: string }) => {
      // Busca dados do equipamento antes de deletar
      const { data: equipment, error: equipmentError } = await supabase
        .from('equipment')
        .select(`
          id,
          imei,
          model,
          products(model)
        `)
        .eq('id', equipmentId)
        .maybeSingle();

      if (equipmentError) throw equipmentError;

      const imei = equipment?.imei || null;
      const protocolo = equipment?.products?.model || (equipment as any)?.model || undefined;

      // Deleta do banco de dados
      const { error } = await supabase
        .from('virtual_fences')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Se tiver IMEI, sincroniza com a API
      if (imei) {
        try {
          await trackingApiClient.deleteVirtualFence(imei, protocolo, id);
        } catch (apiError) {
          console.error('Erro ao sincronizar exclusão com API:', apiError);
          // Não falha a exclusão se a API falhar, apenas loga o erro
        }
      }

      return { id, equipmentId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['virtual-fences', variables.equipmentId] });
      queryClient.invalidateQueries({ queryKey: ['virtual-fence'] });
      toast({
        title: 'Sucesso',
        description: 'Cerca virtual excluída com sucesso!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: `Erro ao excluir cerca virtual: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}

