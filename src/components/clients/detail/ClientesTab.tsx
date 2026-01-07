import { ClientBadge } from "../ClientBadge";
import { useClients } from "@/hooks/useClients";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ClientesTabProps {
  parentClientId: string;
}

export function ClientesTab({ parentClientId }: ClientesTabProps) {
  const navigate = useNavigate();
  // Note: This would need a filter for parent_client_id when the backend supports it
  // For now, we'll show all clients as a placeholder
  const { data, isLoading } = useClients({ pageSize: 50 });

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border p-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const subClients = data?.clients || [];

  if (subClients.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-12 flex items-center justify-center">
        <p className="text-muted-foreground">Nenhum subcliente cadastrado</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-table-header">
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">#</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Nome</th>
              <th className="text-center px-4 py-3 text-sm font-medium text-muted-foreground">Veículos Totais</th>
              <th className="text-center px-4 py-3 text-sm font-medium text-muted-foreground">Veículos Rastreados</th>
              <th className="text-center px-4 py-3 text-sm font-medium text-muted-foreground">Sem Sinal (GPS)</th>
              <th className="text-center px-4 py-3 text-sm font-medium text-muted-foreground">Desligados</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Última Atualização</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Situação</th>
            </tr>
          </thead>
          <tbody>
            {subClients.map((client, index) => (
              <tr 
                key={client.id}
                onClick={() => navigate(`/clientes/${client.id}`)}
                className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-4 text-sm text-foreground">{index + 1}</td>
                <td className="px-4 py-4 text-sm text-foreground">{client.name}</td>
                <td className="px-4 py-4 text-sm text-foreground text-center">{client.totalVehicles}</td>
                <td className="px-4 py-4 text-sm text-primary text-center font-medium">{client.trackedVehicles}</td>
                <td className="px-4 py-4 text-sm text-warning text-center font-medium">{client.noSignal}</td>
                <td className="px-4 py-4 text-sm text-destructive text-center font-medium">{client.offline}</td>
                <td className="px-4 py-4 text-sm text-foreground">{client.lastUpdate}</td>
                <td className="px-4 py-4 text-right">
                  <ClientBadge variant={client.status === "ATIVO" ? "active" : "inactive"}>
                    {client.status}
                  </ClientBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
