import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ClientWithDetails } from "@/types/client";

interface ClientDetailHeaderProps {
  client?: ClientWithDetails;
  onNewVehicleClick: () => void;
}

export function ClientDetailHeader({ client, onNewVehicleClick }: ClientDetailHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">
            {client?.name || 'Detalhes do Cliente'}
          </h1>
          {client?.document_number && (
            <p className="text-sm text-muted-foreground mt-1">
              {client.document_type?.toUpperCase()}: {client.document_number}
            </p>
          )}
        </div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/clientes">Clientes</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Detalhes</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <Button
        onClick={onNewVehicleClick}
        className="bg-foreground hover:bg-foreground/90 text-background gap-2"
      >
        <Plus className="h-4 w-4" />
        Novo Veículo
      </Button>
    </div>
  );
}
