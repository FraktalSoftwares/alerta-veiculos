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
import { useDeleteClient } from "@/hooks/useClients";
import { ClientDisplay } from "@/types/client";
import { Loader2 } from "lucide-react";

interface DeleteClientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientDisplay | null;
}

export function DeleteClientDialog({ isOpen, onClose, client }: DeleteClientDialogProps) {
  const deleteClient = useDeleteClient();

  const handleDelete = async () => {
    if (!client) return;

    try {
      await deleteClient.mutateAsync(client.id);
      onClose();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  if (!client) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o cliente <strong>{client.name}</strong>?
            <br />
            <br />
            Esta ação não pode ser desfeita. Todos os dados relacionados a este cliente
            (veículos, endereços, contatos) também serão removidos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteClient.isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteClient.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteClient.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
