import { useState, useMemo, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { VehiclePageHeader } from "@/components/vehicles/VehiclePageHeader";
import { VehicleTable } from "@/components/vehicles/VehicleTable";
import { VehiclePagination } from "@/components/vehicles/VehiclePagination";
import { NewVehicleModal } from "@/components/vehicles/NewVehicleModal";
import { EditVehicleModal } from "@/components/vehicles/EditVehicleModal";
import { DeleteVehicleDialog } from "@/components/vehicles/DeleteVehicleDialog";
import { VehicleDetailsModal } from "@/components/vehicles/VehicleDetailsModal";
import { VehicleFilterModal, VehicleFilters, EMPTY_FILTERS } from "@/components/vehicles/VehicleFilterModal";
import { useVehicles, useBlockVehicle } from "@/hooks/useVehicles";
import { useMultipleVehicleConnections } from "@/hooks/useVehicleConnection";
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
  const [filters, setFilters] = useState<VehicleFilters>(EMPTY_FILTERS);
  const { toast } = useToast();
  const navigate = useNavigate();

  const itemsPerPage = 100;

  const { data, isLoading } = useVehicles({
    search: searchValue,
    operators: filters.operators,
    vehicleTypes: filters.vehicleTypes,
    clientId: filters.clientId,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    page: currentPage,
    pageSize: itemsPerPage,
  });

  // Fetch real-time connection status for all vehicles
  const vehicles = data?.vehicles || [];
  const imeis = useMemo(() => vehicles.map((v) => (v.imei && v.imei !== '-' ? v.imei : null)), [vehicles]);
  const { data: connectionMap } = useMultipleVehicleConnections(imeis);

  // Filter by real-time connection status (STATUS column)
  const filteredVehicles = useMemo(() => {
    const allSelected = filters.trackerStatuses.length === 4;
    const noneSelected = filters.trackerStatuses.length === 0;

    if (allSelected) return vehicles;
    if (noneSelected) return [];

    const showConnected = filters.trackerStatuses.includes('ligado') || filters.trackerStatuses.includes('com_sinal');
    const showDisconnected = filters.trackerStatuses.includes('desligado') || filters.trackerStatuses.includes('sem_sinal');

    return vehicles.filter((vehicle) => {
      const isBlocked = vehicle.status === 'bloqueado';
      if (isBlocked) return true; // always show blocked

      const imei = vehicle.imei && vehicle.imei !== '-' ? vehicle.imei : null;
      const isConnected = imei ? connectionMap?.[imei] === true : false;

      if (isConnected && showConnected) return true;
      if (!isConnected && showDisconnected) return true;
      return false;
    });
  }, [vehicles, filters.trackerStatuses, connectionMap]);

  const blockVehicle = useBlockVehicle();

  const handleFilterClick = () => {
    setIsFilterModalOpen(true);
  };

  const handleApplyFilters = (newFilters: VehicleFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters(EMPTY_FILTERS);
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

  const handleExportCsv = useCallback(() => {
    if (filteredVehicles.length === 0) {
      toast({ title: "Nenhum veículo para exportar", description: "Aplique filtros que retornem resultados." });
      return;
    }

    const headers = ["Cliente", "Tipo", "Placa", "IMEI", "Rastreador", "Operadora", "Marca", "Modelo", "Ano", "Cor", "Status"];
    const rows = filteredVehicles.map((v) => {
      const imei = v.imei && v.imei !== '-' ? v.imei : null;
      const isConnected = imei ? connectionMap?.[imei] === true : false;
      const isBlocked = v.status === 'bloqueado';
      const statusLabel = isBlocked ? "Bloqueado" : isConnected ? "Ligado" : "Desligado";

      return [
        v.clientName,
        v.type || "",
        v.plate,
        v.imei || "",
        v.tracker || "",
        v.operator || "",
        v.brand || "",
        v.model || "",
        v.year?.toString() || "",
        v.color || "",
        statusLabel,
      ].map((field) => `"${field.replace(/"/g, '""')}"`).join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `veiculos_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filteredVehicles, connectionMap, toast]);

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      
      <main className="px-4 sm:px-6 lg:px-12 py-4 sm:py-6 lg:py-8">
        <VehiclePageHeader
          title="Gestão de Veículos"
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onFilterClick={handleFilterClick}
          onNewVehicleClick={handleNewVehicleClick}
          hasFilters={!!(filters.clientId || filters.operators.length > 0 || filters.vehicleTypes.length > 0 || filters.dateFrom || filters.dateTo || filters.trackerStatuses.length < 4)}
        />
        
        <VehicleTable
          vehicles={filteredVehicles}
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
        onExportCsv={handleExportCsv}
      />
    </div>
  );
};

export default Veiculos;
