import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/Header';
import {
  ArrowLeft,
  Loader2,
  Plus,
  Eye,
  Power,
  PowerOff,
  Trash2,
  Route,
  AlertTriangle,
  ExternalLink,
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
import { useToast } from '@/hooks/use-toast';
import {
  useRotasObrigatorias,
  useRotaObrigatoriaStatus,
  useAtivarRotaObrigatoria,
  useDesativarRotaObrigatoria,
  useExcluirRotaObrigatoria,
  getNovaRotaUrl,
  getVisualizarRotaUrl,
  RotaObrigatoria,
} from '@/hooks/useRotaObrigatoria';

export default function VeiculoRotas() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: vehicle, isLoading } = useVehicle(id || '');

  const equipment = vehicle?.equipment?.[0];
  const imei = equipment?.imei || null;
  const protocol = equipment?.products?.model || equipment?.model || null;

  const { data: rotas, isLoading: isLoadingRotas } = useRotasObrigatorias(imei);
  const { data: status } = useRotaObrigatoriaStatus(imei);

  const ativarMutation = useAtivarRotaObrigatoria();
  const desativarMutation = useDesativarRotaObrigatoria();
  const excluirMutation = useExcluirRotaObrigatoria();

  const [deleteRoute, setDeleteRoute] = useState<RotaObrigatoria | null>(null);

  const handleNovaRota = () => {
    if (!imei || !protocol) {
      toast({
        title: 'Erro',
        description: 'Veículo sem IMEI ou protocolo configurado.',
        variant: 'destructive',
      });
      return;
    }
    window.open(getNovaRotaUrl(imei, protocol), '_blank');
  };

  const handleVisualizar = (routeId: number) => {
    window.open(getVisualizarRotaUrl(routeId), '_blank');
  };

  const handleAtivar = (rota: RotaObrigatoria) => {
    if (!imei || !protocol) return;
    ativarMutation.mutate(
      { routeId: rota.route_id, imei, protocol },
      {
        onSuccess: () => {
          toast({ title: 'Rota ativada', description: `Monitoramento de "${rota.name}" iniciado.` });
        },
        onError: (err: any) => {
          toast({ title: 'Erro ao ativar', description: err.message, variant: 'destructive' });
        },
      }
    );
  };

  const handleDesativar = () => {
    if (!imei) return;
    desativarMutation.mutate(imei, {
      onSuccess: () => {
        toast({ title: 'Monitoramento desativado', description: 'A rota foi desativada para este veículo.' });
      },
      onError: (err: any) => {
        toast({ title: 'Erro ao desativar', description: err.message, variant: 'destructive' });
      },
    });
  };

  const handleExcluir = () => {
    if (!deleteRoute || !imei) return;
    excluirMutation.mutate(
      { routeId: deleteRoute.route_id, imei },
      {
        onSuccess: () => {
          toast({ title: 'Rota excluída', description: `"${deleteRoute.name}" foi removida.` });
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

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />

      <main className="px-4 sm:px-6 lg:px-12 py-4 sm:py-6 lg:py-8">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:gap-0 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/veiculos')}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-semibold truncate">Rotas Obrigatórias</h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {vehicle.plate} - {vehicle.clients?.name || 'Cliente'}
              </p>
            </div>
          </div>
          <Button onClick={handleNovaRota} className="gap-2 w-full sm:w-auto shrink-0">
            <Plus className="h-4 w-4" />
            Nova Rota
          </Button>
        </div>

        {/* Monitoring Status Card */}
        {status && (
          <div className={`rounded-lg border p-4 mb-6 ${isMonitoringActive ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' : 'bg-card border-border'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Route className={`h-5 w-5 ${isMonitoringActive ? 'text-green-600' : 'text-muted-foreground'}`} />
                <div>
                  <p className="font-medium">
                    {isMonitoringActive ? 'Monitoramento ativo' : 'Monitoramento inativo'}
                  </p>
                  {isMonitoringActive && status.next_point_index !== undefined && (
                    <p className="text-sm text-muted-foreground">
                      Próximo ponto: {status.next_point_index}
                      {status.consecutive_deviations !== undefined && status.consecutive_deviations > 0 && (
                        <span className="text-amber-600 ml-2">
                          <AlertTriangle className="h-3 w-3 inline mr-1" />
                          {status.consecutive_deviations} desvio(s)
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
              {isMonitoringActive && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDesativar}
                  disabled={desativarMutation.isPending}
                  className="gap-2"
                >
                  {desativarMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <PowerOff className="h-4 w-4" />
                  )}
                  Desativar
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Routes List */}
        <div className="bg-card rounded-lg border border-border">
          {isLoadingRotas ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !rotas || rotas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <Route className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-1">Nenhuma rota cadastrada</p>
              <p className="text-sm text-muted-foreground/70 mb-4">
                Crie uma rota obrigatória para monitorar o trajeto deste veículo.
              </p>
              <Button onClick={handleNovaRota} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Criar primeira rota
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {rotas.map((rota) => {
                const isActiveRoute = isMonitoringActive && status?.route_id === rota.route_id;
                return (
                  <div
                    key={rota.route_id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{rota.name}</p>
                        {isActiveRoute && (
                          <Badge variant="default" className="bg-green-600 hover:bg-green-600 text-xs">
                            Ativa
                          </Badge>
                        )}
                        {rota.auto_block && (
                          <Badge variant="secondary" className="text-xs">
                            Bloqueio auto.
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        {rota.total_distance > 0 && (
                          <span>{(rota.total_distance / 1000).toFixed(1)} km</span>
                        )}
                        {rota.tolerance > 0 && (
                          <span>Tolerância: {rota.tolerance}m</span>
                        )}
                        {rota.confirmation_radius > 0 && (
                          <span>Raio: {rota.confirmation_radius}m</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVisualizar(rota.route_id)}
                        className="gap-1.5"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="hidden sm:inline">Ver</span>
                        <ExternalLink className="h-3 w-3" />
                      </Button>

                      {isActiveRoute ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDesativar}
                          disabled={desativarMutation.isPending}
                          className="gap-1.5"
                        >
                          {desativarMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <PowerOff className="h-4 w-4" />
                          )}
                          <span className="hidden sm:inline">Desativar</span>
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAtivar(rota)}
                          disabled={ativarMutation.isPending || !protocol}
                          className="gap-1.5"
                        >
                          {ativarMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                          <span className="hidden sm:inline">Ativar</span>
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteRoute(rota)}
                        className="gap-1.5 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Excluir</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteRoute} onOpenChange={(open) => !open && setDeleteRoute(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir rota</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a rota "{deleteRoute?.name}"?
              Esta ação não pode ser desfeita. Se a rota estiver ativa, será desativada automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExcluir}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {excluirMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
