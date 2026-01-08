import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { trackingApiClient } from '@/integrations/tracking-api/client';
import { VehicleActionType } from '@/integrations/tracking-api/config';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para executar ações em veículos via API
 */
export function useVehicleAction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      action,
      imei,
      protocolo,
      params,
      vehicleId,
    }: {
      action: VehicleActionType;
      imei: string;
      protocolo?: string;
      params?: Record<string, any>;
      vehicleId?: string;
    }) => {
      // Executa a ação na API
      const response = await trackingApiClient.executeAction(action, {
        imei,
        protocolo,
        params,
      });

      // Se for bloqueio/desbloqueio, atualiza o status no banco
      if (action === 'block' || action === 'unblock') {
        if (vehicleId) {
          const { error } = await supabase
            .from('vehicles')
            .update({ status: action === 'block' ? 'blocked' : 'active' })
            .eq('id', vehicleId);

          if (error) {
            console.error('Erro ao atualizar status no banco:', error);
            // Não falha a mutação se a API funcionou, apenas loga o erro
          }
        }
      }

      return response;
    },
    onSuccess: (data, variables) => {
      // Invalida queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      if (variables.vehicleId) {
        queryClient.invalidateQueries({ queryKey: ['vehicle', variables.vehicleId] });
        queryClient.invalidateQueries({ queryKey: ['vehicle-connection', variables.imei] });
      }

      // Mostra mensagem de sucesso
      const actionMessages: Record<VehicleActionType, string> = {
        block: 'Veículo bloqueado com sucesso!',
        unblock: 'Veículo desbloqueado com sucesso!',
        siren: 'Sirene ativada!',
        restart: 'Rastreador reiniciado!',
        virtual_fence: 'Cerca virtual atualizada!',
        points_of_interest: 'Pontos de interesse atualizados!',
        odometer: 'Dados do hodômetro obtidos!',
        routes: 'Rotas obtidas!',
      };

      toast({
        title: 'Sucesso',
        description: data.message || actionMessages[variables.action],
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao executar ação. Tente novamente.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook específico para bloquear veículo
 */
export function useBlockVehicleAction() {
  const vehicleAction = useVehicleAction();

  return {
    block: (imei: string, vehicleId: string, protocolo?: string) => {
      return vehicleAction.mutate({
        action: 'block',
        imei,
        vehicleId,
        protocolo,
      });
    },
    unblock: (imei: string, vehicleId: string, protocolo?: string) => {
      return vehicleAction.mutate({
        action: 'unblock',
        imei,
        vehicleId,
        protocolo,
      });
    },
    isLoading: vehicleAction.isPending,
  };
}

/**
 * Hook específico para sirene
 */
export function useSirenAction() {
  const vehicleAction = useVehicleAction();

  return {
    activate: (imei: string, protocolo?: string, duration?: number) => {
      return vehicleAction.mutate({
        action: 'siren',
        imei,
        protocolo,
        params: duration ? { duracao: duration } : undefined,
      });
    },
    isLoading: vehicleAction.isPending,
  };
}

/**
 * Hook específico para reiniciar rastreador
 */
export function useRestartTrackerAction() {
  const vehicleAction = useVehicleAction();

  return {
    restart: (imei: string, protocolo?: string) => {
      return vehicleAction.mutate({
        action: 'restart',
        imei,
        protocolo,
      });
    },
    isLoading: vehicleAction.isPending,
  };
}

/**
 * Hook para gerenciar cerca virtual
 */
export function useVirtualFenceAction() {
  const vehicleAction = useVehicleAction();

  return {
    manage: (imei: string, protocolo: string | undefined, fenceData: any) => {
      return vehicleAction.mutate({
        action: 'virtual_fence',
        imei,
        protocolo,
        params: fenceData,
      });
    },
    isLoading: vehicleAction.isPending,
  };
}

/**
 * Hook para gerenciar pontos de interesse
 */
export function usePointsOfInterestAction() {
  const vehicleAction = useVehicleAction();

  return {
    manage: (imei: string, protocolo: string | undefined, poiData: any) => {
      return vehicleAction.mutate({
        action: 'points_of_interest',
        imei,
        protocolo,
        params: poiData,
      });
    },
    isLoading: vehicleAction.isPending,
  };
}

/**
 * Hook para obter dados do hodômetro
 */
export function useOdometerAction() {
  const vehicleAction = useVehicleAction();

  return {
    get: (imei: string, protocolo?: string) => {
      return vehicleAction.mutate({
        action: 'odometer',
        imei,
        protocolo,
      });
    },
    isLoading: vehicleAction.isPending,
  };
}

/**
 * Hook para obter rotas
 */
export function useRoutesAction() {
  const vehicleAction = useVehicleAction();

  return {
    get: (imei: string, protocolo?: string, dateRange?: { start: string; end: string }) => {
      return vehicleAction.mutate({
        action: 'routes',
        imei,
        protocolo,
        params: dateRange,
      });
    },
    isLoading: vehicleAction.isPending,
  };
}

