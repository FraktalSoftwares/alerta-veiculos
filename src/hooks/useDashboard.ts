import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ClientStats {
  total: number;
  active: number;
  newThisMonth: number;
  cancelled: number;
  overdue: number;
  byType: {
    associacao: number;
    associado: number;
    franqueado: number;
    frotista: number;
    motorista: number;
  };
}

interface VehicleStats {
  total: number;
  active: number;
  inactive: number;
  blocked: number;
  noSignal: number;
  maintenance: number;
}

interface EquipmentStats {
  total: number;
  available: number;
  installed: number;
  maintenance: number;
  defective: number;
  storeStock: number;
}

interface RevenueData {
  month: string;
  value: number;
}

interface FinanceSummary {
  totalRevenue: number;
  totalExpenses: number;
  pendingRevenue: number;
  overdueRevenue: number;
}

// Helper to parse DD/MM/YYYY to ISO date string
function parseDate(dateStr: string): string | null {
  const parts = dateStr.split("/");
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  if (isNaN(date.getTime())) return null;
  return date.toISOString().split("T")[0];
}

export function useClientStats(startDate?: string, endDate?: string) {
  const { user } = useAuth();
  const isoStartDate = startDate ? parseDate(startDate) : null;
  const isoEndDate = endDate ? parseDate(endDate) : null;

  return useQuery({
    queryKey: ["dashboard", "client-stats", isoStartDate, isoEndDate, user?.id],
    queryFn: async (): Promise<ClientStats> => {
      // Get all clients (optionally filter by created_at range)
      let query = supabase
        .from("clients")
        .select("id, status, client_type, created_at, user_id");

      // Exclude the logged-in user's own client record
      if (user) {
        query = query.or(`user_id.is.null,user_id.neq.${user.id}`);
      }

      const { data: clients, error } = await query;

      if (error) throw error;

      // Filter clients by created_at within the date range for "new" count
      const newClients = clients?.filter(c => {
        if (!c.created_at) return false;
        const createdDate = c.created_at.split("T")[0];
        if (isoStartDate && createdDate < isoStartDate) return false;
        if (isoEndDate && createdDate > isoEndDate) return false;
        return true;
      }) || [];

      const total = clients?.length || 0;
      const active = clients?.filter(c => c.status === "active").length || 0;
      const newThisMonth = newClients.length;
      const cancelled = clients?.filter(c => c.status === "inactive").length || 0;

      // Get overdue clients from finance records within date range
      let overdueQuery = supabase
        .from("finance_records")
        .select("client_id")
        .eq("type", "revenue")
        .eq("status", "overdue");

      if (isoStartDate) overdueQuery = overdueQuery.gte("due_date", isoStartDate);
      if (isoEndDate) overdueQuery = overdueQuery.lte("due_date", isoEndDate);

      const { data: overdueRecords } = await overdueQuery;

      const overdueClientIds = new Set(overdueRecords?.map(r => r.client_id).filter(Boolean) || []);
      const overdue = overdueClientIds.size;

      // Count by type
      const byType = {
        associacao: clients?.filter(c => c.client_type === "associacao").length || 0,
        associado: clients?.filter(c => c.client_type === "associado").length || 0,
        franqueado: clients?.filter(c => c.client_type === "franqueado").length || 0,
        frotista: clients?.filter(c => c.client_type === "frotista").length || 0,
        motorista: clients?.filter(c => c.client_type === "motorista").length || 0,
      };

      return { total, active, newThisMonth, cancelled, overdue, byType };
    },
  });
}

export function useVehicleStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["dashboard", "vehicle-stats", user?.id],
    queryFn: async (): Promise<VehicleStats> => {
      const { data: vehicles, error } = await supabase
        .from("vehicles")
        .select("id, status, equipment(imei)");

      if (error) throw error;

      if (!vehicles || vehicles.length === 0) {
        return { total: 0, active: 0, inactive: 0, blocked: 0, noSignal: 0, maintenance: 0 };
      }

      // Collect valid IMEIs to check real-time connection
      const imeiMap = new Map<string, string>(); // vehicleId -> imei
      for (const v of vehicles) {
        const imei = (v as any).equipment?.[0]?.imei;
        if (imei && imei !== '-') {
          imeiMap.set(v.id, imei);
        }
      }

      // Check real-time connection for all vehicles with IMEI
      const connectionResults = new Map<string, boolean>(); // vehicleId -> connected
      const connectionPromises = Array.from(imeiMap.entries()).map(async ([vehicleId, imei]) => {
        try {
          const response = await fetch(
            `https://fraktalsistemas.com.br:8004/conexoes/verificar_conexao/${imei}`,
            { method: 'GET', headers: { 'Content-Type': 'application/json' } }
          );
          if (!response.ok) {
            connectionResults.set(vehicleId, false);
            return;
          }
          const data = await response.json();
          connectionResults.set(vehicleId, data.conectado === true);
        } catch {
          connectionResults.set(vehicleId, false);
        }
      });

      await Promise.all(connectionPromises);

      // Compute stats using real-time connection status (same logic as VehicleTableRow)
      let active = 0, inactive = 0, blocked = 0, noSignal = 0, maintenance = 0;
      for (const v of vehicles) {
        if (v.status === "blocked") {
          blocked++;
        } else if (v.status === "maintenance") {
          maintenance++;
        } else if (v.status === "inactive") {
          inactive++;
        } else {
          // For active/no_signal vehicles, use real-time connection
          const isConnected = connectionResults.get(v.id) === true;
          if (isConnected) {
            active++;
          } else {
            noSignal++;
          }
        }
      }

      return {
        total: vehicles.length,
        active,
        inactive,
        blocked,
        noSignal,
        maintenance,
      };
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });
}

