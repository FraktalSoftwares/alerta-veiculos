import { useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { FinancePageHeader } from "@/components/finance/FinancePageHeader";
import { FinanceCard } from "@/components/finance/FinanceCard";
import { FinanceTable } from "@/components/finance/FinanceTable";
import { FinancePagination } from "@/components/finance/FinancePagination";
import { NewRevenueModal } from "@/components/finance/NewRevenueModal";
import { EditFinanceModal } from "@/components/finance/EditFinanceModal";
import { DeleteFinanceDialog } from "@/components/finance/DeleteFinanceDialog";
import { useFinanceRecords, useFinanceSummary } from "@/hooks/useFinance";
import { FinanceRecordDisplay } from "@/types/finance";

const Financeiro = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FinanceRecordDisplay | null>(null);
  
  const itemsPerPage = 10;
  
  const { data: recordsData, isLoading } = useFinanceRecords({
    type: "revenue",
    page: currentPage,
    limit: itemsPerPage,
  });

  const { data: summary } = useFinanceSummary("revenue");

  const records = recordsData?.records || [];
  const totalItems = recordsData?.total || 0;
  const totalPages = recordsData?.totalPages || 1;

  const handleNewClick = () => {
    setIsModalOpen(true);
  };

  const handleRecordClick = (record: FinanceRecordDisplay) => {
    setSelectedRecord(record);
    setIsEditModalOpen(true);
  };

  const handleEditRecord = (record: FinanceRecordDisplay) => {
    setSelectedRecord(record);
    setIsEditModalOpen(true);
  };

  const handleDeleteRecord = (record: FinanceRecordDisplay) => {
    setSelectedRecord(record);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      
      <main className="px-[50px] py-8">
        <FinancePageHeader
          title="Receitas"
          onNewClick={handleNewClick}
          newButtonLabel="Gerar nova receita"
        />
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <FinanceCard
            icon={TrendingDown}
            label="Previsto"
            value={summary?.formattedPredicted || "R$ 0,00"}
            variant="blue"
          />
          <FinanceCard
            icon={TrendingUp}
            label="Recebido"
            value={summary?.formattedReceived || "R$ 0,00"}
            variant="green"
          />
          <FinanceCard
            icon={TrendingDown}
            label="Em débito"
            value={summary?.formattedOverdue || "R$ 0,00"}
            variant="red"
          />
        </div>
        
        {/* Table */}
        <FinanceTable
          records={records}
          onRecordClick={handleRecordClick}
          onEditRecord={handleEditRecord}
          onDeleteRecord={handleDeleteRecord}
          isLoading={isLoading}
        />
        
        <FinancePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />

        <NewRevenueModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
        />

        <EditFinanceModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedRecord(null);
          }}
          record={selectedRecord}
        />

        <DeleteFinanceDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setSelectedRecord(null);
          }}
          record={selectedRecord}
        />
      </main>
    </div>
  );
};

export default Financeiro;
