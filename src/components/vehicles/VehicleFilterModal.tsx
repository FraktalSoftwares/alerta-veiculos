import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { useClients } from "@/hooks/useClients";
import { Badge } from "@/components/ui/badge";

interface VehicleFilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: {
    status?: string;
    clientId?: string;
  };
  onApplyFilters: (filters: { status?: string; clientId?: string }) => void;
  onClearFilters: () => void;
}

export function VehicleFilterModal({
  open,
  onOpenChange,
  filters,
  onApplyFilters,
  onClearFilters,
}: VehicleFilterModalProps) {
  const [status, setStatus] = useState<string>(filters.status || "");
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string>(filters.clientId || "");

  // Buscar clientes para o filtro (apenas quando há busca)
  const { data: clientsData } = useClients({
    search: clientSearch || undefined,
    pageSize: 50,
  });

  // Atualizar estados quando os filtros mudarem externamente
  useEffect(() => {
    setStatus(filters.status || "");
    setSelectedClientId(filters.clientId || "");
  }, [filters]);

  const selectedClient = clientsData?.clients?.find((c) => c.id === selectedClientId);

  const handleApply = () => {
    onApplyFilters({
      status: status || undefined,
      clientId: selectedClientId || undefined,
    });
    onOpenChange(false);
  };

  const handleClear = () => {
    setStatus("");
    setSelectedClientId("");
    setClientSearch("");
    onClearFilters();
    onOpenChange(false);
  };

  const hasActiveFilters = status || selectedClientId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Filtros de Veículos</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Filtro por Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os status</SelectItem>
                <SelectItem value="active">Ativo (Rastreando)</SelectItem>
                <SelectItem value="inactive">Inativo (Desligado)</SelectItem>
                <SelectItem value="blocked">Bloqueado</SelectItem>
                <SelectItem value="maintenance">Manutenção</SelectItem>
                <SelectItem value="no_signal">Sem Sinal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Cliente */}
          <div className="space-y-2">
            <Label>Cliente</Label>
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente..."
                  value={clientSearch}
                  onChange={(e) => {
                    setClientSearch(e.target.value);
                    if (!e.target.value) {
                      setSelectedClientId("");
                    }
                  }}
                  className="pl-10"
                />
              </div>
              
              {selectedClient && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="flex-1 justify-between">
                    <span>{selectedClient.name}</span>
                    <button
                      onClick={() => {
                        setSelectedClientId("");
                        setClientSearch("");
                      }}
                      className="ml-2 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                </div>
              )}

              {clientSearch && !selectedClient && clientsData?.clients && clientsData.clients.length > 0 && (
                <div className="border border-border rounded-md max-h-48 overflow-y-auto">
                  {clientsData.clients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => {
                        setSelectedClientId(client.id);
                        setClientSearch(client.name);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-accent transition-colors text-sm"
                    >
                      {client.name}
                    </button>
                  ))}
                </div>
              )}

              {clientSearch && !selectedClient && clientsData?.clients && clientsData.clients.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Nenhum cliente encontrado
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleClear} disabled={!hasActiveFilters}>
            Limpar Filtros
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleApply}>Aplicar Filtros</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

