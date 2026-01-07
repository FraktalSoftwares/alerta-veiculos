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
import { useDeleteProduct } from "@/hooks/useProducts";
import { ProductDisplay } from "@/types/product";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface DeleteProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductDisplay | null;
}

export function DeleteProductDialog({ isOpen, onClose, product }: DeleteProductDialogProps) {
  const deleteProduct = useDeleteProduct();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!product) return;

    setErrorMessage(null);
    try {
      await deleteProduct.mutateAsync(product.id);
      onClose();
      setErrorMessage(null);
    } catch (error: any) {
      // Error message is shown in toast by the mutation, but we can also show it here
      setErrorMessage(error?.message || "Erro ao excluir produto");
    }
  };

  const handleClose = () => {
    setErrorMessage(null);
    onClose();
  };

  if (!product) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o produto <strong>{product.title}</strong>?
            <br />
            <br />
            Esta ação não pode ser desfeita. O produto será removido permanentemente do catálogo.
            {errorMessage && (
              <>
                <br />
                <br />
                <span className="text-destructive text-sm font-medium">
                  {errorMessage}
                </span>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteProduct.isPending} onClick={handleClose}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteProduct.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteProduct.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
