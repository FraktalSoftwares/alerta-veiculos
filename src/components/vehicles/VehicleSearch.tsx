import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface VehicleSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function VehicleSearch({ value, onChange, placeholder = "Buscar veículo" }: VehicleSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground w-64 focus-visible:ring-primary"
      />
    </div>
  );
}
