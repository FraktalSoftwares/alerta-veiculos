import { Tables } from "@/integrations/supabase/types";

export type FinanceRecordDB = Tables<"finance_records">;

export type FinanceStatus = "pending" | "paid" | "overdue" | "cancelled";
export type FinanceType = "revenue" | "expense";

export interface FinanceRecordDisplay {
  id: string;
  clientId: string | null;
  clientName: string;
  type: FinanceType;
  category: string;
  description: string;
  amount: number;
  formattedAmount: string;
  dueDate: string | null;
  formattedDueDate: string;
  paymentDate: string | null;
  paymentMethod: string | null;
  status: FinanceStatus;
  referenceMonth: string | null;
  createdAt: string;
}

export interface FinanceSummary {
  predicted: number;
  received: number;
  overdue: number;
}

const statusMap: Record<string, FinanceStatus> = {
  pending: "pending",
  paid: "paid",
  overdue: "overdue",
  cancelled: "cancelled",
};

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(date: string | null): string {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("pt-BR");
}

export function mapFinanceRecordToDisplay(
  record: FinanceRecordDB,
  clientName: string = "Cliente não informado"
): FinanceRecordDisplay {
  return {
    id: record.id,
    clientId: record.client_id,
    clientName,
    type: record.type as FinanceType,
    category: record.category || "Cobrança",
    description: record.description || "",
    amount: Number(record.amount),
    formattedAmount: formatCurrency(Number(record.amount)),
    dueDate: record.due_date,
    formattedDueDate: formatDate(record.due_date),
    paymentDate: record.payment_date,
    paymentMethod: record.payment_method,
    status: statusMap[record.status || "pending"] || "pending",
    referenceMonth: record.reference_month,
    createdAt: record.created_at || new Date().toISOString(),
  };
}
