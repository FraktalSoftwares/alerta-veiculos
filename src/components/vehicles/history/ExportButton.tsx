import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { VehicleTrackingData } from '@/hooks/useVehicleTracking';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

interface ExportButtonProps {
  data: VehicleTrackingData[];
  vehiclePlate: string;
  disabled?: boolean;
}

export function ExportButton({ data, vehiclePlate, disabled }: ExportButtonProps) {
  const handleExport = () => {
    if (!data.length) return;

    // Prepare data for export
    const exportData = data.map((point, index) => ({
      'Nº': index + 1,
      'Data/Hora': point.recorded_at 
        ? format(new Date(point.recorded_at), 'dd/MM/yyyy HH:mm:ss')
        : '-',
      'Latitude': point.latitude,
      'Longitude': point.longitude,
      'Velocidade (km/h)': point.speed ?? 0,
      'Direção (°)': point.heading ?? 0,
      'Ignição': point.ignition ? 'Ligada' : 'Desligada',
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    ws['!cols'] = [
      { wch: 6 },   // Nº
      { wch: 20 },  // Data/Hora
      { wch: 14 },  // Latitude
      { wch: 14 },  // Longitude
      { wch: 16 },  // Velocidade
      { wch: 12 },  // Direção
      { wch: 12 },  // Ignição
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Histórico');

    // Generate filename
    const today = format(new Date(), 'dd-MM-yyyy');
    const filename = `historico_${vehiclePlate.replace(/[^a-zA-Z0-9]/g, '_')}_${today}.xlsx`;

    // Download file
    XLSX.writeFile(wb, filename);
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleExport}
      disabled={disabled || !data.length}
      className="w-full"
    >
      <Download className="h-4 w-4 mr-2" />
      Exportar XLSX
    </Button>
  );
}
