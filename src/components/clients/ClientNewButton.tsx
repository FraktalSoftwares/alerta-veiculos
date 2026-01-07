import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClientNewButtonProps {
  onClick: () => void;
}

export function ClientNewButton({ onClick }: ClientNewButtonProps) {
  return (
    <Button
      onClick={onClick}
      className="bg-card hover:bg-accent text-foreground border border-border gap-2"
    >
      <Plus className="h-4 w-4" />
      Novo Cliente
    </Button>
  );
}
