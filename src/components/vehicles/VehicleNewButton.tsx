import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VehicleNewButtonProps {
  onClick: () => void;
}

export function VehicleNewButton({ onClick }: VehicleNewButtonProps) {
  return (
    <Button
      onClick={onClick}
      className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
    >
      <Plus className="h-4 w-4" />
      Novo Veículo
    </Button>
  );
}
