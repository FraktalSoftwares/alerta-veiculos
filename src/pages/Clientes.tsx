import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { ClientPageHeader } from "@/components/clients/ClientPageHeader";
import { ClientTable } from "@/components/clients/ClientTable";
import { ClientPagination } from "@/components/clients/ClientPagination";
import { NewClientModal } from "@/components/clients/NewClientModal";
import { EditClientModal } from "@/components/clients/EditClientModal";
import { DeleteClientDialog } from "@/components/clients/DeleteClientDialog";
import { useClients } from "@/hooks/useClients";
import { ClientDisplay } from "@/types/client";
import { Loader2 } from "lucide-react";

const Clientes = () => {
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientDisplay | null>(null);
  const navigate = useNavigate();
  
  const itemsPerPage = 100;

  const { data, isLoading, error } = useClients({
    search: searchValue,
    page: currentPage,
    pageSize: itemsPerPage,
  });

  const handleFilterClick = () => {
    // TODO: Implement filter modal
  };

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
      
      <main className="px-[50px] py-8">
        <ClientPageHeader
          title="Gestão de Clientes"
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onFilterClick={handleFilterClick}
          onNewClientClick={handleNewClientClick}
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
    </div>
  );
};

export default Clientes;
