import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface StockFiltersState {
  search: string;
  status: string;
  modality: "" | "installed" | "available" | "in_store";
}

interface StockFiltersProps {
  value: StockFiltersState;
  onChange: (next: StockFiltersState) => void;
}

const STATUS_OPTIONS = [
  { value: "all", label: "Todas situações" },
  { value: "funcionando", label: "Funcionando" },
  { value: "manutencao", label: "Manutenção" },
  { value: "defeito", label: "Defeito" },
  { value: "na_loja", label: "Na loja" },
];

const MODALITY_OPTIONS = [
  { value: "all", label: "Todas modalidades" },
  { value: "installed", label: "Instalado" },
  { value: "available", label: "Disponível" },
  { value: "in_store", label: "Na loja" },
];

export function StockFilters({ value, onChange }: StockFiltersProps) {
  const hasFilters = value.search || value.status || value.modality;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por serial, IMEI, modelo, chip..."
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
          className="pl-9"
        />
      </div>

      <Select
        value={value.status || "all"}
        onValueChange={(v) => onChange({ ...value, status: v === "all" ? "" : v })}
      >
        <SelectTrigger className="sm:w-[180px]">
          <SelectValue placeholder="Situação" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.modality || "all"}
        onValueChange={(v) => onChange({ ...value, modality: v === "all" ? "" : (v as StockFiltersState["modality"]) })}
      >
        <SelectTrigger className="sm:w-[180px]">
          <SelectValue placeholder="Modalidade" />
        </SelectTrigger>
        <SelectContent>
          {MODALITY_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange({ search: "", status: "", modality: "" })}
          className="gap-1"
        >
          <X className="h-4 w-4" />
          Limpar
        </Button>
      )}
    </div>
  );
}
