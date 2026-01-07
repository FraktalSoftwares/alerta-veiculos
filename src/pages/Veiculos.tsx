import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { VehiclePageHeader } from "@/components/vehicles/VehiclePageHeader";
import { VehicleTable } from "@/components/vehicles/VehicleTable";
import { VehiclePagination } from "@/components/vehicles/VehiclePagination";
import { NewVehicleModal } from "@/components/vehicles/NewVehicleModal";
import { EditVehicleModal } from "@/components/vehicles/EditVehicleModal";
import { DeleteVehicleDialog } from "@/components/vehicles/DeleteVehicleDialog";
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
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleDisplay | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const itemsPerPage = 100;
  
  const { data, isLoading } = useVehicles({
    search: searchValue,
    page: currentPage,
    pageSize: itemsPerPage,
  });

  const blockVehicle = useBlockVehicle();

  const handleFilterClick = () => {
    toast({
      title: "Filtros",
      description: "Funcionalidade de filtros será implementada em breve.",
    });
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
        />
        
        <VehicleTable 
          vehicles={data?.vehicles || []} 
          onVehicleClick={handleVehicleClick}
          onEditVehicle={handleEditVehicle}
          onDeleteVehicle={handleDeleteVehicle}
          onBlockVehicle={handleBlockVehicle}
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
    </div>
  );
};

export default Veiculos;
