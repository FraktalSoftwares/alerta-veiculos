import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { ClientPageHeader } from "@/components/clients/ClientPageHeader";
import { ClientTable } from "@/components/clients/ClientTable";
import { ClientPagination } from "@/components/clients/ClientPagination";
import { NewClientModal } from "@/components/clients/NewClientModal";
import { EditClientModal } from "@/components/clients/EditClientModal";
import { DeleteClientDialog } from "@/components/clients/DeleteClientDialog";
import { ClientFilterModal, ClientFilterValues, DEFAULT_FILTERS } from "@/components/clients/ClientFilterModal";
import { useClients } from "@/hooks/useClients";
import { useMultipleVehicleConnections } from "@/hooks/useVehicleConnection";
import { ClientDisplay } from "@/types/client";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Clientes = () => {
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientDisplay | null>(null);
  const [filters, setFilters] = useState<ClientFilterValues>(DEFAULT_FILTERS);
  const navigate = useNavigate();
  const { toast } = useToast();

  const itemsPerPage = 100;

  // Check if any filter is active (different from defaults)
  const hasActiveFilters =
    filters.clientStatus !== undefined ||
    filters.trackerStatuses.length < 4 ||
    filters.dateFrom !== "" ||
    filters.dateTo !== "";

  const { data, isLoading, error } = useClients({
    search: searchValue,
    page: currentPage,
    pageSize: itemsPerPage,
    status: filters.clientStatus,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
  });

  const clients = data?.clients || [];
  const clientImeis = data?.clientImeis || {};

  // Collect all IMEIs from all clients for batch connection check
  const allImeis = useMemo(() => {
    const imeis: (string | null)[] = [];
    Object.values(clientImeis).forEach((clientImeiList) => {
      clientImeiList.forEach((imei) => imeis.push(imei));
    });
    return imeis;
  }, [clientImeis]);

  const { data: connectionMap } = useMultipleVehicleConnections(allImeis);

  // Filter clients by real-time tracker status
  const filteredClients = useMemo(() => {
    const allSelected = filters.trackerStatuses.length === 4;
    const noneSelected = filters.trackerStatuses.length === 0;

    if (allSelected) return clients;
    if (noneSelected) return [];

    const showConnected = filters.trackerStatuses.includes('ligado') || filters.trackerStatuses.includes('com_sinal');
    const showDisconnected = filters.trackerStatuses.includes('desligado') || filters.trackerStatuses.includes('sem_sinal');

    return clients.filter((client) => {
      const imeis = clientImeis[client.id] || [];
      if (imeis.length === 0) return showDisconnected; // No equipment = disconnected

      const hasConnected = imeis.some((imei) => connectionMap?.[imei] === true);
      const hasDisconnected = imeis.some((imei) => connectionMap?.[imei] !== true);

      if (hasConnected && showConnected) return true;
      if (hasDisconnected && showDisconnected) return true;
      return false;
    });
  }, [clients, filters.trackerStatuses, clientImeis, connectionMap]);

  const handleFilterClick = () => {
    setIsFilterModalOpen(true);
  };

  const handleApplyFilters = useCallback((newFilters: ClientFilterValues) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const handleNewClientClick = () => {
    setIsNewClientModalOpen(true);
  };

  const handleClientClick = (client: ClientDisplay) => {
    navigate(`/clientes/${client.id}`);
  };

  const handleEditClient = (client: ClientDisplay) => {
    setSelectedClient(client);
    setIsEditModalOpen(true);
  };

  const handleDeleteClient = (client: ClientDisplay) => {
    setSelectedClient(client);
    setIsDeleteDialogOpen(true);
  };

  const handleExportCsv = useCallback(() => {
    if (filteredClients.length === 0) {
      toast({ title: "Nenhum cliente para exportar", description: "Aplique filtros que retornem resultados." });
      return;
    }

    const headers = ["Nome", "Tipo", "Documento", "Telefone", "Email", "Total Veículos", "Rastreando", "Sem Sinal", "Offline", "Última Atualização", "Situação"];
    const rows = filteredClients.map((c) => {
      return [
        c.name,
        c.type,
        c.document_number || "",
        c.phone || "",
        c.email || "",
        c.totalVehicles.toString(),
        c.trackedVehicles.toString(),
        c.noSignal.toString(),
        c.offline.toString(),
        c.lastUpdate,
        c.status,
      ].map((field) => `"${field.replace(/"/g, '""')}"`).join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `clientes_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filteredClients, toast]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="px-4 sm:px-6 lg:px-12 py-4 sm:py-6 lg:py-8">
        <ClientPageHeader
          title="Gestão de Clientes"
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onFilterClick={handleFilterClick}
          onNewClientClick={handleNewClientClick}
          hasFilters={hasActiveFilters}
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-destructive">Erro ao carregar clientes: {error.message}</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-muted-foreground mb-2">Nenhum cliente encontrado</p>
            <p className="text-sm text-muted-foreground">
              {searchValue ? 'Tente uma busca diferente' : 'Clique em "Novo" para adicionar seu primeiro cliente'}
            </p>
          </div>
        ) : (
          <>
            <ClientTable
              clients={filteredClients}
              onClientClick={handleClientClick}
              onEditClient={handleEditClient}
              onDeleteClient={handleDeleteClient}
            />

            <ClientPagination
              currentPage={currentPage}
              totalPages={data?.totalPages || 1}
              totalItems={data?.total || 0}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </main>

      <NewClientModal
        isOpen={isNewClientModalOpen}
        onClose={() => setIsNewClientModalOpen(false)}
      />

      <EditClientModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedClient(null);
        }}
        client={selectedClient}
      />

      <DeleteClientDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedClient(null);
        }}
        client={selectedClient}
      />

      <ClientFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={handleApplyFilters}
        initialValues={filters}
        onExportCsv={handleExportCsv}
      />
    </div>
  );
};

export default Clientes;
