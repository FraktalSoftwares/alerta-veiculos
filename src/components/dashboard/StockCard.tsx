import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useEquipmentStats } from "@/hooks/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";

export function StockCard() {
  const { data: stats, isLoading } = useEquipmentStats();

  const data = [
    { name: "Disponíveis", value: stats?.available || 0, color: "#16A34A" },
    { name: "Instalados", value: stats?.installed || 0, color: "#374151" },
    { name: "Manutenção", value: stats?.maintenance || 0, color: "#F59E0B" },
    { name: "Defeituosos", value: stats?.defective || 0, color: "#DC2626" },
  ];

  const hasData = data.some(d => d.value > 0);

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="text-lg font-bold font-heading text-foreground text-center mb-4">Estoque</h3>
      
      <div className="bg-muted/50 rounded-lg p-4 mb-6 text-center">
        {isLoading ? (
          <Skeleton className="h-9 w-24 mx-auto mb-1" />
        ) : (
          <p className="text-3xl font-bold text-foreground">
            {(stats?.total || 0).toLocaleString('pt-BR')}
          </p>
        )}
        <p className="text-sm text-muted-foreground">Rastreadores em Estoque</p>
      </div>
      
      <div className="h-[140px] mb-4">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <Skeleton className="h-[120px] w-[120px] rounded-full" />
          </div>
        ) : hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.filter(d => d.value > 0)}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={60}
                paddingAngle={2}
                dataKey="value"
              >
                {data.filter(d => d.value > 0).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
            Sem dados
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm text-muted-foreground">{item.name}</span>
            </div>
            <span className="text-sm font-medium text-foreground">
              {isLoading ? <Skeleton className="h-4 w-12" /> : item.value.toLocaleString('pt-BR')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
