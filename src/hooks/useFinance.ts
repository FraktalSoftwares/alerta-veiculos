import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  FinanceRecordDisplay,
  FinanceSummary,
  FinanceType,
  mapFinanceRecordToDisplay,
  formatCurrency,
} from "@/types/finance";

interface UseFinanceRecordsOptions {
  type?: FinanceType;
  page?: number;
  limit?: number;
  search?: string;
}

export function useFinanceRecords(options: UseFinanceRecordsOptions = {}) {
  const { user } = useAuth();
  const { type = "revenue", page = 1, limit = 10, search = "" } = options;

  return useQuery({
    queryKey: ["finance-records", user?.id, type, page, limit, search],
    queryFn: async () => {
      const offset = (page - 1) * limit;

      let query = supabase
        .from("finance_records")
        .select(
          `
          *,
          clients (
            id,
            name
          )
        `,
          { count: "exact" }
        )
        .eq("type", type)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (search) {
        query = query.or(
          `description.ilike.%${search}%,category.ilike.%${search}%`
        );
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const records: FinanceRecordDisplay[] = (data || []).map((record) =>
        mapFinanceRecordToDisplay(
          record,
          (record.clients as any)?.name || "Cliente não informado"
        )
      );

      return {
        records,
        total: count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
      };
    },
    enabled: !!user,
  });
}

export function useFinanceSummary(type: FinanceType = "revenue") {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["finance-summary", user?.id, type],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_records")
        .select("amount, status")
        .eq("type", type);

      if (error) throw error;

      const summary: FinanceSummary = {
        predicted: 0,
        received: 0,
        overdue: 0,
      };

      (data || []).forEach((record) => {
        const amount = Number(record.amount);
        summary.predicted += amount;

        if (record.status === "paid") {
          summary.received += amount;
        } else if (record.status === "overdue") {
          summary.overdue += amount;
        }
      });

      return {
        predicted: summary.predicted,
        received: summary.received,
        overdue: summary.overdue,
        formattedPredicted: formatCurrency(summary.predicted),
        formattedReceived: formatCurrency(summary.received),
        formattedOverdue: formatCurrency(summary.overdue),
      };
    },
    enabled: !!user,
  });
}

interface CreateFinanceRecordInput {
  type: FinanceType;
  clientId?: string;
  description?: string;
  amount: number;
  dueDate?: string;
  paymentMethod?: string;
  category?: string;
  referenceMonth?: string;
}

export function useCreateFinanceRecord() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateFinanceRecordInput) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("finance_records")
        .insert({
          owner_id: user.id,
          type: input.type,
          client_id: input.clientId || null,
          description: input.description || null,
          amount: input.amount,
          due_date: input.dueDate || null,
          payment_method: input.paymentMethod || null,
          category: input.category || null,
          reference_month: input.referenceMonth || null,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["finance-records"] });
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      toast({
        title: variables.type === "revenue" ? "Receita criada" : "Despesa criada",
        description: `O registro foi cadastrado com sucesso.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar registro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

interface UpdateFinanceRecordInput {
  id: string;
  status?: string;
  paymentDate?: string;
  description?: string;
  amount?: number;
}

export function useUpdateFinanceRecord() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: UpdateFinanceRecordInput) => {
      const { id, ...updateData } = input;

      const updatePayload: Record<string, any> = {};
      if (updateData.status) updatePayload.status = updateData.status as "pending" | "paid" | "overdue" | "cancelled";
      if (updateData.paymentDate) updatePayload.payment_date = updateData.paymentDate;
      if (updateData.description) updatePayload.description = updateData.description;
      if (updateData.amount) updatePayload.amount = updateData.amount;

      const { data, error } = await supabase
        .from("finance_records")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-records"] });
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      toast({
        title: "Registro atualizado",
        description: "O registro foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar registro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteFinanceRecord() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("finance_records")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-records"] });
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      toast({
        title: "Registro excluído",
        description: "O registro foi excluído com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir registro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
