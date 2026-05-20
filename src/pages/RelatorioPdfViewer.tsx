import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Loader2, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface PdfViewerState {
  blobUrl: string;
  filename: string;
  title?: string;
}

export default function RelatorioPdfViewer() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as PdfViewerState | null;
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRendering, setIsRendering] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!state?.blobUrl) {
      navigate(-1);
      return;
    }

    let cancelled = false;
    const blobUrl = state.blobUrl;

    (async () => {
      try {
        const loadingTask = pdfjsLib.getDocument(blobUrl);
        const pdf = await loadingTask.promise;
        if (cancelled) return;

        const container = containerRef.current;
        if (!container) return;
        container.innerHTML = '';

        const containerWidth = container.clientWidth - 16;
        const dpr = window.devicePixelRatio || 1;

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          if (cancelled) return;
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 1 });
          const scale = containerWidth / viewport.width;
          const scaledViewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          canvas.width = scaledViewport.width * dpr;
          canvas.height = scaledViewport.height * dpr;
          canvas.style.width = `${scaledViewport.width}px`;
          canvas.style.height = `${scaledViewport.height}px`;
          canvas.className = 'shadow-md bg-white mb-3 mx-auto block';

          const ctx = canvas.getContext('2d');
          if (!ctx) continue;
          ctx.scale(dpr, dpr);

          container.appendChild(canvas);

          await page.render({
            canvasContext: ctx,
            viewport: scaledViewport,
            canvas,
          }).promise;
        }

        if (!cancelled) setIsRendering(false);
      } catch (err) {
        console.error('Erro ao renderizar PDF:', err);
        if (!cancelled) {
          setError('Não foi possível exibir o PDF. Use o botão Baixar.');
          setIsRendering(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [state, navigate]);

  useEffect(() => {
    return () => {
      if (state?.blobUrl) {
        URL.revokeObjectURL(state.blobUrl);
      }
    };
  }, [state]);

  if (!state?.blobUrl) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = state.blobUrl;
    a.download = state.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    try {
      const res = await fetch(state.blobUrl);
      const blob = await res.blob();
      const file = new File([blob], state.filename, { type: 'application/pdf' });

      const shareData: ShareData = {
        files: [file],
        title: state.title || 'Relatório',
        text: state.title || 'Relatório PDF',
      };

      if (typeof navigator.canShare === 'function' && navigator.canShare(shareData) && typeof navigator.share === 'function') {
        await navigator.share(shareData);
      } else {
        toast({
          title: 'Compartilhamento indisponível',
          description: 'Seu navegador não suporta compartilhamento direto. O arquivo será baixado.',
        });
        handleDownload();
      }
    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError') return;
      console.error('Erro ao compartilhar:', err);
      toast({
        title: 'Erro ao compartilhar',
        description: 'Não foi possível compartilhar. Tente baixar e enviar manualmente.',
        variant: 'destructive',
      });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-muted/30">
      <div className="flex items-center justify-between gap-2 px-3 sm:px-6 py-3 border-b bg-background">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>
        <h1 className="text-sm sm:text-base font-medium truncate flex-1 text-center hidden md:block">
          {state.title || 'Relatório'}
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleShare} disabled={isSharing}>
            {isSharing ? (
              <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
            ) : (
              <Share2 className="h-4 w-4 sm:mr-2" />
            )}
            <span className="hidden sm:inline">Compartilhar</span>
          </Button>
          <Button size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Baixar</span>
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-2 sm:p-4 relative">
        {isRendering && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        {error && (
          <div className="text-center text-destructive py-8">{error}</div>
        )}
        <div ref={containerRef} className="max-w-full" />
      </div>
    </div>
  );
}
