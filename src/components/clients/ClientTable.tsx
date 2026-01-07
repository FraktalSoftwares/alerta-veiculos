import { ClientTableHeader } from "./ClientTableHeader";
import { ClientTableRow } from "./ClientTableRow";
import { ClientDisplay } from "@/types/client";

interface ClientTableProps {
  clients: ClientDisplay[];
  onClientClick?: (client: ClientDisplay) => void;
  onEditClient?: (client: ClientDisplay) => void;
  onDeleteClient?: (client: ClientDisplay) => void;
}

export function ClientTable({ clients, onClientClick, onEditClient, onDeleteClient }: ClientTableProps) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <ClientTableHeader />
      <div className="divide-y divide-border">
        {clients.map((client, index) => (
          <ClientTableRow
            key={`${client.id}-${index}`}
            client={client}
            onClick={onClientClick}
            onEdit={onEditClient}
            onDelete={onDeleteClient}
          />
        ))}
      </div>
    </div>
  );
}
