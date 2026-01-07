import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Filter } from 'lucide-react';
import { format, subDays } from 'date-fns';

interface HistoryFiltersProps {
  onFilter: (startDate: Date, endDate: Date) => void;
  isLoading?: boolean;
}

export function HistoryFilters({ onFilter, isLoading }: HistoryFiltersProps) {
  const [startDate, setStartDate] = useState(() => {
    const date = subDays(new Date(), 1);
    return format(date, 'yyyy-MM-dd');
  });
  const [endDate, setEndDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));

  const handleFilter = () => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    onFilter(start, end);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="startDate" className="text-sm font-medium">
          Data Início
        </Label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="endDate" className="text-sm font-medium">
          Data Fim
        </Label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Button 
        onClick={handleFilter} 
        className="w-full"
        disabled={isLoading}
      >
        <Filter className="h-4 w-4 mr-2" />
        {isLoading ? 'Carregando...' : 'Filtrar'}
      </Button>
    </div>
  );
}
