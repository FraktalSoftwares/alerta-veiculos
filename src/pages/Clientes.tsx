import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { ClientPageHeader } from "@/components/clients/ClientPageHeader";
import { ClientTable } from "@/components/clients/ClientTable";
import { ClientPagination } from "@/components/clients/ClientPagination";
import { NewClientModal } from "@/components/clients/NewClientModal";
import { EditClientModal } from "@/components/clients/EditClientModal";
import { DeleteClientDialog } from "@/components/clients/DeleteClientDialog";
import { ClientFilterModal, ClientFilterValues } from "@/components/clients/ClientFilterModal";
import { useClients } from "@/hooks/useClients";
import { ClientDisplay } from "@/types/client";
import { Loader2 } from "lucide-react";

const DEFAULT_FILTERS: ClientFilterValues = {
  trackerStatuses: ["tracked", "no_signal", "offline", "blocked"],
  clientStatus: undefined,
  dateFrom: "",
  dateTo: "",
};

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
    trackerStatuses: filters.trackerStatuses,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
  });

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
        ) : data?.clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-muted-foreground mb-2">Nenhum cliente encontrado</p>
            <p className="text-sm text-muted-foreground">
              {searchValue ? 'Tente uma busca diferente' : 'Clique em "Novo" para adicionar seu primeiro cliente'}
            </p>
          </div>
        ) : (
          <>
            <ClientTable 
              clients={data?.clients || []} 
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
      />
    </div>
  );
};

export default Clientes;
