import { VehicleBadge } from "./VehicleBadge";
import { VehicleDisplay } from "@/types/vehicle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { RequirePermission } from "@/components/auth/PermissionGate";
import { PERMISSIONS } from "@/hooks/useUserPermissions";
import {
  MoreVertical,
  MapPin,
  Wifi,
  Lock,
  Unlock,
  User,
  Share2,
  History,
  Pencil,
  Trash2,
  Radio,
  Route,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useVehicleBlockStatus } from "@/hooks/useVehicleBlockStatus";
import { vehicleListStatus } from "@/lib/vehicleMarker";

interface VehicleTableRowProps {
  vehicle: VehicleDisplay;
  onClick?: (vehicle: VehicleDisplay) => void;
  onEdit?: (vehicle: VehicleDisplay) => void;
  onDelete?: (vehicle: VehicleDisplay) => void;
  onBlock?: (vehicle: VehicleDisplay) => void;
  onShowDetails?: (vehicle: VehicleDisplay) => void;
}

export function VehicleTableRow({ vehicle, onClick, onEdit, onDelete, onBlock, onShowDetails }: VehicleTableRowProps) {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(vehicle);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(vehicle);
  };

  const handleShowOnMap = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/veiculos/${vehicle.id}/mapa`);
  };

  const handleBlock = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBlock?.(vehicle);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!vehicle?.id) return;
    
    // Generate public share URL using environment variable or fallback to current origin
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const shareUrl = `${baseUrl}/compartilhar/${vehicle.id}`;
    
    try {
      // Try to use the Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link copiado!",
          description: "O link foi copiado para a área de transferência.",
        });
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        toast({
          title: "Link copiado!",
          description: "O link foi copiado para a área de transferência.",
        });
      }
    } catch (error) {
      console.error("Erro ao copiar link:", error);
      toast({
        title: "Erro",
        description: "Não foi possível copiar o link. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleAction = (action: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (action === "Informações do Cliente" && onShowDetails) {
      onShowDetails(vehicle);
    } else {
      toast({
        title: action,
        description: `Funcionalidade "${action}" será implementada em breve.`,
      });
    }
  };

  const validImei = vehicle.imei && vehicle.imei !== '-' ? vehicle.imei : null;
  const { data: blockStatusData } = useVehicleBlockStatus(validImei);

  const isBlocked = blockStatusData?.blocked ?? vehicle.status === 'bloqueado';
  // Status da LISTA (bloqueio à parte, sinalizado pelo cadeado na placa).
  // Só DESLIGADO quando +7h sem sinal; recebendo sinal (<7h) é sempre Rastreando.
  const listStatus = vehicleListStatus({
    ignition: vehicle.ignition,
    recordedAt: vehicle.lastSignalAt,
  });
  // SITUAÇÃO (badge): 2 estados — RASTREANDO (verde) / DESLIGADO (vermelho, só +7h sem sinal).
  const badgeVariant = listStatus === 'sem-sinal' ? 'sem-sinal' : 'rastreando';
  const badgeLabel = listStatus === 'sem-sinal' ? 'DESLIGADO' : 'RASTREANDO';
  // STATUS (ícone de sinal): 3 cores — verde=ligada, amarelo=desligada c/ sinal, vermelho=+7h sem sinal.
  const pingColor =
    listStatus === 'rastreando'
      ? 'text-green-500'
      : listStatus === 'ocioso'
        ? 'text-yellow-500'
        : 'text-destructive';
  const pingTitle =
    listStatus === 'rastreando'
      ? 'Rastreando (ignição ligada)'
      : listStatus === 'ocioso'
        ? 'Rastreando (ignição desligada, com sinal <7h)'
        : 'Desligado (sem sinal +7h)';

  const actionsDropdown = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 bg-popover z-50">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Localização</DropdownMenuLabel>
        <DropdownMenuItem onClick={handleShowOnMap} className="cursor-pointer">
          <MapPin className="h-4 w-4 mr-2" />
          Mostrar no Mapa
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/veiculos/${vehicle.id}/historico`); }} className="cursor-pointer">
          <History className="h-4 w-4 mr-2" />
          Histórico
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/veiculos/${vehicle.id}/rotas`); }} className="cursor-pointer">
          <Route className="h-4 w-4 mr-2" />
          Rotas
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-xs text-muted-foreground">Configurações</DropdownMenuLabel>
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/veiculos/${vehicle.id}/cercas`); }} className="cursor-pointer">
          <Radio className="h-4 w-4 mr-2" />
          Cercas Virtuais
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-xs text-muted-foreground">Comandos</DropdownMenuLabel>
        <RequirePermission code={PERMISSIONS.VEHICLES_EDIT}>
          <DropdownMenuItem onClick={handleBlock} className="cursor-pointer">
            {isBlocked ? (
              <>
                <Unlock className="h-4 w-4 mr-2" />
                Desbloquear veículo
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Bloquear veículo
              </>
            )}
          </DropdownMenuItem>
        </RequirePermission>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-xs text-muted-foreground">Outros</DropdownMenuLabel>
        <DropdownMenuItem onClick={handleAction("Informações do Cliente")} className="cursor-pointer">
          <User className="h-4 w-4 mr-2" />
          Informações do Cliente
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
          <Share2 className="h-4 w-4 mr-2" />
          Compartilhar
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <RequirePermission code={PERMISSIONS.VEHICLES_EDIT}>
          <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </DropdownMenuItem>
        </RequirePermission>
        <RequirePermission code={PERMISSIONS.VEHICLES_DELETE}>
          <DropdownMenuItem onClick={handleDelete} className="cursor-pointer text-destructive focus:text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </DropdownMenuItem>
        </RequirePermission>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      {/* Mobile compact card */}
      <div
        onClick={() => onClick?.(vehicle)}
        className={`md:hidden flex items-center gap-2 px-3 py-2.5 border-b border-border hover:bg-table-row-hover cursor-pointer transition-colors ${
          isBlocked ? 'bg-destructive/5 border-l-4 border-l-destructive' : ''
        }`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-foreground font-bold text-base truncate">{vehicle.plate}</span>
              {isBlocked && (
                <Lock className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
              )}
            </div>
            <VehicleBadge variant={badgeVariant} className="shrink-0">
              {badgeLabel}
            </VehicleBadge>
          </div>
          <div className="text-xs text-muted-foreground font-mono truncate">{vehicle.imei || '-'}</div>
          <div className="text-xs text-muted-foreground truncate">
            {[vehicle.brand, vehicle.model].filter(Boolean).join(' / ') || '-'}
          </div>
        </div>
        <div className="flex items-center shrink-0">
          {actionsDropdown}
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Desktop grid row */}
      <div
        onClick={() => onClick?.(vehicle)}
        className={`hidden md:grid grid-cols-[1fr_80px_130px_110px_100px_100px_120px_100px_60px] gap-3 px-6 py-3 text-sm border-b border-border hover:bg-table-row-hover cursor-pointer transition-colors ${
          isBlocked ? 'bg-destructive/5 border-l-4 border-l-destructive' : ''
        }`}
      >
      {/* Cliente */}
      <div className="flex items-center">
        <span className="text-foreground font-medium truncate">{vehicle.clientName}</span>
      </div>

      {/* Tipo */}
      <div className="flex items-center">
        <span className="text-muted-foreground text-xs">{vehicle.type || '-'}</span>
      </div>

      {/* IMEI / ESN */}
      <div className="flex items-center">
        <span className="text-foreground text-xs font-mono">{vehicle.imei || '-'}</span>
      </div>

      {/* Placa / Descrição */}
      <div className="flex items-center gap-2">
        <span className="text-foreground font-medium">{vehicle.plate}</span>
        {isBlocked && (
          <Lock className="h-3.5 w-3.5 text-destructive flex-shrink-0" title="Veículo bloqueado" />
        )}
      </div>

      {/* Rastreador */}
      <div className="flex items-center">
        <span className="text-foreground text-xs">{vehicle.tracker || '-'}</span>
      </div>

      {/* Operadora */}
      <div className="flex items-center">
        <span className="text-muted-foreground text-xs">{vehicle.operator || '-'}</span>
      </div>

      {/* Status Indicator (só sinal) */}
      <div className="flex items-center">
        <div className="flex items-center" title={pingTitle}>
          <Wifi className={`h-3.5 w-3.5 ${pingColor}`} />
        </div>
      </div>

      {/* Situação */}
      <div className="flex items-center justify-center">
        <VehicleBadge variant={badgeVariant}>
          {badgeLabel}
        </VehicleBadge>
      </div>

      {/* Ações Dropdown */}
      <div className="flex items-center justify-end">
        {actionsDropdown}
      </div>
      </div>
    </>
  );
}

// Re-export for backwards compatibility
export type { VehicleDisplay as Vehicle };
