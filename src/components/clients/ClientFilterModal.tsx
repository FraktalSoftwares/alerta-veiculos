import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { X, Filter, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ClientFilterValues {
  trackerStatuses: string[];
  clientStatus: string | undefined;
  dateFrom: string;
  dateTo: string;
}

interface ClientFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: ClientFilterValues) => void;
  initialValues?: ClientFilterValues;
}

const TRACKER_STATUS_OPTIONS = [
  { value: "tracked", label: "Rastreados" },
  { value: "no_signal", label: "Sem sinal" },
  { value: "offline", label: "Desligados" },
  { value: "blocked", label: "Bloqueado" },
];

const CLIENT_STATUS_OPTIONS = [
  { value: "active", label: "Ativo" },
  { value: "inactive", label: "Inativo" },
  { value: undefined, label: "Todos" },
] as const;

const DEFAULT_FILTERS: ClientFilterValues = {
  trackerStatuses: ["tracked", "no_signal", "offline", "blocked"],
  clientStatus: undefined,
  dateFrom: "",
  dateTo: "",
};

export function ClientFilterModal({
  isOpen,
  onClose,
  onApply,
  initialValues,
}: ClientFilterModalProps) {
  const [filters, setFilters] = useState<ClientFilterValues>(
    initialValues ?? DEFAULT_FILTERS
  );

  // Sync local state when modal opens with new initialValues
  useEffect(() => {
    if (isOpen && initialValues) {
      setFilters(initialValues);
    }
  }, [isOpen, initialValues]);

  const handleTrackerToggle = (value: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      trackerStatuses: checked
        ? [...prev.trackerStatuses, value]
        : prev.trackerStatuses.filter((s) => s !== value),
    }));
  };

  const handleClientStatusChange = (value: string | undefined) => {
    setFilters((prev) => ({ ...prev, clientStatus: value }));
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[1113px] p-0 gap-0 overflow-hidden rounded-lg border-none [&>button:last-child]:hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 bg-[#f7f7f5] border-b border-[#f0efed] rounded-t-2xl">
          <h2 className="text-xl font-normal text-[#2e2e2d] font-[Rubik,sans-serif]">
            Filtrar Clientes
          </h2>
          <button
            onClick={onClose}
            className="p-2.5 bg-[#fcfcfa] rounded-sm hover:bg-[#f0efed] transition-colors"
          >
            <X className="h-6 w-6 text-[#2e2e2d]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-6 px-8 pt-4 pb-5">
          <div className="bg-[#fcfcfa] border border-[#f7f7f5] rounded-lg p-4 flex flex-col gap-6">
            {/* Status do rastreador */}
            <div className="flex flex-col gap-4">
              <h3 className="text-xl font-normal text-[#2e2e2d] font-[Rubik,sans-serif]">
                Status do rastreador
              </h3>
              <div className="flex flex-col gap-4">
                {TRACKER_STATUS_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={filters.trackerStatuses.includes(option.value)}
                      onCheckedChange={(checked) =>
                        handleTrackerToggle(option.value, checked === true)
                      }
                      className="h-6 w-6 rounded border-none bg-[#2e2e2d] data-[state=checked]:bg-[#2e2e2d] data-[state=checked]:text-white"
                    />
                    <span className="text-base text-[#3d3d3c] font-normal tracking-[-0.32px] leading-[26px]">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Separator */}
            <div className="h-px bg-[#f0efed]" />

            {/* Situação do cliente */}
            <div className="flex flex-col gap-4">
              <h3 className="text-xl font-normal text-[#2e2e2d] font-[Rubik,sans-serif]">
                Situação do cliente
              </h3>
              <div className="flex gap-2">
                {CLIENT_STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => handleClientStatusChange(option.value)}
                    className={cn(
                      "px-2.5 py-1 rounded-full border text-base font-medium transition-colors",
                      filters.clientStatus === option.value
                        ? "bg-[#2e2e2d] text-white border-[#2e2e2d]"
                        : "bg-transparent text-[#2e2e2d] border-[#2e2e2d] hover:bg-[#f0efed]"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Separator */}
            <div className="h-px bg-[#f0efed]" />

            {/* Última atualização */}
            <div className="flex flex-col gap-4">
              <h3 className="text-xl font-normal text-[#2e2e2d] font-[Rubik,sans-serif]">
                Última atualização
              </h3>
              <div className="flex flex-col gap-2">
                <p className="text-base font-normal text-[#4a4a48] font-[Rubik,sans-serif]">
                  Selecione o período:
                </p>
                <div className="flex gap-8 max-w-[501px]">
                  <div className="flex-1 flex flex-col gap-2">
                    <Label className="pl-3 text-base font-medium text-[#4a4a48]">
                      Início
                    </Label>
                    <Input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          dateFrom: e.target.value,
                        }))
                      }
                      className="h-12 border-[#b2b2b1] rounded-md text-base text-[#4a4a48] bg-transparent"
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    <Label className="pl-3 text-base font-medium text-[#4a4a48]">
                      Fim
                    </Label>
                    <Input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          dateTo: e.target.value,
                        }))
                      }
                      className="h-12 border-[#b2b2b1] rounded-md text-base text-[#4a4a48] bg-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-8">
            <button
              type="button"
              className="flex items-center gap-1 px-2 py-2.5 text-sm font-normal text-[#4a4a48] hover:text-[#2e2e2d] transition-colors font-[Rubik,sans-serif]"
            >
              Gerar relatório
              <FileText className="h-6 w-6" />
            </button>
            <Button
              onClick={handleApply}
              className="bg-[#1a1919] hover:bg-[#2e2e2d] text-[#e3e2e1] px-6 py-3 h-auto rounded text-base font-normal font-[Rubik,sans-serif] flex items-center gap-2"
            >
              Filtrar
              <Filter className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
