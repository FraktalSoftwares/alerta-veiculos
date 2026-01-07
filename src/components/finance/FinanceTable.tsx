import { FinanceTableHeader } from "./FinanceTableHeader";
import { FinanceTableRow } from "./FinanceTableRow";
import { FinanceRecordDisplay } from "@/types/finance";
import { Skeleton } from "@/components/ui/skeleton";

interface FinanceTableProps {
  records: FinanceRecordDisplay[];
  onRecordClick?: (record: FinanceRecordDisplay) => void;
  onEditRecord?: (record: FinanceRecordDisplay) => void;
  onDeleteRecord?: (record: FinanceRecordDisplay) => void;
  isLoading?: boolean;
}

export function FinanceTable({ records, onRecordClick, onEditRecord, onDeleteRecord, isLoading }: FinanceTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border overflow-hidden bg-card">
        <FinanceTableHeader />
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-[1fr_120px_1fr_120px_120px_100px] gap-4 px-6 py-5"
            >
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="rounded-lg border border-border overflow-hidden bg-card">
        <FinanceTableHeader />
        <div className="p-8 text-center text-muted-foreground">
          Nenhum registro encontrado
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-card">
      <FinanceTableHeader />
      <div className="divide-y divide-border">
        {records.map((record) => (
          <FinanceTableRow
            key={record.id}
            record={record}
            onClick={onRecordClick}
            onEdit={onEditRecord}
            onDelete={onDeleteRecord}
          />
        ))}
      </div>
    </div>
  );
}
