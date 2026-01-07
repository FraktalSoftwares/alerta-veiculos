import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface VehicleAlert {
  id: string;
  vehicleId: string;
  plate: string;
  alertType: string;
  message: string | null;
  isRead: boolean;
  createdAt: string;
  latitude: number | null;
  longitude: number | null;
}

export function useVehicleAlerts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["vehicle-alerts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_alerts")
        .select(`
          id,
          alert_type,
          message,
          is_read,
          created_at,
          latitude,
          longitude,
          vehicles!inner (
            id,
            plate
          )
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data || []).map((alert): VehicleAlert => ({
        id: alert.id,
        vehicleId: (alert.vehicles as any).id,
        plate: (alert.vehicles as any).plate,
        alertType: alert.alert_type,
        message: alert.message,
        isRead: alert.is_read ?? false,
        createdAt: alert.created_at ?? new Date().toISOString(),
        latitude: alert.latitude ? Number(alert.latitude) : null,
        longitude: alert.longitude ? Number(alert.longitude) : null,
      }));
    },
    enabled: !!user,
  });
}

export function useUnreadAlertsCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["vehicle-alerts-unread-count", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("vehicle_alerts")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false);

      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
  });
}

export function useMarkAlertAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from("vehicle_alerts")
        .update({ is_read: true })
        .eq("id", alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["vehicle-alerts-unread-count"] });
    },
  });
}

export function useMarkAllAlertsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("vehicle_alerts")
        .update({ is_read: true })
        .eq("is_read", false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["vehicle-alerts-unread-count"] });
    },
  });
}
