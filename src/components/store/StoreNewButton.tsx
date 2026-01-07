import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StoreNewButtonProps {
  onClick: () => void;
}

export function StoreNewButton({ onClick }: StoreNewButtonProps) {
  return (
    <Button
      onClick={onClick}
      className="bg-foreground text-background hover:bg-foreground/90 gap-2"
    >
      <Plus className="h-4 w-4" />
      Novo Produto
    </Button>
  );
}
