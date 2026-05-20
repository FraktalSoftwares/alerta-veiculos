import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';
import { VehicleTrackingData } from '@/hooks/useVehicleTracking';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { batchReverseGeocode } from '@/utils/geocoding';
import { buildReportRows } from '@/utils/trackingReport';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ExportPdfButtonProps {
  data: VehicleTrackingData[];
  vehiclePlate: string;
  vehicleDescription: string;
  startDate: Date;
  endDate: Date;
  disabled?: boolean;
}

export function ExportPdfButton({
  data,
  vehiclePlate,
  vehicleDescription,
  startDate,
  endDate,
  disabled,
}: ExportPdfButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleExport = async () => {
    if (!data.length) return;
    setIsExporting(true);

    try {
      setProgress('Obtendo endereços...');
      const addressMap = await batchReverseGeocode(
        data,
        (done, total) => setProgress(`Endereços: ${done}/${total}`)
      );

      setProgress('Gerando PDF...');
      const rows = buildReportRows(data, addressMap);

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();

      const startStr = format(startDate, 'dd/MM/yyyy HH:mm');
      const endStr = format(endDate, 'dd/MM/yyyy HH:mm');

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Relatório de rastreamento simplificado', pageWidth / 2, 18, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Período: ', 14, 28);
      doc.setFont('helvetica', 'normal');
      doc.text(`${startStr} à ${endStr}`, 14 + doc.getTextWidth('Período: '), 28);

      doc.setFont('helvetica', 'bold');
      doc.text('Veículo: ', 14, 34);
      doc.setFont('helvetica', 'normal');
      doc.text(`${vehicleDescription} / ${vehiclePlate}`, 14 + doc.getTextWidth('Veículo: '), 34);

      const tableBody = rows.map((row) => [
        row.data,
        row.velocidade,
        row.ignicao,
        row.tempoParada,
        row.endereco,
      ]);

      autoTable(doc, {
        startY: 40,
        head: [['Data', 'Velocidade', 'Ignição', 'Tempo de parada', 'Endereço']],
        body: tableBody,
        theme: 'grid',
        headStyles: {
          fillColor: [40, 40, 40],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'center',
        },
        bodyStyles: {
          fontSize: 7.5,
          cellPadding: 2,
        },
        columnStyles: {
          0: { cellWidth: 35, halign: 'center' },
          1: { cellWidth: 28, halign: 'center' },
          2: { cellWidth: 22, halign: 'center' },
          3: { cellWidth: 32, halign: 'center' },
          4: { cellWidth: 'auto' },
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 14, right: 14 },
        didDrawPage: (hookData) => {
          const pageCount = doc.getNumberOfPages();
          const currentPage = hookData.pageNumber;
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.text(
            `Página ${currentPage} de ${pageCount}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 8,
            { align: 'center' }
          );
        },
      });

      const start = format(startDate, 'dd-MM-yyyy');
      const end = format(endDate, 'dd-MM-yyyy');
      const plate = vehiclePlate.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `relatorio_${plate}_${start}_a_${end}.pdf`;

      const blob = doc.output('blob');

      setProgress('Salvando no servidor...');
      const storagePath = `historico/${plate}/${Date.now()}_${filename}`;
      const { error: uploadError } = await supabase.storage
        .from('relatorios')
        .upload(storagePath, blob, {
          contentType: 'application/pdf',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('relatorios')
        .getPublicUrl(storagePath);

      navigate('/relatorio-pdf', {
        state: {
          url: publicUrl,
          filename,
          title: `Relatório ${vehiclePlate} · ${format(startDate, 'dd/MM/yyyy')} a ${format(endDate, 'dd/MM/yyyy')}`,
        },
      });
    } catch (err: any) {
      console.error('Erro ao gerar PDF:', err);
      toast({
        title: 'Erro ao gerar relatório',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      });
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
          {progress || 'Gerando...'}
        </>
      ) : (
        <>
          <FileText className="h-4 w-4 mr-2" />
          Exportar Relatório PDF
        </>
      )}
    </Button>
  );
}
