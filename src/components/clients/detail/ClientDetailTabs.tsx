import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ClientDetailTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function ClientDetailTabs({ activeTab, onTabChange }: ClientDetailTabsProps) {
  const tabs = [
    { id: "dados-basicos", label: "Dados Básicos" },
    { id: "endereco", label: "Endereço" },
    { id: "cobranca", label: "Cobrança" },
    { id: "veiculos", label: "Veículos" },
    { id: "clientes", label: "Clientes" },
    { id: "acesso", label: "Acesso e opções" },
  ];

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
