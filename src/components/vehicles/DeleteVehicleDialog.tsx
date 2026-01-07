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
import { useDeleteVehicle } from "@/hooks/useVehicles";
import { VehicleDisplay } from "@/types/vehicle";
import { Loader2 } from "lucide-react";

interface DeleteVehicleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: VehicleDisplay | null;
}

export function DeleteVehicleDialog({ isOpen, onClose, vehicle }: DeleteVehicleDialogProps) {
  const deleteVehicle = useDeleteVehicle();

  const handleDelete = async () => {
    if (!vehicle) return;

    try {
      await deleteVehicle.mutateAsync(vehicle.id);
      onClose();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  if (!vehicle) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o veículo <strong>{vehicle.plate}</strong>?
            <br />
            <br />
            Esta ação não pode ser desfeita. O histórico de rastreamento e alertas
            associados a este veículo também serão removidos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteVehicle.isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteVehicle.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteVehicle.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
