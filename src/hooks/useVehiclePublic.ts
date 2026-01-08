import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VehicleWithDetails } from '@/types/vehicle';

/**
 * Public version of useVehicle - works without authentication
 * Used for public shared vehicle map pages
 */
export function useVehiclePublic(vehicleId: string | undefined) {
  return useQuery({
    queryKey: ['vehicle-public', vehicleId],
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
    enabled: !!vehicleId,
  });
}

