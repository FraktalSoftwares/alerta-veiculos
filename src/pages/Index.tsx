import { useState } from "react";
import { Users, UserPlus, X, AlertTriangle } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { VehiclesCard } from "@/components/dashboard/VehiclesCard";
import { StockCard } from "@/components/dashboard/StockCard";
import { ClientsCard } from "@/components/dashboard/ClientsCard";
import { useClientStats } from "@/hooks/useDashboard";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`01/01/${currentYear}`);
  const [endDate, setEndDate] = useState(`31/12/${currentYear}`);
  const [filterStartDate, setFilterStartDate] = useState(`01/01/${currentYear}`);
  const [filterEndDate, setFilterEndDate] = useState(`31/12/${currentYear}`);
  const { toast } = useToast();
  const { data: clientStats, isLoading } = useClientStats(filterStartDate, filterEndDate);

  const handleFilter = () => {
    setFilterStartDate(startDate);
    setFilterEndDate(endDate);
    toast({
      title: "Filtro aplicado",
      description: `Período: ${startDate} até ${endDate}`,
    });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      
      <main className="px-[50px] py-8">
        <DashboardHeader
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onFilter={handleFilter}
        />
        
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[140px] rounded-xl" />
            ))
          ) : (
            <>
              <StatCard
                icon={Users}
                label="Clientes Totais Ativos"
                value={(clientStats?.active || 0).toLocaleString('pt-BR')}
                variant="blue"
              />
              <StatCard
                icon={UserPlus}
                label="Novos Clientes"
                value={(clientStats?.newThisMonth || 0).toLocaleString('pt-BR')}
                variant="green"
              />
              <StatCard
                icon={X}
                label="Cancelamentos"
                value={(clientStats?.cancelled || 0).toLocaleString('pt-BR')}
                variant="red"
              />
              <StatCard
                icon={AlertTriangle}
                label="Clientes em atraso"
                value={(clientStats?.overdue || 0).toLocaleString('pt-BR')}
                variant="yellow"
              />
            </>
          )}
        </div>
        
        {/* Revenue Chart */}
        <RevenueChart startDate={filterStartDate} endDate={filterEndDate} />
        
        {/* Bottom Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <VehiclesCard />
          <StockCard />
          <ClientsCard />
        </div>
      </main>
    </div>
  );
};

export default Index;
