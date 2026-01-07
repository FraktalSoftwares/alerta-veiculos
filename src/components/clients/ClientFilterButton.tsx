import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClientFilterButtonProps {
  onClick: () => void;
  hasFilters?: boolean;
}

export function ClientFilterButton({ onClick, hasFilters = false }: ClientFilterButtonProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onClick}
      className="border-border bg-card hover:bg-accent relative"
    >
      <Filter className="h-4 w-4" />
      {hasFilters && (
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
      )}
    </Button>
  );
}
