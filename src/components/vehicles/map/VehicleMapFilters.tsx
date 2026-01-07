import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

interface FilterOption {
  label: string;
  count: number;
  variant: "todos" | "rastreados" | "semSinal" | "bloqueados" | "desligados";
}

interface VehicleMapFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  filterCounts?: {
    todos: number;
    rastreados: number;
    semSinal: number;
    bloqueados: number;
    desligados: number;
  };
}

export function VehicleMapFilters({ activeFilter, onFilterChange, filterCounts }: VehicleMapFiltersProps) {
  const filterOptions: FilterOption[] = [
    { label: "TODOS", count: filterCounts?.todos || 0, variant: "todos" },
    { label: "RASTREADOS", count: filterCounts?.rastreados || 0, variant: "rastreados" },
    { label: "SEM SINAL", count: filterCounts?.semSinal || 0, variant: "semSinal" },
    { label: "BLOQUEADOS", count: filterCounts?.bloqueados || 0, variant: "bloqueados" },
    { label: "DESLIGADOS", count: filterCounts?.desligados || 0, variant: "desligados" },
  ];
  const getFilterStyles = (variant: FilterOption["variant"], isActive: boolean) => {
    const baseStyles = "text-xs font-medium px-3 py-1.5 rounded-md transition-all";
    
    switch (variant) {
      case "todos":
        return `${baseStyles} ${isActive ? "bg-primary text-primary-foreground" : "bg-primary/20 text-primary hover:bg-primary/30"}`;
      case "rastreados":
        return `${baseStyles} ${isActive ? "bg-primary text-primary-foreground" : "bg-primary/20 text-primary hover:bg-primary/30"}`;
      case "semSinal":
        return `${baseStyles} ${isActive ? "bg-muted-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/80"}`;
      case "bloqueados":
        return `${baseStyles} ${isActive ? "bg-destructive text-destructive-foreground" : "bg-destructive/20 text-destructive hover:bg-destructive/30"}`;
      case "desligados":
        return `${baseStyles} ${isActive ? "bg-muted-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/80"}`;
      default:
        return baseStyles;
    }
  };

  return (
    <div className="p-4 border-b border-border">
      <p className="text-sm text-muted-foreground mb-3">Selecione para filtrar</p>
      <div className="flex flex-wrap gap-2 items-center">
        {filterOptions.map((filter) => (
          <button
            key={filter.variant}
            onClick={() => onFilterChange(filter.variant)}
            className={getFilterStyles(filter.variant, activeFilter === filter.variant)}
          >
            {filter.label}: {filter.count}
          </button>
        ))}
        <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5">
          <span>Mais Filtros</span>
          <Filter className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
