import { Car } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useMonthlyRevenue, useFinanceSummary } from "@/hooks/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";

interface RevenueChartProps {
  startDate?: string;
  endDate?: string;
}

export function RevenueChart({ startDate, endDate }: RevenueChartProps) {
  const { data: monthlyData, isLoading: isLoadingMonthly } = useMonthlyRevenue(startDate, endDate);
  
  // Convert DD/MM/YYYY to YYYY-MM-DD for useFinanceSummary
  const parseDate = (dateStr?: string) => {
    if (!dateStr) return undefined;
    const parts = dateStr.split("/");
    if (parts.length !== 3) return undefined;
    const [day, month, year] = parts;
    return `${year}-${month}-${day}`;
  };
  
  const { data: summary, isLoading: isLoadingSummary } = useFinanceSummary(
    parseDate(startDate),
    parseDate(endDate)
  );

  const isLoading = isLoadingMonthly || isLoadingSummary;
  const chartData = monthlyData || [];
  const totalRevenue = summary?.totalRevenue || 0;

  // Calculate max value for Y axis
  const maxValue = Math.max(...chartData.map(d => d.value), 1);
  const yAxisMax = Math.ceil(maxValue * 1.2);

  return (
    <div className="bg-card border border-border rounded-xl p-6 mb-6">
      <h2 className="text-lg font-bold font-heading text-foreground mb-6">Receita mensal</h2>
      
      <div className="flex gap-8">
        <div className="flex flex-col items-start justify-center min-w-[140px]">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-2">
            <Car className="h-5 w-5 text-muted-foreground" />
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-32 mb-1" />
          ) : (
            <p className="text-2xl font-bold text-foreground">
              {totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          )}
          <p className="text-xs text-muted-foreground">No período selecionado</p>
        </div>
        
        <div className="flex-1 h-[250px]">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <Skeleton className="w-full h-full" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  domain={[0, yAxisMax]}
                  tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}
                />
                <Tooltip 
                  formatter={(value: number) => [
                    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
                    'Receita'
                  ]}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="value" fill="hsl(199 89% 48%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
