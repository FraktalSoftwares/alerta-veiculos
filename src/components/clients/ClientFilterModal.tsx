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
import { Filter, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const CLIENT_STATUS_OPTIONS = [
  { value: "active", label: "Ativo" },
  { value: "inactive", label: "Inativo" },
] as const;

export interface ClientFilterValues {
  clientStatus: string | undefined;
  dateFrom: string;
  dateTo: string;
}

export const DEFAULT_FILTERS: ClientFilterValues = {
  clientStatus: undefined,
  dateFrom: "",
  dateTo: "",
};

interface ClientFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: ClientFilterValues) => void;
  initialValues?: ClientFilterValues;
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

export function ClientFilterModal({
  isOpen,
  onClose,
  onApply,
  initialValues,
  onExportCsv,
}: ClientFilterModalProps) {
  const [clientStatus, setClientStatus] = useState<string | undefined>(
    initialValues?.clientStatus
  );
  const [dateFrom, setDateFrom] = useState(initialValues?.dateFrom || "");
  const [dateTo, setDateTo] = useState(initialValues?.dateTo || "");

  useEffect(() => {
    if (isOpen && initialValues) {
      setClientStatus(initialValues.clientStatus);
      setDateFrom(initialValues.dateFrom || "");
      setDateTo(initialValues.dateTo || "");
    }
  }, [isOpen, initialValues]);

  const toggleClientStatus = (value: string) => {
    setClientStatus((prev) => (prev === value ? undefined : value));
  };

  const handleApply = () => {
    onApply({
      clientStatus,
      dateFrom,
      dateTo,
    });
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filtrar Clientes</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Situação do cliente */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Situação do cliente</Label>
            <div className="flex flex-wrap gap-2">
              {CLIENT_STATUS_OPTIONS.map((option) => (
                <ToggleChip
                  key={option.value}
                  label={option.label}
                  selected={clientStatus === option.value}
                  onClick={() => toggleClientStatus(option.value)}
                />
              ))}
            </div>
          </div>

          <hr className="border-border" />

          {/* Última atualização */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Última atualização</Label>
            <p className="text-sm text-muted-foreground">Selecione o período:</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-sm">Início</Label>
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
            Gerar relatório
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
