import { useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Header } from '@/components/layout/Header';
import {
  ArrowLeft,
  Loader2,
  Plus,
  Power,
  PowerOff,
  Trash2,
  Route as RouteIcon,
  AlertTriangle,
  MapPin,
  X,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useVehicle } from '@/hooks/useVehicles';
import { useVehicleTracking } from '@/hooks/useVehicleTracking';
import { useToast } from '@/hooks/use-toast';
import {
  useRotasObrigatorias,
  useRotaObrigatoriaStatus,
  useAtivarRotaObrigatoria,
  useDesativarRotaObrigatoria,
  useExcluirRotaObrigatoria,
  useCriarRotaObrigatoria,
  useRotaPreview,
  RotaObrigatoria,
} from '@/hooks/useRotaObrigatoria';
import { RouteMapGoogle, RoutePoint, RoutePointType } from '@/components/vehicles/map/RouteMapGoogle';

const MODE_LABELS: Record<RoutePointType, string> = { origin: 'Origem', stop: 'Parada', destination: 'Destino' };
const TYPE_DOT: Record<RoutePointType, string> = { origin: 'bg-green-600', stop: 'bg-amber-500', destination: 'bg-red-600' };

/** origem → paradas (ordem) → destino */
function orderPoints(pts: RoutePoint[]): RoutePoint[] {
  const o = pts.find((p) => p.type === 'origin');
  const s = pts.filter((p) => p.type === 'stop');
  const d = pts.find((p) => p.type === 'destination');
  return [o, ...s, d].filter(Boolean) as RoutePoint[];
}

function pointLabel(p: RoutePoint, ordered: RoutePoint[]): string {
  if (p.type === 'origin') return 'Origem';
  if (p.type === 'destination') return 'Destino';
  return `Parada ${ordered.filter((x) => x.type === 'stop').indexOf(p) + 1}`;
}

