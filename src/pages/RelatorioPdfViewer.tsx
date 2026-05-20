import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Loader2, Share2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface PdfViewerState {
  url?: string;
  filename?: string;
  title?: string;
}

interface ReportData {
  url: string;
  filename: string;
  title: string;
}

export default function RelatorioPdfViewer() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const incomingState = location.state as PdfViewerState | null;
  const containerRef = useRef<HTMLDivElement>(null);
  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!id) {
      setError('Relatório não encontrado.');
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      if (incomingState?.url && incomingState.filename) {
        if (!cancelled) {
          setReport({
            url: incomingState.url,
            filename: incomingState.filename,
            title: incomingState.title || 'Relatório',
          });
          setIsLoading(false);
        }
        return;
      }

      try {
        const { data, error: fetchErr } = await (supabase as any)
          .from('tracking_reports')
          .select('storage_path, filename, title')
          .eq('id', id)
          .single();

        if (fetchErr || !data) throw fetchErr || new Error('not found');

        const { data: { publicUrl } } = supabase.storage
          .from('relatorios')
          .getPublicUrl(data.storage_path);

        if (cancelled) return;
        setReport({
          url: publicUrl,
          filename: data.filename,
          title: data.title || 'Relatório',
        });
      } catch (err) {
        console.error('Erro ao carregar relatório:', err);
        if (!cancelled) setError('Relatório não encontrado ou expirado.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, incomingState]);

  useEffect(() => {
    if (!report?.url) return;

    let cancelled = false;
    setIsRendering(true);

    (async () => {
      try {
        const loadingTask = pdfjsLib.getDocument(report.url);
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
  }, [report]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleDownload = async () => {
    if (!report) return;
    try {
      const res = await fetch(report.url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = report.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (err) {
      console.error('Erro ao baixar:', err);
      window.open(report.url, '_blank');
    }
  };

  const shareUrl = `${window.location.origin}/historico/relatorio/${id}`;

  const handleShare = async () => {
    if (!report || isSharing) return;
    setIsSharing(true);
    try {
      const shareData: ShareData = {
        url: shareUrl,
        title: report.title,
        text: report.title,
      };

      if (typeof navigator.share === 'function') {
        await navigator.share(shareData);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: 'Link copiado', description: 'Cole onde quiser compartilhar.' });
      } else {
        toast({
          title: 'Compartilhamento indisponível',
          description: 'Seu navegador não suporta compartilhar.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError') return;
      console.error('Erro ao compartilhar:', err);
      toast({
        title: 'Erro ao compartilhar',
        description: 'Tente copiar o link manualmente.',
        variant: 'destructive',
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: 'Link copiado' });
    } catch {
      toast({ title: 'Erro ao copiar', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-muted/30 gap-4 px-4 text-center">
        <p className="text-destructive">{error || 'Relatório não encontrado.'}</p>
        <Button onClick={handleBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-muted/30">
      <div className="flex items-center justify-between gap-2 px-3 sm:px-6 py-3 border-b bg-background">
        <Button variant="outline" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>
        <h1 className="text-sm sm:text-base font-medium truncate flex-1 text-center hidden md:block">
          {report.title}
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyLink} title="Copiar link">
            <Copy className="h-4 w-4" />
          </Button>
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
        <div ref={containerRef} className="max-w-full" />
      </div>
    </div>
  );
}
