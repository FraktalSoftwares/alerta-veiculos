import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ClientDetailTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  clientType?: string;
}

// Types that can manage sub-clients
const TYPES_WITH_CLIENTS_TAB = ["admin", "associacao", "franquia", "frotista"];
// Types that can manage vehicles
const TYPES_WITH_VEHICLES_TAB = ["admin", "associacao", "associado", "franquia", "franqueado", "frotista", "motorista"];

export function ClientDetailTabs({ activeTab, onTabChange, clientType }: ClientDetailTabsProps) {
  const allTabs = [
    { id: "dados-basicos", label: "Dados Básicos" },
    { id: "endereco", label: "Endereço" },
    { id: "cobranca", label: "Cobrança" },
    { id: "veiculos", label: "Veículos" },
    { id: "clientes", label: "Clientes" },
    { id: "acesso", label: "Acesso e opções" },
  ];

  const tabs = allTabs.filter((tab) => {
    if (tab.id === "clientes" && clientType && !TYPES_WITH_CLIENTS_TAB.includes(clientType)) return false;
    if (tab.id === "veiculos" && clientType && !TYPES_WITH_VEHICLES_TAB.includes(clientType)) return false;
    return true;
  });

  return (
    <div className="mb-6">
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList className="bg-transparent border-b border-border rounded-none h-auto p-0 gap-0">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-muted-foreground data-[state=active]:text-foreground"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
