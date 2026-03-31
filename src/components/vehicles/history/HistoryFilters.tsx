import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Filter } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface HistoryFiltersProps {
  onFilter: (startDate: Date, endDate: Date) => void;
  isLoading?: boolean;
}

export function HistoryFilters({ onFilter, isLoading }: HistoryFiltersProps) {
  const [startDate, setStartDate] = useState<Date>(() => subDays(new Date(), 1));
  const [endDate, setEndDate] = useState<Date>(() => new Date());
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('23:59');

  const handleFilter = () => {
    const [startH, startM] = startTime.split(':').map(Number);
    const start = new Date(startDate);
    start.setHours(startH || 0, startM || 0, 0, 0);

    const [endH, endM] = endTime.split(':').map(Number);
    const end = new Date(endDate);
    end.setHours(endH || 23, endM || 59, 59, 999);

    onFilter(start, end);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Data/Hora Início</Label>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'flex-1 justify-start text-left font-normal',
                  !startDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, 'dd/MM/yyyy') : 'Data'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => date && setStartDate(date)}
                locale={ptBR}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-24"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Data/Hora Fim</Label>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'flex-1 justify-start text-left font-normal',
                  !endDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, 'dd/MM/yyyy') : 'Data'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(date) => date && setEndDate(date)}
                locale={ptBR}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-24"
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
