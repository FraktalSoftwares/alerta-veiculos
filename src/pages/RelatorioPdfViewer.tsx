import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download } from 'lucide-react';

interface PdfViewerState {
  blobUrl: string;
  filename: string;
  title?: string;
}

export default function RelatorioPdfViewer() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as PdfViewerState | null;

  useEffect(() => {
    if (!state?.blobUrl) {
      navigate(-1);
      return;
    }
    return () => {
      if (state?.blobUrl) {
        URL.revokeObjectURL(state.blobUrl);
      }
    };
  }, [state, navigate]);

  if (!state?.blobUrl) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = state.blobUrl;
    a.download = state.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex flex-col h-screen bg-muted/30">
      <div className="flex items-center justify-between gap-2 px-3 sm:px-6 py-3 border-b bg-background">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-sm sm:text-base font-medium truncate flex-1 text-center hidden sm:block">
          {state.title || 'Relatório'}
        </h1>
        <Button size="sm" onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Baixar
        </Button>
      </div>
      <div className="flex-1">
        <iframe
          src={state.blobUrl}
          title={state.title || 'Relatório PDF'}
          className="w-full h-full border-0"
        />
      </div>
    </div>
  );
}
