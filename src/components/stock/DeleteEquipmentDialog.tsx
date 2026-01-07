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
import { useDeleteEquipment } from "@/hooks/useEquipment";
import { EquipmentDisplay } from "@/types/equipment";
import { Loader2 } from "lucide-react";

interface DeleteEquipmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: EquipmentDisplay | null;
}

export function DeleteEquipmentDialog({ isOpen, onClose, equipment }: DeleteEquipmentDialogProps) {
  const deleteEquipment = useDeleteEquipment();

  const handleDelete = async () => {
    if (!equipment) return;

    try {
      await deleteEquipment.mutateAsync(equipment.id);
      onClose();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  if (!equipment) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o equipamento <strong>{equipment.serialNumber}</strong>?
            <br />
            <br />
            Esta ação não pode ser desfeita. O equipamento será removido permanentemente do estoque.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteEquipment.isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteEquipment.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteEquipment.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
