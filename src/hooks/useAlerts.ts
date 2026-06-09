import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface VehicleAlert {
  id: string;
  vehicleId: string | null;
  plate: string;
  alertType: string;
  message: string | null;
  isRead: boolean;
  createdAt: string;
  latitude: number | null;
  longitude: number | null;
}

// Alertas ficam na tabela notifications com notificacao=false.
// Usuário só vê alertas cujo rastreador (model+serial_number) pertence a ele
// (filtragem real via RLS de equipment + cruzamento client-side por modelo_rastreador/identificador).
async function fetchUserAlerts(userId: string): Promise<VehicleAlert[]> {
  const { data: equips, error: equipError } = await supabase
    .from("equipment")
    .select("model, serial_number, vehicles(id, plate)");

  if (equipError) throw equipError;

  const trackerMap = new Map<string, { vehicleId: string | null; plate: string }>();
  (equips ?? []).forEach((e: any) => {
    if (!e.model || !e.serial_number) return;
    trackerMap.set(`${e.model}|${e.serial_number}`, {
      vehicleId: e.vehicles?.id ?? null,
      plate: e.vehicles?.plate ?? "—",
    });
  });

  if (trackerMap.size === 0) return [];

  const { data: notifs, error: notifError } = await supabase
    .from("notifications")
    .select("id, title, message, notification_type, modelo_rastreador, identificador, created_at")
    .eq("notificacao", false)
    .order("created_at", { ascending: false })
    .limit(200);

  if (notifError) throw notifError;

  const matched = (notifs ?? []).filter(n =>
    n.modelo_rastreador && n.identificador &&
    trackerMap.has(`${n.modelo_rastreador}|${n.identificador}`)
  );

  if (matched.length === 0) return [];

  const ids = matched.map(n => n.id);
  const { data: reads } = await supabase
    .from("notification_reads")
    .select("notification_id")
    .eq("user_id", userId)
    .in("notification_id", ids);

  const readIds = new Set((reads ?? []).map(r => r.notification_id));

  return matched.slice(0, 50).map((n): VehicleAlert => {
    const v = trackerMap.get(`${n.modelo_rastreador}|${n.identificador}`)!;
    return {
      id: n.id,
      vehicleId: v.vehicleId,
      plate: v.plate,
      alertType: n.title || n.notification_type || "Alerta",
      message: n.message,
      isRead: readIds.has(n.id),
      createdAt: n.created_at ?? new Date().toISOString(),
      latitude: null,
      longitude: null,
    };
  });
}

export function useUserAlerts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user-alerts", user?.id],
    queryFn: () => fetchUserAlerts(user!.id),
    enabled: !!user,
  });
}

export function useUnreadAlertsCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user-alerts-unread-count", user?.id],
    queryFn: async () => {
      const alerts = await fetchUserAlerts(user!.id);
      return alerts.filter(a => !a.isRead).length;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}

export function useMarkAlertAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (alertId: string) => {
      if (!user) throw new Error("User not authenticated");
      const { error } = await supabase
        .from("notification_reads")
        .upsert(
          { user_id: user.id, notification_id: alertId },
          { onConflict: "user_id,notification_id", ignoreDuplicates: true }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["user-alerts-unread-count"] });
    },
  });
}

export function useMarkAllAlertsAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");
      const alerts = await fetchUserAlerts(user.id);
      const unread = alerts.filter(a => !a.isRead);
      if (unread.length === 0) return;
      const rows = unread.map(a => ({ user_id: user.id, notification_id: a.id }));
      const { error } = await supabase
        .from("notification_reads")
        .upsert(rows, { onConflict: "user_id,notification_id", ignoreDuplicates: true });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["user-alerts-unread-count"] });
    },
  });
}
