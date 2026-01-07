import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ClientStats {
  total: number;
  active: number;
  newThisMonth: number;
  cancelled: number;
  overdue: number;
  byType: {
    associacao: number;
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
  const isoStartDate = startDate ? parseDate(startDate) : null;
  const isoEndDate = endDate ? parseDate(endDate) : null;

  return useQuery({
    queryKey: ["dashboard", "client-stats", isoStartDate, isoEndDate],
    queryFn: async (): Promise<ClientStats> => {
      // Get all clients (optionally filter by created_at range)
      let query = supabase
        .from("clients")
        .select("id, status, client_type, created_at");

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
        franqueado: clients?.filter(c => c.client_type === "franqueado").length || 0,
        frotista: clients?.filter(c => c.client_type === "frotista").length || 0,
        motorista: clients?.filter(c => c.client_type === "motorista").length || 0,
      };

      return { total, active, newThisMonth, cancelled, overdue, byType };
    },
  });
}

export function useVehicleStats() {
  return useQuery({
    queryKey: ["dashboard", "vehicle-stats"],
    queryFn: async (): Promise<VehicleStats> => {
      const { data: vehicles, error } = await supabase
        .from("vehicles")
        .select("id, status");

      if (error) throw error;

      return {
        total: vehicles?.length || 0,
        active: vehicles?.filter(v => v.status === "active").length || 0,
        inactive: vehicles?.filter(v => v.status === "inactive").length || 0,
        blocked: vehicles?.filter(v => v.status === "blocked").length || 0,
        noSignal: vehicles?.filter(v => v.status === "no_signal").length || 0,
        maintenance: vehicles?.filter(v => v.status === "maintenance").length || 0,
      };
    },
  });
}

export function useEquipmentStats() {
  return useQuery({
    queryKey: ["dashboard", "equipment-stats"],
    queryFn: async (): Promise<EquipmentStats> => {
      const { data: equipment, error } = await supabase
        .from("equipment")
        .select("id, status");

      if (error) throw error;

      return {
        total: equipment?.length || 0,
        available: equipment?.filter(e => e.status === "available").length || 0,
        installed: equipment?.filter(e => e.status === "installed").length || 0,
        maintenance: equipment?.filter(e => e.status === "maintenance").length || 0,
        defective: equipment?.filter(e => e.status === "defective").length || 0,
      };
    },
  });
}

export function useMonthlyRevenue(startDateStr?: string, endDateStr?: string) {
  const isoStartDate = startDateStr ? parseDate(startDateStr) : null;
  const isoEndDate = endDateStr ? parseDate(endDateStr) : null;

  // Default to current year if no dates provided
  const currentYear = new Date().getFullYear();
  const defaultStart = `${currentYear}-01-01`;
  const defaultEnd = `${currentYear}-12-31`;
  
  return useQuery({
    queryKey: ["dashboard", "monthly-revenue", isoStartDate || defaultStart, isoEndDate || defaultEnd],
    queryFn: async (): Promise<RevenueData[]> => {
      const startDate = isoStartDate || defaultStart;
      const endDate = isoEndDate || defaultEnd;

      const { data: records, error } = await supabase
        .from("finance_records")
        .select("amount, payment_date, due_date, status")
        .eq("type", "revenue")
        .eq("status", "paid")
        .gte("payment_date", startDate)
        .lte("payment_date", endDate);

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
        if (record.payment_date) {
          const date = new Date(record.payment_date);
          const monthIndex = date.getMonth();
          monthlyData[monthIndex].value += Number(record.amount) || 0;
        }
      });

      return monthlyData;
    },
  });
}

export function useFinanceSummary(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["dashboard", "finance-summary", startDate, endDate],
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
