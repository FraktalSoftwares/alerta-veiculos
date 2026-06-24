import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, MapPin } from 'lucide-react';
import { useVehicle } from '@/hooks/useVehicles';
import { useVehicleTrackingHistory, VehicleTrackingData } from '@/hooks/useVehicleTracking';
import { useVehiclePositionRealtime } from '@/hooks/useVehiclePositionRealtime';
import { VehicleBadge } from '@/components/vehicles/VehicleBadge';
import { mapVehicleStatus } from '@/types/vehicle';
import { HistoryFilters } from '@/components/vehicles/history/HistoryFilters';
import { HistoryTrackingCard } from '@/components/vehicles/history/HistoryTrackingCard';
import { HistoryStoppedGroupCard } from '@/components/vehicles/history/HistoryStoppedGroupCard';
import { ExportButton } from '@/components/vehicles/history/ExportButton';
import { ExportPdfButton } from '@/components/vehicles/history/ExportPdfButton';
import { MapboxHistoryView } from '@/components/vehicles/history/MapboxHistoryView';
import { ScrollArea } from '@/components/ui/scroll-area';
import { subDays } from 'date-fns';
import { groupStoppedPoints, HistoryDisplayItem, countOriginalPoints } from '@/utils/groupStoppedPoints';

const statusLabels = {
  rastreando: 'RASTREANDO',
  desligado: 'DESLIGADO',
  'sem-sinal': 'SEM SINAL',
  bloqueado: 'BLOQUEADO',
};

const VeiculoHistorico = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Default: last 24 hours
  const [startDate, setStartDate] = useState(() => {
    const date = subDays(new Date(), 1);
    date.setHours(0, 0, 0, 0);
    return date;
  });
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date;
  });
  const [selectedPoint, setSelectedPoint] = useState<VehicleTrackingData | null>(null);

  useVehiclePositionRealtime(id); // novos pontos entram no histórico ao vivo
  const { data: vehicle, isLoading: isLoadingVehicle } = useVehicle(id || '');
  const {
    data: trackingHistory,
    isLoading: isLoadingHistory
  } = useVehicleTrackingHistory(id || '', startDate, endDate);

  const historyData = trackingHistory || [];
  const displayItems = useMemo(() => groupStoppedPoints(historyData), [historyData]);
  const totalPoints = useMemo(() => countOriginalPoints(displayItems), [displayItems]);

  const handleBack = () => {
    navigate(`/veiculos/${id}/mapa`);
  };

  const handleFilter = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
    setSelectedPoint(null);
  };

  const handlePointClick = (point: VehicleTrackingData) => {
    setSelectedPoint(point);
  };

  const handleDisplayItemClick = (item: HistoryDisplayItem) => {
    if (item.type === 'single-point') {
      setSelectedPoint(item.data);
    } else {
      // For groups, select the first point to show on map
      setSelectedPoint(item.points[0]);
    }
  };

  const isLoading = isLoadingVehicle;

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">Veículo não encontrado</p>
        <Button onClick={() => navigate('/veiculos')}>Voltar</Button>
      </div>
    );
  }

  const displayStatus = mapVehicleStatus(vehicle.status);
  const vehicleDescription = [vehicle.brand, vehicle.model].filter(Boolean).join('/') || 'Veículo';

  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-foreground">{vehicle.plate}</h1>
              <VehicleBadge variant={displayStatus}>
                {statusLabels[displayStatus]}
              </VehicleBadge>
            </div>
            <p className="text-sm text-muted-foreground">{vehicle.clients?.name || 'Cliente'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Histórico de Rastreamento</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-96 border-r bg-card flex flex-col">
          {/* Filters */}
          <div className="p-4 border-b">
            <HistoryFilters onFilter={handleFilter} isLoading={isLoadingHistory} />
          </div>

          {/* Export buttons */}
          <div className="p-4 border-b space-y-2">
            <ExportButton 
              data={historyData} 
              vehiclePlate={vehicle.plate}
              startDate={startDate}
              endDate={endDate}
              disabled={isLoadingHistory}
            />
            <ExportPdfButton
              data={historyData}
              vehiclePlate={vehicle.plate}
              vehicleDescription={vehicleDescription}
              vehicleId={vehicle.id}
              startDate={startDate}
              endDate={endDate}
              disabled={isLoadingHistory}
            />
          </div>

          {/* Points count */}
          <div className="px-4 py-3 border-b bg-muted/50">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{totalPoints}</span> pontos encontrados
              {displayItems.length !== totalPoints && (
                <span className="ml-1">({displayItems.length} itens agrupados)</span>
              )}
            </p>
          </div>

          {/* Points list */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : displayItems.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum dado de rastreamento encontrado para o período selecionado.
                  </p>
                </div>
              ) : (
                displayItems.map((item, index) => {
                  if (item.type === 'stopped-group') {
                    return (
                      <HistoryStoppedGroupCard
                        key={item.id}
                        group={item}
                        isSelected={selectedPoint ? item.points.some(p => p.id === selectedPoint.id) : false}
                        onClick={() => handleDisplayItemClick(item)}
                      />
                    );
                  }
                  return (
                    <HistoryTrackingCard
                      key={item.data.id}
                      point={item.data}
                      index={index}
                      isFirst={index === 0}
                      isLast={index === displayItems.length - 1}
                      isSelected={selectedPoint?.id === item.data.id}
                      onClick={() => handlePointClick(item.data)}
                    />
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Map */}
        <div className="flex-1">
          <MapboxHistoryView
            trackingData={historyData}
            selectedPoint={selectedPoint}
          />
        </div>
      </div>
    </div>
  );
};

export default VeiculoHistorico;
