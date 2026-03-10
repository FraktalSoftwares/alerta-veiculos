import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Filter, FileText } from "lucide-react";
import { useClients } from "@/hooks/useClients";
import { cn } from "@/lib/utils";

const TRACKER_STATUSES = [
  { value: "ligado", label: "Ligado" },
  { value: "com_sinal", label: "Com sinal" },
  { value: "desligado", label: "Desligado" },
  { value: "sem_sinal", label: "Sem sinal" },
] as const;

const OPERATORS = ["Vivo", "Claro", "Tim"] as const;

const VEHICLE_TYPES = [
  "Carro",
  "Motocicleta",
  "Onibus",
  "Caminhao",
] as const;

export interface VehicleFilters {
  trackerStatuses: string[];
  operators: string[];
  vehicleTypes: string[];
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const EMPTY_FILTERS: VehicleFilters = {
  trackerStatuses: ["ligado", "com_sinal", "desligado", "sem_sinal"],
  operators: [],
  vehicleTypes: [],
  clientId: undefined,
  dateFrom: undefined,
  dateTo: undefined,
};

interface VehicleFilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: VehicleFilters;
  onApplyFilters: (filters: VehicleFilters) => void;
  onClearFilters: () => void;
  onExportCsv?: () => void;
}

function ToggleChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-1 rounded-full border text-sm transition-colors",
        selected
          ? "bg-foreground text-background border-foreground"
          : "bg-background text-foreground border-border hover:bg-accent"
      )}
    >
      {label}
    </button>
  );
}

export function VehicleFilterModal({
  open,
  onOpenChange,
  filters,
  onApplyFilters,
  onClearFilters,
  onExportCsv,
}: VehicleFilterModalProps) {
  const [trackerStatuses, setTrackerStatuses] = useState<string[]>(filters.trackerStatuses);
  const [operators, setOperators] = useState<string[]>(filters.operators);
  const [vehicleTypes, setVehicleTypes] = useState<string[]>(filters.vehicleTypes);
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string>(filters.clientId || "");
  const [dateFrom, setDateFrom] = useState(filters.dateFrom || "");
  const [dateTo, setDateTo] = useState(filters.dateTo || "");

  const { data: clientsData } = useClients({
    search: clientSearch || undefined,
    pageSize: 20,
  });

  useEffect(() => {
    setTrackerStatuses(filters.trackerStatuses);
    setOperators(filters.operators);
    setVehicleTypes(filters.vehicleTypes);
    setSelectedClientId(filters.clientId || "");
    setDateFrom(filters.dateFrom || "");
    setDateTo(filters.dateTo || "");
  }, [filters]);

  const selectedClient = clientsData?.clients?.find((c) => c.id === selectedClientId);

  const toggleTrackerStatus = (value: string) => {
    setTrackerStatuses((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  };

  const toggleOperator = (value: string) => {
    setOperators((prev) =>
      prev.includes(value) ? prev.filter((o) => o !== value) : [...prev, value]
    );
  };

  const toggleVehicleType = (value: string) => {
    setVehicleTypes((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    );
  };

  const handleApply = () => {
    onApplyFilters({
      trackerStatuses,
      operators,
      vehicleTypes,
      clientId: selectedClientId || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
    onOpenChange(false);
  };

  const handleClear = () => {
    onClearFilters();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filtrar Veiculos</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Status do rastreador */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Status do rastreador</Label>
            <div className="space-y-2">
              {TRACKER_STATUSES.map((status) => (
                <div key={status.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`status-${status.value}`}
                    checked={trackerStatuses.includes(status.value)}
                    onCheckedChange={() => toggleTrackerStatus(status.value)}
                  />
                  <label
                    htmlFor={`status-${status.value}`}
                    className="text-sm cursor-pointer select-none"
                  >
                    {status.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-border" />

          {/* Operadora */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Operadora</Label>
            <div className="flex flex-wrap gap-2">
              {OPERATORS.map((op) => (
                <ToggleChip
                  key={op}
                  label={op}
                  selected={operators.includes(op)}
                  onClick={() => toggleOperator(op)}
                />
              ))}
            </div>
          </div>

          {/* Tipo de veiculo */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Tipo de veiculo</Label>
            <div className="flex flex-wrap gap-2">
              {VEHICLE_TYPES.map((type) => (
                <ToggleChip
                  key={type}
                  label={type}
                  selected={vehicleTypes.includes(type)}
                  onClick={() => toggleVehicleType(type)}
                />
              ))}
            </div>
          </div>

          {/* Cliente */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Cliente</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por cliente"
                value={selectedClient ? selectedClient.name : clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  if (!e.target.value) setSelectedClientId("");
                }}
                onFocus={() => {
                  if (selectedClient) {
                    setClientSearch(selectedClient.name);
                    setSelectedClientId("");
                  }
                }}
                className="pl-10"
              />
            </div>
            {clientSearch && !selectedClientId && clientsData?.clients && clientsData.clients.length > 0 && (
              <div className="border border-border rounded-md max-h-40 overflow-y-auto">
                {clientsData.clients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => {
                      setSelectedClientId(client.id);
                      setClientSearch("");
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-accent transition-colors text-sm"
                  >
                    {client.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ultima atualizacao */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Ultima atualizacao</Label>
            <p className="text-sm text-muted-foreground">Selecione o periodo:</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-sm">Inicio</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Fim</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onExportCsv} className="gap-2 text-muted-foreground">
            Gerar relatorio
            <FileText className="h-4 w-4" />
          </Button>
          <Button onClick={handleApply} className="gap-2 bg-[#C4A35A] hover:bg-[#B3933F] text-white">
            Filtrar
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