export function useEquipmentStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["dashboard", "equipment-stats", user?.id],
    queryFn: async (): Promise<EquipmentStats> => {
      const [{ data: equipment, error }, { data: products, error: productsError }] = await Promise.all([
        supabase.from("equipment").select("id, status"),
        supabase.from("products").select("stock_quantity").eq("is_active", true),
      ]);

      if (error) throw error;
      if (productsError) throw productsError;

      const storeStock = products?.reduce((sum, p) => sum + (p.stock_quantity || 0), 0) || 0;

      return {
        total: equipment?.length || 0,
        available: equipment?.filter(e => e.status === "available").length || 0,
        installed: equipment?.filter(e => e.status === "installed").length || 0,
        maintenance: equipment?.filter(e => e.status === "maintenance").length || 0,
        defective: equipment?.filter(e => e.status === "defective").length || 0,
        storeStock,
      };
    },
  });
}

export function useMonthlyRevenue(startDateStr?: string, endDateStr?: string) {
  const { user } = useAuth();
  const isoStartDate = startDateStr ? parseDate(startDateStr) : null;
  const isoEndDate = endDateStr ? parseDate(endDateStr) : null;

  // Default to current year if no dates provided
  const currentYear = new Date().getFullYear();
  const defaultStart = `${currentYear}-01-01`;
  const defaultEnd = `${currentYear}-12-31`;

  return useQuery({
    queryKey: ["dashboard", "monthly-revenue", isoStartDate || defaultStart, isoEndDate || defaultEnd, user?.id],
    queryFn: async (): Promise<RevenueData[]> => {
      const startDate = isoStartDate || defaultStart;
      const endDate = isoEndDate || defaultEnd;

      const { data: records, error } = await supabase
        .from("finance_records")
        .select("amount, payment_date, due_date, status")
        .eq("type", "revenue")
        .eq("status", "paid")
        .gte("due_date", startDate)
        .lte("due_date", endDate);

      if (error) throw error;

      const months = [
        "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
        "Jul", "Ago", "Set", "Out", "Nov", "Dez"
      ];

      const monthlyData = months.map((month) => ({
        month,
        value: 0,
      }));

      records?.forEach(record => {
        const dateStr = record.payment_date || record.due_date;
        if (dateStr) {
          const date = new Date(dateStr);
          const monthIndex = date.getMonth();
          monthlyData[monthIndex].value += Number(record.amount) || 0;
        }
      });

      return monthlyData;
    },
  });
}

export function useFinanceSummary(startDate?: string, endDate?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["dashboard", "finance-summary", startDate, endDate, user?.id],
    queryFn: async (): Promise<FinanceSummary> => {
      let query = supabase.from("finance_records").select("amount, type, status");

      if (startDate) {
        query = query.gte("due_date", startDate);
      }
      if (endDate) {
        query = query.lte("due_date", endDate);
      }

      const { data: records, error } = await query;

      if (error) throw error;

      const totalRevenue = records
        ?.filter(r => r.type === "revenue" && r.status === "paid")
        .reduce((sum, r) => sum + (Number(r.amount) || 0), 0) || 0;

      const totalExpenses = records
        ?.filter(r => r.type === "expense" && r.status === "paid")
        .reduce((sum, r) => sum + (Number(r.amount) || 0), 0) || 0;

      const pendingRevenue = records
        ?.filter(r => r.type === "revenue" && r.status === "pending")
        .reduce((sum, r) => sum + (Number(r.amount) || 0), 0) || 0;

      const overdueRevenue = records
        ?.filter(r => r.type === "revenue" && r.status === "overdue")
        .reduce((sum, r) => sum + (Number(r.amount) || 0), 0) || 0;

      return { totalRevenue, totalExpenses, pendingRevenue, overdueRevenue };
    },
  });
}
