import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { VehiclePageHeader } from "@/components/vehicles/VehiclePageHeader";
import { VehicleTable } from "@/components/vehicles/VehicleTable";
import { VehiclePagination } from "@/components/vehicles/VehiclePagination";
import { NewVehicleModal } from "@/components/vehicles/NewVehicleModal";
import { EditVehicleModal } from "@/components/vehicles/EditVehicleModal";
import { DeleteVehicleDialog } from "@/components/vehicles/DeleteVehicleDialog";
import { VehicleDetailsModal } from "@/components/vehicles/VehicleDetailsModal";
import { VehicleFilterModal } from "@/components/vehicles/VehicleFilterModal";
import { useVehicles, useBlockVehicle } from "@/hooks/useVehicles";
import { VehicleDisplay } from "@/types/vehicle";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Veiculos = () => {
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleDisplay | null>(null);
  const [filters, setFilters] = useState<{ status?: string; clientId?: string }>({});
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const itemsPerPage = 100;
  
  const { data, isLoading } = useVehicles({
    search: searchValue,
    status: filters.status,
    clientId: filters.clientId,
    page: currentPage,
    pageSize: itemsPerPage,
  });

  const blockVehicle = useBlockVehicle();

  const handleFilterClick = () => {
    setIsFilterModalOpen(true);
  };

  const handleApplyFilters = (newFilters: { status?: string; clientId?: string }) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  const handleNewVehicleClick = () => {
    setIsModalOpen(true);
  };

  const handleVehicleClick = (vehicle: VehicleDisplay) => {
    navigate(`/veiculos/${vehicle.id}/mapa`);
  };

  const handleBlockVehicle = (vehicle: VehicleDisplay) => {
    const shouldBlock = vehicle.status !== 'bloqueado';
    blockVehicle.mutate({ id: vehicle.id, block: shouldBlock });
  };

  const handleEditVehicle = (vehicle: VehicleDisplay) => {
    setSelectedVehicle(vehicle);
    setIsEditModalOpen(true);
  };

  const handleDeleteVehicle = (vehicle: VehicleDisplay) => {
    setSelectedVehicle(vehicle);
    setIsDeleteDialogOpen(true);
  };

  const handleShowDetails = (vehicle: VehicleDisplay) => {
    setSelectedVehicle(vehicle);
    setIsDetailsModalOpen(true);
  };

  const handleShowOnMap = () => {
    if (selectedVehicle) {
      navigate(`/veiculos/${selectedVehicle.id}/mapa`);
      setIsDetailsModalOpen(false);
    }
  };

  const handleBlockFromModal = () => {
    if (selectedVehicle) {
      const shouldBlock = selectedVehicle.status !== 'bloqueado';
      blockVehicle.mutate({ id: selectedVehicle.id, block: shouldBlock });
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      
      <main className="px-[50px] py-8">
        <VehiclePageHeader
          title="Gestão de Veículos"
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onFilterClick={handleFilterClick}
          onNewVehicleClick={handleNewVehicleClick}
          hasFilters={!!(filters.status || filters.clientId)}
        />
        
        <VehicleTable 
          vehicles={data?.vehicles || []} 
          onVehicleClick={handleVehicleClick}
          onEditVehicle={handleEditVehicle}
          onDeleteVehicle={handleDeleteVehicle}
          onBlockVehicle={handleBlockVehicle}
          onShowDetails={handleShowDetails}
          isLoading={isLoading}
        />
        
        <VehiclePagination
          currentPage={currentPage}
          totalPages={data?.totalPages || 1}
          totalItems={data?.total || 0}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </main>

      <NewVehicleModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />


      <EditVehicleModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedVehicle(null);
        }}
        vehicle={selectedVehicle}
      />

      <DeleteVehicleDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedVehicle(null);
        }}
        vehicle={selectedVehicle}
      />

      <VehicleDetailsModal
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        vehicle={selectedVehicle}
        onShowOnMap={handleShowOnMap}
        onBlockVehicle={handleBlockFromModal}
      />

      <VehicleFilterModal
        open={isFilterModalOpen}
        onOpenChange={setIsFilterModalOpen}
        filters={filters}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
      />
    </div>
  );
};

export default Veiculos;
