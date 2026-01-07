import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface VehicleTrackingData {
  id: string;
  vehicle_id: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  ignition: boolean | null;
  recorded_at: string | null;
}

export function useVehicleTracking(vehicleId: string) {
  const queryClient = useQueryClient();

  // Subscribe to real-time updates
  useEffect(() => {
    if (!vehicleId) return;

    const channel = supabase
      .channel(`vehicle-tracking-${vehicleId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vehicle_tracking_data',
          filter: `vehicle_id=eq.${vehicleId}`
        },
        (payload) => {
          console.log('Real-time tracking update:', payload);
          // Invalidate query to refetch latest data
          queryClient.invalidateQueries({ queryKey: ['vehicle-tracking', vehicleId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vehicleId, queryClient]);

  return useQuery({
    queryKey: ['vehicle-tracking', vehicleId],
    queryFn: async (): Promise<VehicleTrackingData | null> => {
      const { data, error } = await supabase
        .from('vehicle_tracking_data')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!vehicleId,
    refetchInterval: 5000, // Atualiza a cada 5 segundos
  });
}

export interface HistoricoData {
  id: string;
  vehicle_id: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  ignition: boolean | null;
  recorded_at: string | null;
}

/**
 * Maps equipment model to the corresponding tracking table name
 */
function getTrackingTableName(model: string | null | undefined): string | null {
  if (!model) return null;
  
  const modelLower = model.toLowerCase().trim();
  
  // Map models to table names
  if (modelLower === '310') {
    return 'pacotes_rastreador_310';
  }
  if (modelLower === '8310') {
    return 'pacotes_rastreador_8310';
  }
  if (modelLower === 'j16') {
    return 'pacotes_rastreador_j16';
  }
  
  return null;
}

export function useVehicleTrackingHistory(
  vehicleId: string, 
  startDate?: Date, 
  endDate?: Date,
  limit = 1000
) {
  return useQuery({
    queryKey: ['vehicle-historico', vehicleId, startDate?.toISOString(), endDate?.toISOString(), limit],
    queryFn: async (): Promise<HistoricoData[]> => {
      if (!vehicleId) return [];

      // Get the vehicle with equipment to find the model and IMEI
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .select(`
          id,
          equipment(
            id,
            imei,
            model,
            products(model)
          )
        `)
        .eq('id', vehicleId)
        .maybeSingle();

      if (vehicleError) throw vehicleError;
      if (!vehicle || !vehicle.equipment || (Array.isArray(vehicle.equipment) && vehicle.equipment.length === 0)) {
        return [];
      }

      // Get the equipment data
      const equipment = Array.isArray(vehicle.equipment) ? vehicle.equipment[0] : vehicle.equipment;
      // Try to get model from equipment directly first, then from product
      const model = (equipment as any)?.model || equipment?.products?.model || null;
      const imei = equipment?.imei || null;
      
      if (!imei) {
        console.warn('Equipamento sem IMEI configurado');
        return [];
      }
      
      // Get the table name based on model
      const tableName = getTrackingTableName(model);
      
      if (!tableName) {
        console.warn(`Modelo não mapeado: ${model}. Tabelas disponíveis: pacotes_rastreador_310, pacotes_rastreador_8310, pacotes_rastreador_j16`);
        return [];
      }

      // Query the appropriate table using IMEI (identificador field)
      let query = supabase
        .from(tableName)
        .select('*')
        .eq('identificador', imei)
        .limit(limit);

      // Determine date field based on table/model
      let dateField: string;
      if (modelLower === 'j16') {
        dateField = 'date_time';
      } else {
        // For 310 and 8310, we need to combine date and time fields
        dateField = 'created_at'; // Fallback to created_at
      }
      
      // Filter by date range
      if (startDate) {
        if (modelLower === 'j16') {
          query = query.gte('date_time', startDate.toISOString());
        } else {
          // For 310 and 8310, filter by date field (they have separate date and time)
          const startDateStr = startDate.toISOString().split('T')[0];
          query = query.gte('date', startDateStr);
        }
      }
      if (endDate) {
        if (modelLower === 'j16') {
          query = query.lte('date_time', endDate.toISOString());
        } else {
          // For 310 and 8310, filter by date field
          const endDateStr = endDate.toISOString().split('T')[0];
          query = query.lte('date', endDateStr);
        }
      }
      
      // Order by appropriate date field
      if (modelLower === 'j16') {
        query = query.order('date_time', { ascending: true });
      } else {
        // For 310 and 8310, order by date first, then time, then created_at as fallback
        query = query.order('date', { ascending: true });
        query = query.order('time', { ascending: true });
        query = query.order('created_at', { ascending: true });
      }

      const { data, error } = await query;

      if (error) {
        console.error(`Erro ao buscar histórico da tabela ${tableName}:`, error);
        throw error;
      }
      
      // Map the data to HistoricoData format based on model
      return (data || []).map((item: any) => {
        // Parse date/time based on model
        let recordedAt: string | null = null;
        
        if (modelLower === 'j16') {
          // J16 has date_time field
          recordedAt = item.date_time || null;
        } else {
          // 310 and 8310 have separate date and time fields
          if (item.date && item.time) {
            const dateStr = item.date;
            const timeStr = item.time;
            recordedAt = `${dateStr}T${timeStr}`;
          } else if (item.created_at) {
            recordedAt = item.created_at;
          }
        }
        
        // Parse ignition based on model
        let ignition: boolean | null = null;
        if (item.ignicao !== undefined && item.ignicao !== null) {
          // ignicao can be text "0"/"1" or boolean
          if (typeof item.ignicao === 'string') {
            ignition = item.ignicao === '1' || item.ignicao.toLowerCase() === 'true' || item.ignicao.toLowerCase() === 'on';
          } else {
            ignition = Boolean(item.ignicao);
          }
        }
        
        // Parse heading/direction
        let heading: number | null = null;
        if (modelLower === 'j16') {
          heading = item.direction ? parseFloat(item.direction) : null;
        } else {
          // 310 and 8310 use 'crs' field
          heading = item.crs ? parseFloat(item.crs) : null;
        }
        
        return {
          id: item.id?.toString() || crypto.randomUUID(),
          vehicle_id: vehicleId,
          latitude: item.latitude ? parseFloat(item.latitude) : 0,
          longitude: item.longitude ? parseFloat(item.longitude) : 0,
          speed: item.speed ? parseFloat(item.speed) : null,
          heading: heading,
          ignition: ignition,
          recorded_at: recordedAt,
        };
      }) as HistoricoData[];
    },
    enabled: !!vehicleId,
  });
}
