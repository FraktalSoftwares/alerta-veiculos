import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteFinanceRecord } from "@/hooks/useFinance";
import { FinanceRecordDisplay } from "@/types/finance";
import { Loader2 } from "lucide-react";

interface DeleteFinanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  record: FinanceRecordDisplay | null;
}

export function DeleteFinanceDialog({ isOpen, onClose, record }: DeleteFinanceDialogProps) {
  const deleteRecord = useDeleteFinanceRecord();

  const handleDelete = async () => {
    if (!record) return;

    try {
      await deleteRecord.mutateAsync(record.id);
      onClose();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  if (!record) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir este registro?
            <br />
            <br />
            <strong>Cliente:</strong> {record.clientName}
            <br />
            <strong>Valor:</strong> {record.formattedAmount}
            <br />
            <br />
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteRecord.isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteRecord.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteRecord.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}