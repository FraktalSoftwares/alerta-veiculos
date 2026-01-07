import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, MapPin } from 'lucide-react';
import { useVehicle } from '@/hooks/useVehicles';
import { useVehicleTrackingHistory, VehicleTrackingData } from '@/hooks/useVehicleTracking';
import { VehicleBadge } from '@/components/vehicles/VehicleBadge';
import { mapVehicleStatus } from '@/types/vehicle';
import { HistoryFilters } from '@/components/vehicles/history/HistoryFilters';
import { HistoryTrackingCard } from '@/components/vehicles/history/HistoryTrackingCard';
import { ExportButton } from '@/components/vehicles/history/ExportButton';
import { GoogleMapHistoryView } from '@/components/vehicles/history/GoogleMapHistoryView';
import { ScrollArea } from '@/components/ui/scroll-area';
import { subDays } from 'date-fns';

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

  const { data: vehicle, isLoading: isLoadingVehicle } = useVehicle(id || '');
  const { 
    data: trackingHistory, 
    isLoading: isLoadingHistory 
  } = useVehicleTrackingHistory(id || '', startDate, endDate);

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
  const historyData = trackingHistory || [];

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
        <div className="w-80 border-r bg-card flex flex-col">
          {/* Filters */}
          <div className="p-4 border-b">
            <HistoryFilters onFilter={handleFilter} isLoading={isLoadingHistory} />
          </div>

          {/* Export button */}
          <div className="p-4 border-b">
            <ExportButton 
              data={historyData} 
              vehiclePlate={vehicle.plate}
              disabled={isLoadingHistory}
            />
          </div>

          {/* Points count */}
          <div className="px-4 py-3 border-b bg-muted/50">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{historyData.length}</span> pontos encontrados
            </p>
          </div>

          {/* Points list */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : historyData.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum dado de rastreamento encontrado para o período selecionado.
                  </p>
                </div>
              ) : (
                historyData.map((point, index) => (
                  <HistoryTrackingCard
                    key={point.id}
                    point={point}
                    index={index}
                    isFirst={index === 0}
                    isLast={index === historyData.length - 1}
                    isSelected={selectedPoint?.id === point.id}
                    onClick={() => handlePointClick(point)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Map */}
        <div className="flex-1">
          <GoogleMapHistoryView 
            trackingData={historyData}
            selectedPoint={selectedPoint}
          />
        </div>
      </div>
    </div>
  );
};

export default VeiculoHistorico;
