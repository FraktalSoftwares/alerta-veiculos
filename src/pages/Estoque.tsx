import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { StockPageHeader } from "@/components/stock/StockPageHeader";
import { StockTable } from "@/components/stock/StockTable";
import { StockPagination } from "@/components/stock/StockPagination";
import { NewEquipmentModal } from "@/components/stock/NewEquipmentModal";
import { DeleteEquipmentDialog } from "@/components/stock/DeleteEquipmentDialog";
import { useEquipments } from "@/hooks/useEquipment";
import { EquipmentDisplay } from "@/types/equipment";

const Estoque = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentDisplay | null>(null);
  
  const itemsPerPage = 100;
  
  const { data, isLoading } = useEquipments({
    page: currentPage,
    pageSize: itemsPerPage,
  });

  const handleNewClick = () => {
    setSelectedEquipment(null);
    setIsModalOpen(true);
  };

  const handleEquipmentClick = (equipment: EquipmentDisplay) => {
    setSelectedEquipment(equipment);
    setIsModalOpen(true);
  };

  const handleEditEquipment = (equipment: EquipmentDisplay) => {
    setSelectedEquipment(equipment);
    setIsModalOpen(true);
  };

  const handleDeleteEquipment = (equipment: EquipmentDisplay) => {
    setSelectedEquipment(equipment);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      
      <main className="px-[50px] py-8">
        <StockPageHeader
          title="Estoque de equipamentos"
          onNewClick={handleNewClick}
        />
        
        <StockTable 
          equipments={data?.equipments || []} 
          onEquipmentClick={handleEquipmentClick}
          onEditEquipment={handleEditEquipment}
          onDeleteEquipment={handleDeleteEquipment}
          isLoading={isLoading}
        />
        
        <StockPagination
          currentPage={currentPage}
          totalPages={data?.totalPages || 1}
          totalItems={data?.total || 0}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </main>

      <NewEquipmentModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            setSelectedEquipment(null);
          }
        }}
        equipment={selectedEquipment}
      />

      <DeleteEquipmentDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedEquipment(null);
        }}
        equipment={selectedEquipment}
      />
    </div>
  );
};

export default Estoque;
