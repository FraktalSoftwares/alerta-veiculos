import { ClientBadge } from "./ClientBadge";
import { ClientDisplay } from "@/types/client";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { RequirePermission } from "@/components/auth/PermissionGate";
import { PERMISSIONS } from "@/hooks/useUserPermissions";

interface ClientTableRowProps {
  client: ClientDisplay;
  onClick?: (client: ClientDisplay) => void;
  onEdit?: (client: ClientDisplay) => void;
  onDelete?: (client: ClientDisplay) => void;
}

export function ClientTableRow({ client, onClick, onEdit, onDelete }: ClientTableRowProps) {
  const getBadgeVariant = (type: ClientDisplay['type']) => {
    switch (type) {
      case 'ASSOCIADO':
        return 'associate';
      case 'FRANQUEADO':
        return 'franchisee';
      case 'FROTISTA':
        return 'fleet';
      case 'MOTORISTA':
        return 'driver';
      default:
        return 'client';
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(client);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(client);
  };

  return (
    <div
      onClick={() => onClick?.(client)}
      className="grid grid-cols-[80px_120px_1fr_100px_140px_120px_100px_140px_100px_80px] gap-4 px-6 py-5 text-sm border-b border-border hover:bg-table-row-hover cursor-pointer transition-colors animate-fade-in"
    >
      <div className="text-foreground font-medium truncate">{client.id.slice(0, 8)}</div>
      <div>
        <ClientBadge variant={getBadgeVariant(client.type)}>
          {client.type}
        </ClientBadge>
      </div>
      <div className="text-foreground truncate">{client.name}</div>
      <div className="text-center text-info font-medium">{client.totalVehicles}</div>
      <div className="text-center text-info font-medium">{client.trackedVehicles}</div>
      <div className="text-center text-warning font-medium">{client.noSignal}</div>
      <div className="text-center text-destructive font-medium">{client.offline}</div>
      <div className="text-muted-foreground">{client.lastUpdate}</div>
      <div>
        <ClientBadge variant={client.status === "ATIVO" ? "active" : "inactive"}>
          {client.status}
        </ClientBadge>
      </div>
      <div className="flex items-center justify-end gap-1">
        <RequirePermission code={PERMISSIONS.CLIENTS_EDIT}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleEdit}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </RequirePermission>
        <RequirePermission code={PERMISSIONS.CLIENTS_DELETE}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </RequirePermission>
      </div>
    </div>
  );
}
