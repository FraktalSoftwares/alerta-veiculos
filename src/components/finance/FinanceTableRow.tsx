import { FinanceBadge } from "./FinanceBadge";
import { FinanceRecordDisplay, FinanceStatus } from "@/types/finance";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, ChevronRight } from "lucide-react";
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
    <>
      {/* Mobile compact card */}
      <div
        onClick={() => onClick?.(record)}
        className="md:hidden flex items-center gap-2 px-3 py-2.5 border-b border-border hover:bg-table-row-hover cursor-pointer transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-foreground font-bold text-sm truncate">{record.clientName}</span>
            <FinanceBadge variant={statusVariantMap[record.status]} className="shrink-0">
              {statusLabels[record.status]}
            </FinanceBadge>
          </div>
          <div className="text-xs text-muted-foreground truncate">{record.description}</div>
          <div className="flex items-center justify-between gap-2 mt-1">
            <span className="text-xs text-muted-foreground">{record.category} · venc. {record.formattedDueDate}</span>
            <span className="text-sm font-semibold text-foreground shrink-0">{record.formattedAmount}</span>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>

      {/* Desktop grid row */}
      <div
        onClick={() => onClick?.(record)}
        className="hidden md:grid grid-cols-[1fr_120px_1fr_120px_120px_100px_80px] gap-4 px-6 py-5 text-sm border-b border-border hover:bg-table-row-hover cursor-pointer transition-colors"
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
    </>
  );
}
