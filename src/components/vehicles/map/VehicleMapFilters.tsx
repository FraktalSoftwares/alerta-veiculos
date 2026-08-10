import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

interface FilterOption {
  label: string;
  count: number;
  variant: "todos" | "rastreando" | "desligado" | "bloqueado";
}

interface VehicleMapFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  filterCounts?: {
    todos: number;
    rastreando: number;
    desligado: number;
    bloqueado: number;
  };
}

export function VehicleMapFilters({ activeFilter, onFilterChange, filterCounts }: VehicleMapFiltersProps) {
  const filterOptions: FilterOption[] = [
    { label: "TODOS", count: filterCounts?.todos || 0, variant: "todos" },
    { label: "RASTREANDO", count: filterCounts?.rastreando || 0, variant: "rastreando" },
    { label: "DESLIGADO", count: filterCounts?.desligado || 0, variant: "desligado" },
    { label: "BLOQUEADO", count: filterCounts?.bloqueado || 0, variant: "bloqueado" },
  ];
  const getFilterStyles = (variant: FilterOption["variant"], isActive: boolean) => {
    const baseStyles = "text-xs font-medium px-2 sm:px-3 py-1.5 rounded-md transition-all";

    switch (variant) {
      case "todos":
        return `${baseStyles} ${isActive ? "bg-primary text-primary-foreground" : "bg-primary/20 text-primary hover:bg-primary/30"}`;
      case "rastreando":
        return `${baseStyles} ${isActive ? "bg-success text-success-foreground" : "bg-success/20 text-success hover:bg-success/30"}`;
      case "desligado":
        return `${baseStyles} ${isActive ? "bg-destructive text-destructive-foreground" : "bg-destructive/20 text-destructive hover:bg-destructive/30"}`;
      case "bloqueado":
        return `${baseStyles} ${isActive ? "bg-warning text-warning-foreground" : "bg-warning/20 text-warning-foreground hover:bg-warning/30"}`;
      default:
        return baseStyles;
    }
  };

  return (
    <div className="p-3 sm:p-4 border-b border-border shrink-0">
      <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">Selecione para filtrar</p>
      <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
        {filterOptions.map((filter) => (
          <button
            key={filter.variant}
            onClick={() => onFilterChange(filter.variant)}
            className={`${getFilterStyles(filter.variant, activeFilter === filter.variant)} min-h-[44px] shrink-0`}
          >
            {filter.label}: {filter.count}
          </button>
        ))}
        <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5 min-h-[44px] shrink-0 text-xs">
          <span>Mais Filtros</span>
          <Filter className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