export default function VeiculoRotas() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: vehicle, isLoading } = useVehicle(id || '');
  const { data: trackingData } = useVehicleTracking(id || '');

  const equipment = vehicle?.equipment?.[0];
  const imei = equipment?.imei || null;
  const protocol = equipment?.products?.model || equipment?.model || null;

  const { data: rotas, isLoading: isLoadingRotas } = useRotasObrigatorias(imei);
  const { data: status } = useRotaObrigatoriaStatus(imei);

  const ativarMutation = useAtivarRotaObrigatoria();
  const desativarMutation = useDesativarRotaObrigatoria();
  const excluirMutation = useExcluirRotaObrigatoria();
  const criar = useCriarRotaObrigatoria();

  const [mode, setMode] = useState<'list' | 'create'>('list');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleteRoute, setDeleteRoute] = useState<RotaObrigatoria | null>(null);

  // form de criação
  const [name, setName] = useState('');
  const [tolerance, setTolerance] = useState(200);
  const [confirmationRadius, setConfirmationRadius] = useState(100);
  const [autoBlock, setAutoBlock] = useState(false);
  const [pointMode, setPointMode] = useState<RoutePointType>('origin');
  const [points, setPoints] = useState<RoutePoint[]>([]);
  const idCounter = useRef(0);
  const nextId = () => `p${(idCounter.current += 1)}`;

  const selectedRoute = useMemo(
    () => rotas?.find((r) => r.id === selectedId) || rotas?.[0] || null,
    [rotas, selectedId]
  );

  // pontos ativos no mapa (criação x visualização)
  const createOrdered = useMemo(() => orderPoints(points), [points]);
  const listPoints = useMemo(
    () => (selectedRoute ? [...selectedRoute.route_points].sort((a, b) => a.position - b.position) : []),
    [selectedRoute]
  );

  const mapPoints: RoutePoint[] =
    mode === 'create'
      ? points
      : listPoints.map((p, i) => ({
          id: p.id,
          type: (i === 0 ? 'origin' : i === listPoints.length - 1 ? 'destination' : 'stop') as RoutePointType,
          lat: p.lat,
          lng: p.lon,
          name: p.name,
        }));

  const waypoints =
    mode === 'create'
      ? createOrdered.map((p) => ({ lat: p.lat, lon: p.lng }))
      : listPoints.map((p) => ({ lat: p.lat, lon: p.lon }));

  const { data: preview } = useRotaPreview(waypoints.length >= 2 ? waypoints : null);

  const mapCenter = trackingData
    ? { lat: trackingData.latitude, lng: trackingData.longitude }
    : mapPoints[0]
    ? { lat: mapPoints[0].lat, lng: mapPoints[0].lng }
    : { lat: -23.5505, lng: -46.6333 };

  // ---- criação ----
  const addPoint = (lat: number, lng: number) => {
    setPoints((prev) => {
      if (pointMode === 'origin' || pointMode === 'destination') {
        const exists = prev.find((p) => p.type === pointMode);
        if (exists) return prev.map((p) => (p.type === pointMode ? { ...p, lat, lng } : p));
        return [...prev, { id: nextId(), type: pointMode, lat, lng }];
      }
      return [...prev, { id: nextId(), type: 'stop', lat, lng }];
    });
    if (pointMode === 'origin') setPointMode('stop');
  };
  const movePoint = (pid: string, lat: number, lng: number) =>
    setPoints((prev) => prev.map((p) => (p.id === pid ? { ...p, lat, lng } : p)));
  const removePoint = (pid: string) => setPoints((prev) => prev.filter((p) => p.id !== pid));

  const hasOrigin = points.some((p) => p.type === 'origin');
  const hasDestination = points.some((p) => p.type === 'destination');

  const startCreate = () => {
    setName('');
    setTolerance(200);
    setConfirmationRadius(100);
    setAutoBlock(false);
    setPointMode('origin');
    setPoints([]);
    setMode('create');
  };
  const cancelCreate = () => {
    setPoints([]);
    setMode('list');
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
    criar.mutate(
      {
        name: name.trim() || 'Rota',
        imei,
        protocol,
        points: createOrdered.map((p, i) => ({ position: i, lat: p.lat, lon: p.lng, name: pointLabel(p, createOrdered) })),
        tolerance_meters: tolerance,
        confirmation_radius_meters: confirmationRadius,
        automatic_block: autoBlock,
      },
      {
        onSuccess: () => {
          toast({ title: 'Rota criada', description: `"${name.trim() || 'Rota'}" foi salva.` });
          setPoints([]);
          setSelectedId(null);
          setMode('list');
        },
        onError: (err: any) => toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' }),
      }
    );
  };

  // ---- ações da lista ----
  const handleAtivar = (rota: RotaObrigatoria) => {
    if (!imei || !protocol) return;
    ativarMutation.mutate(
      { routeId: rota.id, imei, protocol },
      {
        onSuccess: () => toast({ title: 'Rota ativada', description: `Monitoramento de "${rota.name}" iniciado.` }),
        onError: (err: any) => toast({ title: 'Erro ao ativar', description: err.message, variant: 'destructive' }),
      }
    );
  };
  const handleDesativar = () => {
    if (!imei) return;
    desativarMutation.mutate(imei, {
      onSuccess: () => toast({ title: 'Monitoramento desativado' }),
      onError: (err: any) => toast({ title: 'Erro ao desativar', description: err.message, variant: 'destructive' }),
    });
  };
  const handleExcluir = () => {
    if (!deleteRoute || !imei) return;
    excluirMutation.mutate(
      { routeId: deleteRoute.id, imei },
      {
        onSuccess: () => {
          toast({ title: 'Rota excluída', description: `"${deleteRoute.name}" foi removida.` });
          if (selectedId === deleteRoute.id) setSelectedId(null);
          setDeleteRoute(null);
        },
        onError: (err: any) => {
          toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' });
          setDeleteRoute(null);
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

  const isMonitoringActive = status?.active === true;
  const distanceKm = preview ? (preview.distanceMeters / 1000).toFixed(1) : null;
  const durationMin = preview ? Math.round(preview.durationSecs / 60) : null;

  return (
    <div className="h-[100dvh] flex flex-col bg-muted/30">
      <Header />
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b bg-card">
        <Button variant="ghost" size="icon" onClick={() => navigate('/veiculos')} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-base sm:text-lg font-semibold truncate">Rotas Obrigatórias</h1>
          <p className="text-xs text-muted-foreground truncate">
            {vehicle.plate} - {vehicle.clients?.name || 'Cliente'}
          </p>
        </div>
        {mode === 'list' && (
          <Button onClick={startCreate} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" /> Nova Rota
          </Button>
        )}
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        {/* Esquerda: lista/criação */}
        <aside className="w-full lg:w-[380px] shrink-0 border-r bg-card overflow-y-auto p-4 space-y-4">
          {mode === 'list' ? (
            <>
              {/* status de monitoramento */}
              <div
                className={`rounded-lg border p-3 ${
                  isMonitoringActive ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <RouteIcon className={`h-4 w-4 ${isMonitoringActive ? 'text-green-600' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-medium">
                      {isMonitoringActive ? 'Monitoramento ativo' : 'Monitoramento inativo'}
                    </span>
                  </div>
                  {isMonitoringActive && (
                    <Button variant="outline" size="sm" onClick={handleDesativar} disabled={desativarMutation.isPending} className="gap-1.5 h-7">
                      {desativarMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PowerOff className="h-3.5 w-3.5" />}
                      Desativar
                    </Button>
                  )}
                </div>
                {isMonitoringActive && status?.consecutive_deviations ? (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> {status.consecutive_deviations} desvio(s)
                  </p>
                ) : null}
              </div>

              {/* lista de rotas (histórico) */}
              {isLoadingRotas ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : !rotas || rotas.length === 0 ? (
                <div className="text-center py-8">
                  <RouteIcon className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground mb-4">Nenhuma rota cadastrada.</p>
                  <Button onClick={startCreate} variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" /> Criar primeira rota
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {rotas.map((rota) => {
                    const isActive = isMonitoringActive && status?.route_id === rota.id;
                    const isSelected = selectedRoute?.id === rota.id;
                    return (
                      <div
                        key={rota.id}
                        onClick={() => setSelectedId(rota.id)}
                        className={`rounded-lg border p-3 cursor-pointer transition-colors ${
                          isSelected ? 'border-primary ring-1 ring-primary/30' : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm truncate flex-1">{rota.name}</span>
                          {isActive && <Badge className="bg-green-600 hover:bg-green-600 text-[10px] h-5">Ativa</Badge>}
                          {rota.automatic_block && <Badge variant="secondary" className="text-[10px] h-5">Bloqueio auto.</Badge>}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mb-2">
                          <span>{rota.route_points?.length || 0} pontos</span>
                          {rota.tolerance_meters > 0 && <span>Tol.: {rota.tolerance_meters}m</span>}
                          {rota.confirmation_radius_meters > 0 && <span>Raio: {rota.confirmation_radius_meters}m</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          {isActive ? (
                            <Button variant="outline" size="sm" className="gap-1.5 h-7 flex-1" onClick={(e) => { e.stopPropagation(); handleDesativar(); }} disabled={desativarMutation.isPending}>
                              <PowerOff className="h-3.5 w-3.5" /> Desativar
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" className="gap-1.5 h-7 flex-1" onClick={(e) => { e.stopPropagation(); handleAtivar(rota); }} disabled={ativarMutation.isPending || !protocol}>
                              {ativarMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Power className="h-3.5 w-3.5" />} Ativar
                            </Button>
                          )}
                          <Button variant="outline" size="sm" className="gap-1.5 h-7 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteRoute(rota); }}>
                            <Trash2 className="h-3.5 w-3.5" /> Excluir
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            /* modo criação */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">Nova rota</span>
                <button onClick={cancelCreate} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Nome da rota</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Rota do dia" className="h-9" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Tolerância (m)</label>
                  <Input type="number" value={tolerance} onChange={(e) => setTolerance(Math.max(0, parseInt(e.target.value, 10) || 0))} className="h-9" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Raio confirmação (m)</label>
                  <Input type="number" value={confirmationRadius} onChange={(e) => setConfirmationRadius(Math.max(0, parseInt(e.target.value, 10) || 0))} className="h-9" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Bloqueio automático ao desviar</span>
                <Switch checked={autoBlock} onCheckedChange={setAutoBlock} />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Clique no mapa para adicionar:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['origin', 'stop', 'destination'] as RoutePointType[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setPointMode(m)}
                      className={`text-xs font-medium py-2 rounded-md border transition-colors ${
                        pointMode === m
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
                  Modo: <b>{MODE_LABELS[pointMode]}</b>. Arraste um ponto para ajustar.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-muted-foreground">PONTOS ({points.length})</span>
                  {distanceKm && (
                    <span className="text-[11px] text-muted-foreground">{distanceKm} km · {durationMin} min</span>
                  )}
                </div>
                {points.length === 0 ? (
                  <div className="text-center py-6 text-xs text-muted-foreground border border-dashed rounded-md">
                    <MapPin className="h-5 w-5 mx-auto mb-1 opacity-60" />
                    Clique no mapa para marcar a origem.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {createOrdered.map((p) => (
                      <div key={p.id} className="flex items-center gap-2 rounded-md border px-2 py-1.5">
                        <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${TYPE_DOT[p.type]}`} />
                        <span className="text-sm flex-1 min-w-0 truncate">{pointLabel(p, createOrdered)}</span>
                        <button onClick={() => removePoint(p.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {(!hasOrigin || !hasDestination) && points.length > 0 && (
                  <p className="text-[11px] text-amber-600 mt-1.5">{!hasOrigin ? 'Falta a origem.' : 'Falta o destino.'}</p>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={cancelCreate}>Cancelar</Button>
                <Button className="flex-1" onClick={save} disabled={!hasOrigin || !hasDestination || criar.isPending}>
                  {criar.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Salvar Rota
                </Button>
              </div>
            </div>
          )}
        </aside>

        {/* Direita: mapa */}
        <div className="flex-1 min-h-[300px]">
          <RouteMapGoogle
            center={mapCenter}
            points={mapPoints}
            routePath={preview?.path}
            editable={mode === 'create'}
            onAddPoint={addPoint}
            onMovePoint={movePoint}
          />
        </div>
      </div>

      {/* Excluir */}
      <AlertDialog open={!!deleteRoute} onOpenChange={(open) => !open && setDeleteRoute(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir rota</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a rota "{deleteRoute?.name}"? Esta ação não pode ser desfeita.
              Se a rota estiver ativa, será desativada automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExcluir} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {excluirMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
