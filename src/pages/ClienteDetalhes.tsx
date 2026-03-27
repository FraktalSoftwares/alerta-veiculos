import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { ClientDetailHeader } from "@/components/clients/detail/ClientDetailHeader";
import { ClientDetailTabs } from "@/components/clients/detail/ClientDetailTabs";
import { DadosBasicosTab } from "@/components/clients/detail/DadosBasicosTab";
import { EnderecoTab } from "@/components/clients/detail/EnderecoTab";
import { CobrancaTab } from "@/components/clients/detail/CobrancaTab";
import { VeiculosTab } from "@/components/clients/detail/VeiculosTab";
import { ClientesTab } from "@/components/clients/detail/ClientesTab";
import { AcessoOpcoesTab } from "@/components/clients/detail/AcessoOpcoesTab";
import { NewVehicleModal } from "@/components/vehicles/NewVehicleModal";
import { NewClientModal } from "@/components/clients/NewClientModal";
import { useClient } from "@/hooks/useClients";
import { Loader2 } from "lucide-react";

export default function ClienteDetalhes() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("dados-basicos");
  const [isNewVehicleModalOpen, setIsNewVehicleModalOpen] = useState(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);

  const { data: client, isLoading, error } = useClient(id);

  const headerAction = useMemo(() => {
    if (activeTab === "veiculos") {
      return { label: "Novo Veículo", onClick: () => setIsNewVehicleModalOpen(true) };
    }
    if (activeTab === "clientes") {
      return { label: "Novo Cliente", onClick: () => setIsNewClientModalOpen(true) };
    }
    return null;
  }, [activeTab]);

  const renderTabContent = () => {
    if (!client) return null;

    switch (activeTab) {
      case "dados-basicos":
        return <DadosBasicosTab client={client} />;
      case "endereco":
        return <EnderecoTab client={client} />;
      case "cobranca":
        return <CobrancaTab client={client} />;
      case "veiculos":
        return <VeiculosTab clientId={client.id} />;
      case "clientes":
        return <ClientesTab parentClientId={client.id} />;
      case "acesso":
        return <AcessoOpcoesTab client={client} />;
      default:
        return <DadosBasicosTab client={client} />;
    }
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

  if (error || !client) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <p className="text-destructive">
            {error ? `Erro ao carregar cliente: ${error.message}` : 'Cliente não encontrado'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="px-4 sm:px-6 lg:px-12 py-4 sm:py-6">
        <ClientDetailHeader
          client={client}
          action={headerAction}
        />
        <ClientDetailTabs activeTab={activeTab} onTabChange={setActiveTab} />
        {renderTabContent()}
      </main>

      <NewVehicleModal
        open={isNewVehicleModalOpen}
        onOpenChange={setIsNewVehicleModalOpen}
        preselectedClientId={client.id}
        preselectedClientName={client.name}
      />

      <NewClientModal
        isOpen={isNewClientModalOpen}
        onClose={() => setIsNewClientModalOpen(false)}
        preselectedParentClientId={client.id}
      />
    </div>
  );
}
