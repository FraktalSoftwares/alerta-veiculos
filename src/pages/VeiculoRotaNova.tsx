import { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Loader2, X, MapPin, Flag, CircleDot } from 'lucide-react';
import { useVehicle } from '@/hooks/useVehicles';
import { useVehicleTracking } from '@/hooks/useVehicleTracking';
import { useToast } from '@/hooks/use-toast';
import { useCriarRotaObrigatoria } from '@/hooks/useRotaObrigatoria';
import { RouteMapGoogle, RoutePoint, RoutePointType, RouteInfo } from '@/components/vehicles/map/RouteMapGoogle';

const MODE_LABELS: Record<RoutePointType, string> = {
  origin: 'Origem',
  stop: 'Parada',
  destination: 'Destino',
};

const TYPE_COLORS: Record<RoutePointType, string> = {
  origin: 'bg-green-600',
  stop: 'bg-amber-500',
  destination: 'bg-red-600',
};

export default function VeiculoRotaNova() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: vehicle, isLoading } = useVehicle(id || '');
  const { data: trackingData } = useVehicleTracking(id || '');

  const equipment = vehicle?.equipment?.[0];
  const imei = equipment?.imei || null;
  const protocol = equipment?.products?.model || equipment?.model || null;

  const [name, setName] = useState('');
  const [tolerance, setTolerance] = useState(200);
  const [confirmationRadius, setConfirmationRadius] = useState(100);
  const [autoBlock, setAutoBlock] = useState(false);
  const [mode, setMode] = useState<RoutePointType>('origin');
  const [points, setPoints] = useState<RoutePoint[]>([]);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

  const idCounter = useRef(0);
  const nextId = () => `p${(idCounter.current += 1)}`;

  const criar = useCriarRotaObrigatoria();

  const mapCenter = trackingData
    ? { lat: trackingData.latitude, lng: trackingData.longitude }
    : { lat: -23.5505, lng: -46.6333 };

  const label = (p: RoutePoint) => {
    if (p.type === 'origin') return 'Origem';
    if (p.type === 'destination') return 'Destino';
    const n = points.filter((x) => x.type === 'stop').indexOf(p) + 1;
    return `Parada ${n}`;
  };

  const addPoint = (lat: number, lng: number) => {
    setPoints((prev) => {
      // origem e destino são únicos: novo clique reposiciona o existente
      if (mode === 'origin' || mode === 'destination') {
        const exists = prev.find((p) => p.type === mode);
        if (exists) return prev.map((p) => (p.type === mode ? { ...p, lat, lng } : p));
        return [...prev, { id: nextId(), type: mode, lat, lng }];
      }
      return [...prev, { id: nextId(), type: 'stop', lat, lng }];
    });
    // depois de fixar a origem, passa naturalmente para paradas
    if (mode === 'origin') setMode('stop');
  };

  const movePoint = (pid: string, lat: number, lng: number) => {
    setPoints((prev) => prev.map((p) => (p.id === pid ? { ...p, lat, lng } : p)));
  };

  const removePoint = (pid: string) => {
    setPoints((prev) => prev.filter((p) => p.id !== pid));
  };

  const hasOrigin = points.some((p) => p.type === 'origin');
  const hasDestination = points.some((p) => p.type === 'destination');
  const canSave = hasOrigin && hasDestination && !!imei && !!protocol && !criar.isPending;

  // origem → paradas (ordem) → destino
  const orderedPoints = (): RoutePoint[] => {
    const origin = points.find((p) => p.type === 'origin');
    const stops = points.filter((p) => p.type === 'stop');
    const dest = points.find((p) => p.type === 'destination');
    return [origin, ...stops, dest].filter(Boolean) as RoutePoint[];
  };

  const save = () => {
    if (!imei || !protocol) {
      toast({ title: 'Erro', description: 'Veículo sem IMEI ou protocolo.', variant: 'destructive' });
      return;
    }
    if (!hasOrigin || !hasDestination) {
      toast({ title: 'Rota incompleta', description: 'Defina ao menos origem e destino.', variant: 'destructive' });
      return;
    }
    const ordered = orderedPoints();
    criar.mutate(
      {
        name: name.trim() || 'Rota',
        imei,
        protocol,
        points: ordered.map((p, i) => ({ position: i, lat: p.lat, lon: p.lng, name: label(p) })),
        tolerance_meters: tolerance,
        confirmation_radius_meters: confirmationRadius,
        automatic_block: autoBlock,
      },
      {
        onSuccess: () => {
          toast({ title: 'Rota criada', description: `"${name.trim() || 'Rota'}" foi salva.` });
          navigate(`/veiculos/${id}/rotas`);
        },
        onError: (err: any) => {
          toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }
  if (!vehicle || !equipment) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-destructive mb-4">Veículo não encontrado ou sem equipamento</p>
            <Button onClick={() => navigate('/veiculos')}>Voltar para Veículos</Button>
          </div>
        </div>
      </div>
    );
  }

  const orderedList = orderedPoints();

  return (
    <div className="h-[100dvh] flex flex-col bg-muted/30">
      <Header />
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b bg-card">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/veiculos/${id}/rotas`)} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-semibold truncate">Nova Rota Obrigatória</h1>
          <p className="text-xs text-muted-foreground truncate">
            {vehicle.plate} - {vehicle.clients?.name || 'Cliente'}
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        {/* Esquerda: formulário */}
        <aside className="w-full lg:w-[360px] shrink-0 border-r bg-card overflow-y-auto p-4 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground">Nome da rota</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Rota do dia" className="h-9" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Tolerância (m)</label>
              <Input
                type="number"
                value={tolerance}
                onChange={(e) => setTolerance(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="h-9"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Raio confirmação (m)</label>
              <Input
                type="number"
                value={confirmationRadius}
                onChange={(e) => setConfirmationRadius(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="h-9"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Bloqueio automático ao desviar</span>
            <Switch checked={autoBlock} onCheckedChange={setAutoBlock} />
          </div>

          {/* Seletor de modo */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Clique no mapa para adicionar:</label>
            <div className="grid grid-cols-3 gap-2">
              {(['origin', 'stop', 'destination'] as RoutePointType[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`text-xs font-medium py-2 rounded-md border transition-colors ${
                    mode === m
                      ? m === 'origin'
                        ? 'bg-green-600 text-white border-green-600'
                        : m === 'stop'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-red-600 text-white border-red-600'
                      : 'bg-background hover:bg-muted border-border'
                  }`}
                >
                  {MODE_LABELS[m]}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Modo atual: <b>{MODE_LABELS[mode]}</b>. Arraste um ponto no mapa para ajustar.
            </p>
          </div>

          {/* Lista de pontos */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-muted-foreground">PONTOS ({points.length})</span>
              {routeInfo && (
                <span className="text-[11px] text-muted-foreground">
                  {(routeInfo.distanceMeters / 1000).toFixed(1)} km · {routeInfo.durationText}
                </span>
              )}
            </div>
            {points.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground border border-dashed rounded-md">
                <MapPin className="h-5 w-5 mx-auto mb-1 opacity-60" />
                Clique no mapa para marcar a origem.
              </div>
            ) : (
              <div className="space-y-1.5">
                {orderedList.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 rounded-md border px-2 py-1.5">
                    <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${TYPE_COLORS[p.type]}`} />
                    <span className="text-sm flex-1 min-w-0 truncate">{label(p)}</span>
                    <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                      {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                    </span>
                    <button onClick={() => removePoint(p.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {(!hasOrigin || !hasDestination) && points.length > 0 && (
              <p className="text-[11px] text-amber-600 mt-1.5 flex items-center gap-1">
                {!hasOrigin ? (
                  <>
                    <CircleDot className="h-3 w-3" /> Falta a origem.
                  </>
                ) : (
                  <>
                    <Flag className="h-3 w-3" /> Falta o destino.
                  </>
                )}
              </p>
            )}
          </div>

          <Button className="w-full" onClick={save} disabled={!canSave}>
            {criar.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Salvar Rota
          </Button>
        </aside>

        {/* Direita: mapa */}
        <div className="flex-1 min-h-[300px]">
          <RouteMapGoogle
            center={mapCenter}
            points={points}
            onAddPoint={addPoint}
            onMovePoint={movePoint}
            onRouteInfo={setRouteInfo}
          />
        </div>
      </div>
    </div>
  );
}
