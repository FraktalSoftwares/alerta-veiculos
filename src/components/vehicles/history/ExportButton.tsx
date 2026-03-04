import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { VehicleTrackingData } from '@/hooks/useVehicleTracking';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { batchReverseGeocode } from '@/utils/geocoding';
import { buildReportRows } from '@/utils/trackingReport';

interface ExportButtonProps {
  data: VehicleTrackingData[];
  vehiclePlate: string;
  startDate: Date;
  endDate: Date;
  disabled?: boolean;
}

export function ExportButton({ data, vehiclePlate, startDate, endDate, disabled }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState('');

  const handleExport = async () => {
    if (!data.length) return;
    setIsExporting(true);

    try {
      setProgress('Obtendo endereços...');
      const addressMap = await batchReverseGeocode(
        data,
        (done, total) => setProgress(`Endereços: ${done}/${total}`)
      );

      setProgress('Gerando planilha...');
      const rows = buildReportRows(data, addressMap);

      const exportData = rows.map((row, i) => ({
        'Nº': i + 1,
        'Data': row.data,
        'Velocidade': row.velocidade,
        'Ignição': row.ignicao,
        'Tempo de parada': row.tempoParada,
        'Endereço': row.endereco,
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      ws['!cols'] = [
        { wch: 6 },
        { wch: 20 },
        { wch: 16 },
        { wch: 12 },
        { wch: 18 },
        { wch: 50 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Histórico');

      const start = format(startDate, 'dd-MM-yyyy');
      const end = format(endDate, 'dd-MM-yyyy');
      const plate = vehiclePlate.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `historico_${plate}_${start}_a_${end}.xlsx`;

      XLSX.writeFile(wb, filename);
    } catch (err) {
      console.error('Erro ao exportar XLSX:', err);
    } finally {
      setIsExporting(false);
      setProgress('');
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={disabled || !data.length || isExporting}
      className="w-full"
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {progress || 'Exportando...'}
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          Exportar XLSX
        </>
      )}
    </Button>
  );
}
