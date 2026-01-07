import { FinanceBadge } from "./FinanceBadge";
import { FinanceRecordDisplay, FinanceStatus } from "@/types/finance";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { RequirePermission } from "@/components/auth/PermissionGate";
import { PERMISSIONS } from "@/hooks/useUserPermissions";

interface FinanceTableRowProps {
  record: FinanceRecordDisplay;
  onClick?: (record: FinanceRecordDisplay) => void;
  onEdit?: (record: FinanceRecordDisplay) => void;
  onDelete?: (record: FinanceRecordDisplay) => void;
}

const statusLabels: Record<FinanceStatus, string> = {
  overdue: "VENCIDO",
  paid: "PAGO",
  pending: "PENDENTE",
  cancelled: "CANCELADO",
};

const statusVariantMap: Record<FinanceStatus, "vencido" | "pago" | "pendente" | "cancelado"> = {
  overdue: "vencido",
  paid: "pago",
  pending: "pendente",
  cancelled: "cancelado",
};

export function FinanceTableRow({ record, onClick, onEdit, onDelete }: FinanceTableRowProps) {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(record);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(record);
  };

  return (
    <div
      onClick={() => onClick?.(record)}
      className="grid grid-cols-[1fr_120px_1fr_120px_120px_100px_80px] gap-4 px-6 py-5 text-sm border-b border-border hover:bg-table-row-hover cursor-pointer transition-colors"
    >
      <div className="text-foreground font-medium truncate">{record.clientName}</div>
      <div className="text-muted-foreground">{record.category}</div>
      <div className="text-muted-foreground truncate">{record.description}</div>
      <div className="text-foreground text-right">{record.formattedAmount}</div>
      <div className="text-foreground">{record.formattedDueDate}</div>
      <div>
        <FinanceBadge variant={statusVariantMap[record.status]}>
          {statusLabels[record.status]}
        </FinanceBadge>
      </div>
      <div className="flex items-center justify-end gap-1">
        <RequirePermission code={PERMISSIONS.FINANCE_EDIT}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleEdit}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </RequirePermission>
        <RequirePermission code={PERMISSIONS.FINANCE_DELETE}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </RequirePermission>
      </div>
    </div>
  );
}
